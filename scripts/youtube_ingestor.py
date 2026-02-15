"""
YouTube Video Ingestor for Smirkle Project

A bulk video metadata ingestion system that uses the YouTube Data API v3
to search for and ingest funny video metadata into the Smirkle video library.

Usage:
    python youtube_ingestor.py --query "funny cat videos" --max-results 25

Requirements:
    pip install google-api-python-client python-dotenv

Environment Variables:
    YOUTUBE_API_KEY - Your YouTube Data API v3 key
    YOUTUBE_SEARCH_QUERY - Default search query (overridden by --query)
    MAX_RESULTS - Default max results per search
"""

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Configuration
CONFIG = {
    "YOUTUBE_API_KEY": os.getenv("YOUTUBE_API_KEY"),
    # High-intensity funny content queries for Smirkle's fast-paced game loop
    "SEARCH_QUERIES": [
        "hilarious fails 2025",
        "try not to laugh animals",
        "instant regret compilation",
    ],
    "MAX_RESULTS": int(os.getenv("MAX_RESULTS", "25")),
    "OUTPUT_FILE": "src/data/staging_videos.json",
    "MIN_DURATION_SECONDS": 10,  # Fast-paced content minimum
    "MAX_DURATION_SECONDS": 30,  # Fast-paced content maximum (game loop optimized)
    "API_VERSION": "v3",
    "API_SERVICE_NAME": "youtube",
    "THUMBNAIL_BASE_URL": "https://img.youtube.com/vi/{video_id}/{quality}.jpg",
}


