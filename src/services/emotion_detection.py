import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def process_frame(frame_data, model):
    """
    Process a video frame and return emotion detection results.
    
    Args:
        frame_data: Raw image bytes from webcam
        model: Loaded TensorFlow emotion detection model
    
    Returns:
        dict: Detection results with happiness score and smirk status
    """
    try:
        # Decode image from bytes
        nparr = np.frombuffer(frame_data, dtype=np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {
                'status': 'error',
                'message': 'Invalid image data'
            }
        
        # Preprocess for model input
        frame = cv2.resize(frame, (48, 48))
        frame = np.expand_dims(frame, axis=0) / 255.0
        
        # Predict emotion
        prediction = model.predict(frame, verbose=0)
        happiness_score = float(prediction[0][0])
        
        logger.debug(f"Detected happiness score: {happiness_score}")
        
        return {
            'status': 'success',
            'score': happiness_score,
            'is_smirk': happiness_score >= 0.3
        }
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
        }