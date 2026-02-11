# Emotion Recognition Service

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import tensorflow as tf
import cv2
import numpy as np

# Load TensorFlow model
model = tf.keras.models.load_model('public/models/face_expression_model-shard1')

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    data = request.get_json()
    frame = data['frame']
    # Convert frame to numpy array and preprocess
    frame = cv2.imdecode(np.frombuffer(frame, dtype=np.uint8), cv2.IMREAD_COLOR)
    frame = cv2.resize(frame, (48, 48))
    frame = np.expand_dims(frame, axis=0) / 255.0
    prediction = model.predict(frame)
    happiness_score = prediction[0][0]
    
    # Check for smirk (happiness ≥ 0.3)
    if happiness_score >= 0.3:
        emit('game_over', {'score': happiness_score})
    
    return jsonify({'happiness_score': happiness_score})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