class YouTubeIngestor:
    """
    YouTube Video Ingestor for Smirkle Project

    Handles YouTube Data API v3 integration, video search,
    metadata extraction, and schema mapping to Smirkle format.
    """

    def __init__(self, api_key: str):
        """
        Initialize the YouTube API client.

        Args:
            api_key: YouTube Data API v3 key
        """
        if not api_key:
            raise ValueError(
                "YouTube API key is required. Set YOUTUBE_API_KEY environment variable."
            )

        self.api_key = api_key
        self.youtube = build(
            CONFIG["API_SERVICE_NAME"],
            CONFIG["API_VERSION"],
            developerKey=api_key,
        )
        self.existing_ids = self._load_existing_ids()

    def _load_existing_ids(self) -> set:
        """Load existing video IDs to avoid duplicates."""
        existing_ids = set()
        output_file = Path(CONFIG["OUTPUT_FILE"])

        if output_file.exists():
            try:
                with open(output_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for video in data.get("videos", []):
                        existing_ids.add(video.get("id"))
            except (json.JSONDecodeError, IOError) as e:
                print(f"Warning: Could not load existing IDs from {output_file}: {e}")

        return existing_ids

    def _parse_iso_duration(self, duration: str) -> int:
        """
        Parse ISO 8601 duration format to seconds.

        Args:
            duration: ISO 8601 duration string (e.g., 'PT1M30S')

        Returns:
            Duration in seconds
        """
        if not duration:
            return 0

        duration = duration.upper()
        seconds = 0
        multiplier = {"S": 1, "M": 60, "H": 3600}

        value = ""
        for char in duration:
            if char.isdigit():
                value += char
            elif char in multiplier:
                if value:
                    seconds += int(value) * multiplier[char]
                    value = ""

        return seconds

    def _generate_smirkle_id(self, video_id: str) -> str:
        """
        Generate unique Smirkle video ID.

        Args:
            video_id: YouTube video ID

        Returns:
            Unique Smirkle video ID (format: yt_video_XXX)
        """
        counter = 1
        while True:
            smirkle_id = f"yt_video_{counter:03d}"
            if smirkle_id not in self.existing_ids:
                return smirkle_id
            counter += 1

    def _calculate_difficulty(
        self, view_count: int, like_count: int, duration_seconds: int
    ) -> str:
        """
        Calculate video difficulty based on metrics.

        Args:
            view_count: Number of views
            like_count: Number of likes
            duration_seconds: Video duration in seconds

        Returns:
            Difficulty level: 'Easy', 'Medium', or 'Hard'
        """
        # Normalize metrics
        view_score = min(view_count / 1_000_000, 1.0)  # Cap at 1M views
        like_ratio = like_count / max(view_count, 1) if view_count > 0 else 0
        duration_score = min(duration_seconds / 60, 1.0)  # Cap at 60 seconds

        # Base score calculation (weighted)
        difficulty_score = (
            (view_score * 0.3)  # More views = potentially more known = easier
            + (like_ratio * 0.3)  # Higher like ratio = more engaging = harder
            + (duration_score * 0.4)  # Longer = harder (within 60s limit)
        )

        # Map to difficulty levels
        if difficulty_score < 0.33:
            return "Easy"
        elif difficulty_score < 0.66:
            return "Medium"
        else:
            return "Hard"

    def _map_to_smirkle_schema(self, video: dict) -> dict:
        """
        Map YouTube video metadata to Smirkle schema.

        Args:
            video: YouTube API video resource

        Returns:
            Smirkle-formatted video dictionary
        """
        video_id = video["id"]
        snippet = video["snippet"]
        content_details = video.get("contentDetails", {})
        statistics = video.get("statistics", {})

        # Parse duration
        duration_iso = content_details.get("duration", "PT0S")
        duration_seconds = self._parse_iso_duration(duration_iso)

        # Get metrics
        view_count = (
            int(statistics.get("viewCount", 0)) if "viewCount" in statistics else 0
        )
        like_count = (
            int(statistics.get("likeCount", 0)) if "likeCount" in statistics else 0
        )

        # Generate Smirkle-specific fields
        smirkle_id = self._generate_smirkle_id(video_id)
        difficulty = self._calculate_difficulty(view_count, like_count, duration_seconds)

        # Extract thumbnail URL (prefer high quality)
        thumbnails = snippet.get("thumbnails", {})
        preview_image = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or f"{CONFIG['THUMBNAIL_BASE_URL'].format(video_id=video_id, quality='hqdefault')}"
        )

        # Estimate punchline timestamp (typically at 1/3 of video for comedic content)
        punchline_timestamp = (
            round(duration_seconds * 0.33, 1) if duration_seconds > 3 else 0
        )

        # Build Smirkle schema
        smirkle_video = {
            "id": smirkle_id,
            "title": snippet["title"],
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "difficulty": difficulty,
            "tags": self._extract_tags(snippet),
            "previewImage": preview_image,
            "punchlineTimestamp": punchline_timestamp,
            "metadata": {
                "source": "YouTube",
                "source_id": video_id,
                "channel_title": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt", ""),
                "view_count": view_count,
                "like_count": like_count,
                "duration_seconds": duration_seconds,
                "duration_iso": duration_iso,
                "description": snippet.get("description", "")[
                    :500
                ],  # Truncate long descriptions
            },
            "safety_review": {
                "auto_approved": False,
                "reviewed_by": None,
                "reviewed_at": None,
                "approved": False,
                "rejection_reason": None,
                "notes": "Awaiting manual review",
            },
        }

        return smirkle_video

    def _extract_tags(self, snippet: dict) -> List[str]:
        """
        Extract and normalize tags from video snippet.

        Args:
            snippet: YouTube video snippet

        Returns:
            List of normalized tags
        """
        tags = []

        # Extract tags if available
        if "tags" in snippet:
            tags = [tag.lower().strip() for tag in snippet["tags"][:10]]  # Max 10 tags

        # Generate tags from title keywords if none provided
        if not tags:
            title = snippet.get("title", "").lower()
            # Common tag patterns
            keywords = [
                "funny",
                "comedy",
                "fail",
                " Compilation",
                "cats",
                "dogs",
                "baby",
                "animals",
                "prank",
                "humor",
                "laugh",
                "lol",
            ]
            tags = [kw for kw in keywords if kw in title][:5]

        return tags[:10]  # Ensure max 10 tags

    def _preflight_validation(self, video: dict) -> tuple:
        """
        Pre-flight validation: Check if video meets requirements.

        Optimized for Smirkle's fast-paced game loop:
        - Videos must be between 10-30 seconds
        - Live broadcasts are excluded
        - Content safety: blocked keywords filtering

        Args:
            video: YouTube API video resource

        Returns:
            Tuple of (is_valid, rejection_reason)
        """
        content_details = video.get("contentDetails", {})
        duration_iso = content_details.get("duration", "PT0S")
        duration_seconds = self._parse_iso_duration(duration_iso)

        # Check max duration (30s for fast-paced game loop)
        if duration_seconds > CONFIG["MAX_DURATION_SECONDS"]:
            return False, (
                f"Duration exceeds {CONFIG['MAX_DURATION_SECONDS']}s limit "
                f"({duration_seconds}s)"
            )

        # Check minimum duration (10s minimum for comedic content)
        if duration_seconds < CONFIG["MIN_DURATION_SECONDS"]:
            return False, (
                f"Duration too short ({duration_seconds}s), minimum "
                f"{CONFIG['MIN_DURATION_SECONDS']}s required"
            )

        # Check for live broadcasts
        if content_details.get("liveBroadcastContent") == "live":
            return False, "Live broadcasts not allowed"

        # Content safety: Check for blocked keywords in title
        snippet = video.get("snippet", {})
        title = snippet.get("title", "")
        description = snippet.get("description", "")
        blocked_keywords = ["nsfw", "explicit", "18+", "gore", "violence", "death"]

        for keyword in blocked_keywords:
            if keyword.lower() in title.lower() or keyword.lower() in description.lower():
                return False, f"Blocked keyword '{keyword}' found in title/description"

        return True, ""

    def fetch_banger_videos(
        self, query: str = None, max_results: int = 25
    ) -> List[dict]:
        """
        Search for high-intensity funny videos for Smirkle's fast-paced game loop.

        Uses pre-configured high-intensity queries by default:
        - 'hilarious fails 2025'
        - 'try not to laugh animals'
        - 'instant regret compilation'

        Pre-Flight Validation:
        - Videos must be between 10-30 seconds (game loop optimized)
        - Live broadcasts are excluded

        Args:
            query: Optional custom search query
            max_results: Maximum number of results to fetch per query

        Returns:
            List of Smirkle-formatted video dictionaries
        """
        # Use provided query or cycle through high-intensity queries
        if query:
            queries = [query]
        else:
            queries = CONFIG["SEARCH_QUERIES"]

        all_validated_videos = []

        for search_query in queries:
            print(f"\n🔍 Searching YouTube for: '{search_query}'")
            print(f"📊 Max results per query: {max_results}")
            print(
                f"⏱️  Duration filter: {CONFIG['MIN_DURATION_SECONDS']}-"
                f"{CONFIG['MAX_DURATION_SECONDS']}s (game loop optimized)"
            )
            print("-" * 60)

            try:
                # Search for videos
                search_response = (
                    self.youtube.search()
                    .list(
                        q=search_query,
                        type="video",
                        part="id,snippet",
                        maxResults=max_results,
                        relevanceLanguage="en",
                        safeSearch="strict",  # Content safety: strict filtering
                    )
                    .execute()
                )

                # Extract video IDs
                video_ids = []
                for item in search_response.get("items", []):
                    if item["id"]["kind"] == "youtube#video":
                        video_ids.append(item["id"]["videoId"])

                if not video_ids:
                    print(f"⚠️  No videos found for query: '{search_query}'")
                    continue

                print(f"📺 Found {len(video_ids)} videos in search results")

                # Batch fetch video details
                details_response = (
                    self.youtube.videos()
                    .list(
                        part="id,snippet,contentDetails,statistics",
                        id=",".join(video_ids),
                    )
                    .execute()
                )

                # Validate and map to Smirkle schema
                validated_videos = []
                skipped_videos = []

                for video in details_response.get("items", []):
                    # Pre-flight validation
                    is_valid, reason = self._preflight_validation(video)

                    if not is_valid:
                        skipped_videos.append(
                            {
                                "video_id": video["id"],
                                "title": video["snippet"]["title"],
                                "reason": reason,
                            }
                        )
                        continue

                    # Map to Smirkle schema
                    smirkle_video = self._map_to_smirkle_schema(video)
                    validated_videos.append(smirkle_video)
                    self.existing_ids.add(smirkle_video["id"])

                # Print summary for this query
                print(f"✅ Validated: {len(validated_videos)} videos")
                print(f"❌ Skipped: {len(skipped_videos)} videos")

                if skipped_videos:
                    print("\n📋 Skipped videos:")
                    for skipped in skipped_videos[:3]:  # Show first 3
                        print(f"   - {skipped['title'][:50]}...")
                        print(f"     Reason: {skipped['reason']}")
                    if len(skipped_videos) > 3:
                        print(f"   ... and {len(skipped_videos) - 3} more")

                all_validated_videos.extend(validated_videos)

            except HttpError as e:
                error_content = json.loads(e.content.decode("utf-8"))
                error_reason = (
                    error_content.get("error", {})
                    .get("errors", [{}])[0]
                    .get("reason", "Unknown")
                )
                print(f"❌ API error for query '{search_query}': {error_reason}")
                continue

        print(
            f"\n🏁 Total validated videos from all queries: "
            f"{len(all_validated_videos)}"
        )
        return all_validated_videos

    def save_to_staging(self, videos: List[dict], batch_id: str = None) -> str:
        """
        Save validated videos to staging file.

        Args:
            videos: List of Smirkle-formatted videos
            batch_id: Optional batch identifier

        Returns:
            Path to saved file
        """
        output_file = Path(CONFIG["OUTPUT_FILE"])
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Create or load existing staging data
        staging_data = {
            "version": "1.0",
            "lastUpdated": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "stagingStatus": "PENDING_REVIEW",
            "videos": [],
            "batch_info": {},
        }

        if output_file.exists():
            try:
                with open(output_file, "r", encoding="utf-8") as f:
                    staging_data = json.load(f)
            except (json.JSONDecodeError, IOError):
                pass  # Use default structure

        # Generate batch ID if not provided
        if not batch_id:
            batch_id = f"batch_{datetime.now().strftime('%Y_%m_%d_%H%M%S')}"

        # Append new videos
        existing_ids = {v["id"] for v in staging_data["videos"]}
        new_videos = []

        for video in videos:
            if video["id"] not in existing_ids:
                staging_data["videos"].append(video)
                new_videos.append(video)

        # Update batch info
        staging_data["batch_info"] = {
            "batch_id": batch_id,
            "ingested_at": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "total_videos": len(staging_data["videos"]),
            "pending_review": len(
                [v for v in staging_data["videos"] if not v["safety_review"]["approved"]]
            ),
            "approved": len(
                [v for v in staging_data["videos"] if v["safety_review"]["approved"]]
            ),
            "rejected": 0,
        }

        # Write to file
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(staging_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Saved {len(new_videos)} new videos to {output_file}")
        print(f"📁 Total videos in staging: {len(staging_data['videos'])}")
        print(f"🆔 Batch ID: {batch_id}")

        return str(output_file)


def main():
    """Main entry point for the YouTube video ingestor."""
    parser = argparse.ArgumentParser(
        description=(
            "YouTube Video Ingestor for Smirkle Project\n"
            "Searches for high-intensity funny content "
            "optimized for the fast-paced game loop."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
High-Intensity Search Queries (default):
  • hilarious fails 2025
  • try not to laugh animals
  • instant regret compilation

Duration Filter: 10-30 seconds (game loop optimized)

Examples:
  # Use default high-intensity queries
  python youtube_ingestor.py

  # Custom search query
  python youtube_ingestor.py --query "funny pets compilation" --max-results 50

  # Dry run (test without saving)
  python youtube_ingestor.py --dry-run

Environment Variables:
  YOUTUBE_API_KEY  - Your YouTube Data API v3 key (required)
  MAX_RESULTS      - Max results per query (default: 25)
        """,
    )

    parser.add_argument(
        "--query",
        "-q",
        type=str,
        default=None,
        help="Custom search query (uses high-intensity queries if not specified)",
    )

    parser.add_argument(
        "--max-results",
        "-m",
        type=int,
        default=CONFIG["MAX_RESULTS"],
        help=f"Maximum number of results per query (default: {CONFIG['MAX_RESULTS']})",
    )

    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=CONFIG["OUTPUT_FILE"],
        help=f"Output file path (default: {CONFIG['OUTPUT_FILE']})",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without saving to file (for testing)",
    )

    args = parser.parse_args()

    # Validate API key
    if not CONFIG["YOUTUBE_API_KEY"]:
        print("❌ Error: YOUTUBE_API_KEY environment variable not set.")
        print("\nTo fix this:")
        print("1. Set the environment variable:")
        print("   - Windows (PowerShell): $env:YOUTUBE_API_KEY='your_key'")
        print("   - Windows (CMD): set YOUTUBE_API_KEY=your_key")
        print("   - Linux/Mac: export YOUTUBE_API_KEY='your_key'")
        print("   - Or use the .env file in the project root")
        return 1

    # Initialize ingestor
    print("🚀 Smirkle YouTube Video Ingestor")
    print("=" * 60)
    print(f"📁 Output: {args.output}")
    print(
        f"⏱️  Duration: {CONFIG['MIN_DURATION_SECONDS']}-"
        f"{CONFIG['MAX_DURATION_SECONDS']}s (game loop optimized)"
    )

    try:
        ingestor = YouTubeIngestor(CONFIG["YOUTUBE_API_KEY"])

        # Fetch videos (uses SEARCH_QUERIES if no custom query provided)
        videos = ingestor.fetch_banger_videos(
            query=args.query, max_results=args.max_results
        )

        if not videos:
            print("\n⚠️  No valid videos found. Try adjusting your search query.")
            return 0

        # Save to staging (unless dry run)
        if args.dry_run:
            print(f"\n🔍 Dry run - {len(videos)} videos would be saved:")
            for video in videos[:3]:
                print(f"   ID: {video['id']}")
                print(f"   Title: {video['title'][:50]}...")
                print(f"   Thumbnail: {video['previewImage']}")
                print(f"   URL: {video['url']}")
                print()
            print(f"   ... and {len(videos) - 3} more videos")
        else:
            ingestor.save_to_staging(videos)

        print("\n✅ Ingestion complete!")
        return 0

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
