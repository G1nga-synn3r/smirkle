#!/usr/bin/env python3
"""
Smirkle Lite - Fast facial expression detection using only OpenCV Haar Cascades
No DeepFace/TensorFlow dependency. Good for testing and offline use.
Less accurate than DeepFace but much faster (~60+ FPS).
"""

import time

import cv2
import numpy as np

CONFIG = {
    "happiness_threshold": 0.4,  # Adjusted for Haar Cascade (40%)
    "eye_aspect_ratio_threshold": 0.2,
    "frame_skip": 1,  # Process every frame
    "webcam_index": 0,
    "display_fps": True,
    "log_detections": True,
}


class SmileDetectorLite:
    """Lightweight smile detector using Haar Cascades"""

    def __init__(self):
        self.cap = None
        self.face_cascade = None
        self.smile_cascade = None
        self.eye_cascade = None
        self.frame_count = 0
        self.is_smiling = False
        self.smile_score = 0
        self.eyes_open = True
        self.fps = 0
        self.fps_time = time.time()
        self.fps_counter = 0

        self._init_cascades()
        self._init_webcam()
        print("✅ Lite Detector initialized (OpenCV Haar Cascades only)")

    def _init_cascades(self):
        """Load Haar Cascade classifiers"""
        cascade_path = cv2.data.haarcascades

        self.face_cascade = cv2.CascadeClassifier(
            cascade_path + "haarcascade_frontalface_default.xml"
        )
        self.smile_cascade = cv2.CascadeClassifier(
            cascade_path + "haarcascade_smile.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(cascade_path + "haarcascade_eye.xml")

        if self.face_cascade.empty():
            raise Exception("Failed to load cascades")
        print("✅ Haar Cascades loaded")

    def _init_webcam(self):
        """Initialize webcam"""
        self.cap = cv2.VideoCapture(CONFIG["webcam_index"])
        if not self.cap.isOpened():
            raise Exception("Failed to open webcam")

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)

        print("✅ Webcam initialized")

    def calculate_smile_confidence(self, face_roi, num_smiles):
        """Calculate smile confidence (0-1) based on detected smiles"""
        # More smiles detected = higher confidence
        # Adjust threshold based on face size
        face_area = face_roi.shape[0] * face_roi.shape[1]
        expected_smiles = face_area / 50000  # Empirical value

        if num_smiles == 0:
            return 0.0

        confidence = min(num_smiles / max(expected_smiles, 1), 1.0)
        return confidence

    def detect_eyes_open(self, face_roi):
        """Detect if eyes are open"""
        eyes = self.eye_cascade.detectMultiScale(
            face_roi, scaleFactor=1.1, minNeighbors=4, minSize=(15, 15)
        )
        return len(eyes) >= 2, len(eyes)

    def process_frame(self, frame):
        """Process frame for smile detection"""
        self.frame_count += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) == 0:
            self.is_smiling = False
            self.smile_score = 0
            self.eyes_open = True
            return frame

        # Process largest face
        (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
        face_roi = gray[y : y + h, x : x + w]

        # Detect smiles
        smiles = self.smile_cascade.detectMultiScale(
            face_roi, scaleFactor=1.8, minNeighbors=20, minSize=(25, 25)
        )

        # Detect eyes
        self.eyes_open, eye_count = self.detect_eyes_open(face_roi)

        # Calculate smile confidence
        self.smile_score = self.calculate_smile_confidence(face_roi, len(smiles))
        self.is_smiling = self.smile_score >= CONFIG["happiness_threshold"]

        # Draw face box
        color = (0, 255, 0) if not self.is_smiling else (0, 0, 255)
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Draw smile boxes
        for sx, sy, sw, sh in smiles:
            cv2.rectangle(
                frame, (x + sx, y + sy), (x + sx + sw, y + sy + sh), (255, 0, 0), 2
            )

        # Draw status
        status = f"Smile: {self.smile_score:.0%} | Eyes: {'OPEN' if self.eyes_open else 'CLOSED'}"
        color = (0, 255, 0) if not self.is_smiling else (0, 0, 255)
        cv2.putText(
            frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2
        )

        if self.is_smiling:
            cv2.putText(
                frame,
                "😮 SMIRK DETECTED - GAME OVER!",
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
        self.fps_counter += 1
        now = time.time()
        if now - self.fps_time >= 1.0:
            self.fps = self.fps_counter
            self.fps_counter = 0
            self.fps_time = now

        cv2.putText(
            frame,
            f"FPS: {self.fps}",
            (frame.shape[1] - 150, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )
        return frame

    def can_play_video(self):
        """Check if video should be playing

        Video plays when:
        - Eyes are OPEN
        - Player is NOT smiling (smile_score below threshold)
        """
        return self.eyes_open and not self.is_smiling

    def check_game_over(self):
        """Check if game is over (player smirked)"""
        return self.is_smiling and self.eyes_open

    def run(self):
        """Main loop"""
        print("\n" + "=" * 60)
        print("🎮 Smirkle Lite - Keep a Poker Face!")
        print("=" * 60)
        print("Goal: Keep your face NEUTRAL (not smiling) while eyes are OPEN")
        print("Smile = GAME OVER! (WASTED)")
        print("-" * 60)
        print("Press 'q' to quit, 'r' to reset, 's' to start playing")
        print("=" * 60 + "\n")

        game_active = False
        game_over = False

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break

                frame = cv2.flip(frame, 1)
                frame = self.process_frame(frame)
                frame = self.draw_fps(frame)

                # Game state management
                if game_active:
                    if self.check_game_over():
                        if not game_over:
                            print(f"\n😮 WASTED! You smiled at {self.smile_score:.0%}")
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

                cv2.imshow("Smirkle Lite - Smile Detector", frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    print("\n👋 Exiting...")
                    break
                elif key == ord("r"):
                    print("🔄 Reset detector")
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
            print("\n👋 Interrupted")
        finally:
            self.cleanup()

    def cleanup(self):
        """Cleanup"""
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()


def main():
    try:
        detector = SmileDetectorLite()
        detector.run()
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    return 0


if __name__ == "__main__":
    exit(main())
