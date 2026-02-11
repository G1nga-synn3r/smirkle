import unittest
from flask import json
from src.app import app, socketio
from src.services.model_loader import load_emotion_model
from src.services.emotion_detection import process_frame

class EmotionDetectionTest(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.socketio = socketio
        self.model = load_emotion_model()

    def test_detect_emotion_endpoint(self):
        # Test valid frame data
        frame_data = {
