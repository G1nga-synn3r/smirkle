import tensorflow as tf
import logging
import os

logger = logging.getLogger(__name__)

def load_emotion_model():
    """
    Load the emotion recognition model from the models directory.
    
    Returns:
        tf.keras.Model: Loaded emotion detection model
    """
    try:
        # Try different model paths for local vs Docker environments
        model_paths = [
            'public/models/face_expression_model',
            'models/face_expression_model',
            './models/face_expression_model'
        ]
        
        for path in model_paths:
            if os.path.exists(path):
                model = tf.keras.models.load_model(path)
                logger.info(f'Emotion model loaded successfully from: {path}')
                return model
        
        raise FileNotFoundError('Emotion model not found in any expected location')
        
    except Exception as e:
        logger.error(f'Error loading emotion model: {str(e)}')
        raise