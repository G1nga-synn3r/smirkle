#!/usr/bin/env python3
"""
Smirkle Desktop - Real-time facial expression detection using OpenCV and DeepFace
Detects happy faces and open eyes, triggers video playback when conditions are met.
"""

import json
import time
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from deepface import DeepFace

# Configuration
CONFIG = {
    "happiness_threshold": 0.3,  # Match web app threshold (30%)
    "eye_aspect_ratio_threshold": 0.2,  # Below this = eyes closed
    "detection_interval": 100,  # ms between detections
    "frame_skip": 2,  # Process every Nth frame
    "webcam_index": 0,  # 0 = default camera
    "display_fps": True,
    "log_detections": True,
}


# Load video library from Smirkle data
def load_video_library():
    """Load video library from src/data/videoLibrary.js"""
    try:
        video_lib_path = Path(__file__).parent / "src" / "data" / "videoLibrary.js"
        if not video_lib_path.exists():
            print(f"⚠️  Video library not found at {video_lib_path}")
            return []

        # Simplified parsing (just extract JSON from the JS file)
        with open(video_lib_path, "r") as f:
            content = f.read()
            # Extract VIDEO_DATABASE array
            if "export const VIDEO_DATABASE" in content:
                start = content.find("[")
                end = content.rfind("]") + 1
                if start != -1 and end > start:
                    json_str = content[start:end]
                    videos = json.loads(json_str)
                    print(f"✅ Loaded {len(videos)} videos from Smirkle library")
                    return videos
    except Exception as e:
        print(f"❌ Error loading video library: {e}")

    return []


