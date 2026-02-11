import logging
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from .services.model_loader import load_emotion_model
from .services.emotion_detection import process_frame

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'emotion-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

model = None

def initialize_model():
    global model
    try:
        model = load_emotion_model()
        logger.info("Emotion recognition model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load emotion model: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    from flask import request
    data = request.get_json()
    if not data or 'frame' not in data:
        return jsonify({'error': 'No frame data provided'}), 400
    
    result = process_frame(data['frame'], model)
    return jsonify(result)

@socketio.on('connect', namespace='/detection')
def handle_connect():
    logger.info('Client connected to /detection namespace')
    emit('connected', {'message': 'Connected to emotion detection service'})

@socketio.on('disconnect', namespace='/detection')
def handle_disconnect():
    logger.info('Client disconnected from /detection namespace')

@socketio.on('video_frame', namespace='/detection')
def handle_video_frame(frame_data):
    result = process_frame(frame_data, model)
    emit('detection_result', result)
    
    if result.get('is_smirk'):
        emit('game_over', {
            'status': 'failed',
            'score': result['score'],
            'message': 'Smirk detected! Game Over.'
        })

if __name__ == '__main__':
    initialize_model()
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)