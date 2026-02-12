# Smirkle Backend - Minimal API

Minimal FastAPI backend service compatible with Vercel Python 3.14 runtime.

## Architecture

**All ML tasks are now handled client-side:**

- **Frontend**: React + TensorFlow.js (face/emotion/smile detection in browser)
- **Backend**: FastAPI on Vercel (non-ML operations: health checks, sessions, etc.)

This architecture ensures compatibility with Vercel's Python 3.14 runtime, which doesn't support TensorFlow.

## Quick Start

### Prerequisites

- Python 3.11+
- pip

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

### Version Information
```
GET http://localhost:8000/api/v1/info
```

### Create Session
```
POST http://localhost:8000/api/v1/session/create
Content-Type: application/json

{
  "user_id": "user123",
  "game_type": "standard"
}
```

### Session Status
```
GET http://localhost:8000/api/v1/session/{session_id}/status
```

### End Session
```
DELETE http://localhost:8000/api/v1/session/{session_id}/end
```

### Documentation
```
# Swagger UI
http://localhost:8000/docs

# ReDoc
http://localhost:8000/redoc
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `false` | Enable debug mode |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

## Frontend Integration

The frontend handles all ML detection client-side using TensorFlow.js. See the frontend repository for:

- `src/hooks/useFaceApi.js` - Face detection hook
- `src/hooks/useDetectionAPI.js` - Emotion/smile detection hook
- `src/components/FaceTracker.jsx` - Face tracking component

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

## Migration Notes

This backend was previously powered by DeepFace (TensorFlow) for emotion detection. Due to Vercel Python 3.14 runtime limitations, all ML capabilities have been moved to the client-side using TensorFlow.js.

Benefits:
- Faster detection (no network latency)
- Better privacy (images stay on device)
- Reduced server costs (no ML inference on backend)
- Full Vercel compatibility

## License

MIT License