class FacialExpressionDetector:
    def __init__(self, config=CONFIG):
        self.config = config
        self.cap = None
        self.face_cascade = None
        self.eye_cascade = None
        self.frame_count = 0
        self.is_happy = False
        self.eyes_open = True
        self.last_detection_time = 0
        self.happiness_score = 0
        self.fps = 0
        self.fps_time = time.time()
        self.fps_counter = 0

        # Initialize cascades
        self._init_cascades()

        # Initialize webcam
        self._init_webcam()

        # Load Smirkle video library
        self.video_library = load_video_library()

        print("✅ Facial Expression Detector initialized")

    def _init_cascades(self):
        """Initialize Haar Cascades for face and eye detection"""
        cascade_path = cv2.data.haarcascades
        self.face_cascade = cv2.CascadeClassifier(
            cascade_path + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cascade_path + "haarcascade_eye.xml"
        )

        if self.face_cascade.empty():
            raise Exception("Failed to load face cascade classifier")
        print("✅ Haar cascades loaded")

    def _init_webcam(self):
        """Initialize webcam"""
        self.cap = cv2.VideoCapture(self.config["webcam_index"])
        if not self.cap.isOpened():
            raise Exception("Failed to open webcam")

        # Set resolution for better performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)

        print(f"✅ Webcam initialized (index: {self.config['webcam_index']})")

    def detect_eyes_open(self, face_roi):
        """Detect if eyes are open using eye cascade and aspect ratio"""
        eyes = self.eye_cascade.detectMultiScale(
            face_roi, scaleFactor=1.1, minNeighbors=4, minSize=(15, 15)
        )

        # Eyes are considered open if at least 2 eyes detected
        if len(eyes) >= 2:
            return True, len(eyes)
        return False, len(eyes)

    def detect_expression(self, frame):
        """Detect facial expressions using DeepFace"""
        try:
            # DeepFace.analyze returns emotions and expressions
            faces = DeepFace.analyze(
                frame, actions=["emotion"], enforce_detection=False
            )

            if not faces:
                return 0, False

            # Get the dominant emotion and happiness score
            face_data = faces[0]
            emotions = face_data.get("emotion", {})

            # Calculate happiness (happy + surprised emotions)
            happiness = (
                emotions.get("happy", 0) / 100
                + emotions.get("surprise", 0) / 100 * 0.3
            )
            happiness = min(happiness, 1.0)  # Clamp to 0-1

            is_happy = happiness >= self.config["happiness_threshold"]

            return happiness, is_happy
        except Exception:
            # DeepFace errors are common with difficult angles
            # Silently continue - we fall back to cascade detection
            return 0, False

    def process_frame(self, frame):
        """Process a single frame for face and expression detection"""
        self.frame_count += 1

        # Skip frames for performance
        if self.frame_count % self.config["frame_skip"] != 0:
            return frame

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) == 0:
            self.is_happy = False
            self.eyes_open = True
            return frame

        # Process first/largest face
        (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
        face_roi = gray[y : y + h, x : x + w]

        # Detect if eyes are open
        self.eyes_open, eye_count = self.detect_eyes_open(face_roi)

        # Detect expression via DeepFace
        current_time = time.time()
        if (
            (current_time - self.last_detection_time) * 1000
            >= self.config["detection_interval"]
        ):
            self.happiness_score, self.is_happy = self.detect_expression(
                frame[y : y + h, x : x + w]
            )
            self.last_detection_time = current_time

        # Draw face box
        color = (0, 255, 0) if not self.is_happy else (0, 0, 255)
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Draw status text
        status = f"Happiness: {self.happiness_score:.2%}"
        status += f" | Eyes: {'OPEN' if self.eyes_open else 'CLOSED'}"
        color = (0, 255, 0) if not self.is_happy else (0, 0, 255)
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        if self.is_happy:
            cv2.putText(
                frame,
                "🎬 SMIRK DETECTED - GAME OVER!",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
            )
        elif self.eyes_open:
            cv2.putText(
                frame,
                "▶️ VIDEO PLAYING - Keep a poker face!",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )
        else:
            cv2.putText(
                frame,
                "🔴 EYES CLOSED - Video paused",
                (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 165, 255),
                2,
            )

        return frame

    def draw_fps(self, frame):
        """Draw FPS counter"""
        if not self.config["display_fps"]:
            return frame

        self.fps_counter += 1
        now = time.time()
        if now - self.fps_time >= 1.0:
            self.fps = self.fps_counter
            self.fps_counter = 0
            self.fps_time = now

        fps_text = f"FPS: {self.fps}"
        cv2.putText(
            frame,
            fps_text,
            (frame.shape[1] - 150, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )
        return frame

    def log_detection(self):
        """Log detection event"""
        if not self.config["log_detections"]:
            return

        timestamp = datetime.now().isoformat()

        if self.is_happy:
            print(
                f"[{timestamp}] 😮 SMIRK DETECTED - Happiness: "
                f"{self.happiness_score:.2%}, Eyes: "
                f"{'OPEN' if self.eyes_open else 'CLOSED'}"
            )

    def can_play_video(self):
        """Check if video should be playing

        Video plays when:
        - Eyes are OPEN
        - Player is NOT smiling (happiness below threshold)

        Game ends when:
        - Player smiles (happiness >= threshold) - WASTED!
        """
        return self.eyes_open and not self.is_happy

    def check_game_over(self):
        """Check if game is over (player smirked)

        Returns True if player has just smiled/smirked
        """
        return self.is_happy and self.eyes_open

    def run(self):
        """Main detection loop"""
        print("\n" + "=" * 60)
        print("🎮 Smirkle Desktop - Keep a Poker Face!")
        print("=" * 60)
        print("Goal: Keep your face NEUTRAL (not smiling) while eyes are OPEN")
        print("Smile = GAME OVER!")
        print("-" * 60)
        print("Press 'q' to quit, 'r' to reset, 's' to start playing")
        print("=" * 60 + "\n")

        game_active = False
        game_over = False

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    print("❌ Failed to read frame")
                    break

                # Flip frame for mirror effect
                frame = cv2.flip(frame, 1)

                # Process frame
                frame = self.process_frame(frame)
                frame = self.draw_fps(frame)

                # Game state management
                if game_active:
                    if self.check_game_over():
                        if not game_over:
                            print(
                                f"\n😮 WASTED! You smiled at "
                                f"{self.happiness_score:.0%} happiness"
                            )
                            print(f"   Eyes open: {self.eyes_open}")
                            game_over = True
                            game_active = False
                    else:
                        # Video is playing
                        if self.can_play_video():
                            pass  # In real app, video would play here
                        else:
                            print("\n⚠️  Eyes closed! Video paused.")
                            game_active = False

                # Display frame
                cv2.imshow("Smirkle Desktop - Facial Expression Detector", frame)

                # Handle key presses
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    print("\n👋 Exiting...")
                    break
                elif key == ord("r"):
                    print("🔄 Reset detector")
                    self.happiness_score = 0
                    self.is_happy = False
                elif key == ord("s"):
                    if not game_active and not game_over:
                        game_active = True
                        game_over = False
                        print("\n🎬 VIDEO STARTED - Keep a poker face!")
                    elif game_over:
                        game_active = True
                        game_over = False
                        print("\n🎬 NEW GAME - Try again, stay serious!")
                    else:
                        game_active = False
                        print("\n⏸️  Game paused")

        except KeyboardInterrupt:
            print("\n👋 Interrupted by user")
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        print("✅ Cleanup complete")


def main():
    """Main entry point"""
    try:
        detector = FacialExpressionDetector()
        detector.run()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
