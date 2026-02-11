# Smirkle Backend - Emotion Recognition API

FastAPI-based backend service for facial emotion detection using DeepFace.

## Quick Start

### Prerequisites

- Python 3.11+
- pip
- (Optional) Docker

### Installation

1. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run the server**
```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

### Using Docker

```bash
docker-compose up --build
```

## API Endpoints

### Health Check
```
GET http://localhost:8000/api/v1/health
```

### Analyze Emotion (Base64)
```
POST http://localhost:8000/api/v1/analyze-emotion
Content-Type: application/json

{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1699999999123.45,
  "frame_number": 42,
  "quality_check": true
}
```

### Analyze Emotion (File Upload)
```
POST http://localhost:8000/api/v1/analyze-emotion/upload
Content-Type: multipart/form-data

session_id: "550e8400-e29b-41d4-a716-446655440000"
timestamp: 1699999999123.45
file: @frame.jpg
```

### Model Information
```
GET http://localhost:8000/api/v1/models
```

### Documentation
```
# Swagger UI
http://localhost:8000/docs

# ReDoc
http://localhost:8000/redoc
```

## Response Examples

### Successful Detection
```json
{
  "status": "success",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "detection_id": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": 1699999999123.45,
  "server_timestamp": "2026-02-11T09:23:35.411Z",
  "processing_time_ms": 15.2,
  "face_detected": true,
  "face_data": {
    "bounding_box": {"x": 150, "y": 80, "w": 200, "h": 240},
    "confidence": 0.95
  },
  "emotions": {
    "happy": 0.12,
    "sad": 0.05,
    "angry": 0.02,
    "surprise": 0.03,
    "fear": 0.01,
    "disgust": 0.01,
    "neutral": 0.76
  },
  "happiness": 0.12,
  "is_smirk": false,
  "smirk_reason": null,
  "consecutive_smirk_count": 0,
  "game_over": false,
  "game_over_reason": null
}
```

### Smirk Detected (Game Over)
```json
{
  "status": "success",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "detection_id": "550e8400-e29b-41d4-a716-446655440005",
  "timestamp": 1699999999456.78,
  "server_timestamp": "2026-02-11T09:23:39.456Z",
  "processing_time_ms": 12.8,
  "face_detected": true,
  "emotions": {
    "happy": 0.42,
    "sad": 0.03,
    "angry": 0.01,
    "surprise": 0.05,
    "fear": 0.01,
    "disgust": 0.01,
    "neutral": 0.47
  },
  "happiness": 0.42,
  "is_smirk": true,
  "smirk_reason": "consecutive_frames",
  "consecutive_smirk_count": 3,
  "game_over": true,
  "game_over_reason": "smirk_detected"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `DEEPFACE_MODEL` | `VGG-Face` | DeepFace model to use |
| `DEEPFACE_DETECTOR` | `opencv` | Face detector backend |
| `SMIRK_THRESHOLD` | `0.3` | Happiness threshold for smirk |
| `CONSECUTIVE_FRAMES_REQUIRED` | `3` | Frames before game over |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### Supported Models

| Model | Accuracy | Speed |
|-------|----------|-------|
| VGG-Face | High | Medium |
| Facenet | High | Fast |
| ArcFace | High | Medium |
| DeepFace | Medium | Fast |
| OpenFace | Medium | Fast |
| Dlib | Medium | Medium |

## Frontend Integration

### JavaScript Example

```javascript
const API_URL = 'http://localhost:8000/api/v1';

async function analyzeFrame(frameData, sessionId) {
  const response = await fetch(`${API_URL}/analyze-emotion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frame: frameData,
      session_id: sessionId,
      timestamp: Date.now(),
      frame_number: frameCount++,
      quality_check: true
    })
  });
  
  return await response.json();
}

// Handle game over
if (result.game_over && result.game_over_reason === 'smirk_detected') {
  console.log('Game Over! Smirk detected!');
  // Trigger game over UI
}
```

### React Hook Example

See `src/hooks/useDetectionAPI.js` in the frontend repository for a complete implementation.

## Development

### Running Tests

```bash
pytest tests/ -v
```

### Code Style

```bash
# Format code
black app/

# Lint code
flake8 app/
```

## License

MIT License
