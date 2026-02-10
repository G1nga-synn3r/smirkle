# Smirkle Desktop - Facial Expression Detector

Real-time facial expression detection using OpenCV and DeepFace. Detects happy faces and open eyes to trigger video playback.

## Features

- 🎥 Real-time webcam capture and processing
- 😮 Happiness detection (threshold: 30%, matches web app)
- 👁️ Eye detection and open/closed state
- 📹 Integration with Smirkle video library
- 📊 FPS counter and performance metrics
- 🎬 Video playback trigger when conditions are met

## Requirements

- Python 3.8+
- Webcam
- GPU recommended (CUDA for faster face detection)

## Installation

### 1. Create Python virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r scripts/requirements.txt
```

> **Note**: First install will take a few minutes as TensorFlow downloads models (~500 MB)

### 3. Verify setup

```bash
python scripts/facial_expression_detector.py
```

You should see a webcam window open showing your face with expression detection.

## Usage

```bash
# Run the detector
python scripts/facial_expression_detector.py
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Reset detector |
| `s` | Toggle smile test logging |

### Output

The detector displays:
- **Face box**: Green = neutral, Red = smirk detected
- **Happiness %**: Current happiness score (0-100%)
- **Eye status**: OPEN or CLOSED
- **Eyes detected**: Number of eyes found in face ROI
- **FPS**: Frames per second performance

### Example Output

```
============================================================
🎮 Smirkle Desktop - Facial Expression Detection
============================================================
Press 'q' to quit, 'r' to reset, 's' to toggle smile test
============================================================

✅ Haar cascades loaded
✅ Webcam initialized (index: 0)
✅ Loaded 12 videos from Smirkle library
✅ Facial Expression Detector initialized

[2026-02-10T14:32:45.123456] 😮 SMIRK DETECTED - Happiness: 45.32%, Eyes: OPEN
🎬 Playing: Cat Video Fail (Type: funny)
   URL: https://example.com/...
   Difficulty: Hard
```

## Configuration

Edit the `CONFIG` dict in `facial_expression_detector.py`:

```python
CONFIG = {
    'happiness_threshold': 0.3,      # Smirk threshold (30%)
    'eye_aspect_ratio_threshold': 0.2,  # Eyes closed threshold
    'detection_interval': 100,       # ms between DeepFace detections
    'frame_skip': 2,                 # Process every Nth frame
    'webcam_index': 0,               # 0 = default camera
    'display_fps': True,             # Show FPS counter
    'log_detections': True,          # Log detections to console
}
```

## Troubleshooting

### Slow performance / Low FPS

- Increase `frame_skip` to skip more frames
- Reduce webcam resolution in `_init_webcam()`
- Use GPU: Install `tensorflow-gpu` and `tensorflow[and-cuda]`

### DeepFace errors

- `Could not detect face in the image`: Normal at angles/lighting
- Falls back to basic Haar Cascade detection
- Adjust `minNeighbors` in `detectMultiScale()` for sensitivity

### Webcam not found

- Check your camera index: try changing `webcam_index` in CONFIG
- On Windows: check Device Manager for camera
- On macOS: Grant camera permissions in System Preferences

### Installation issues

```bash
# Clear cache and reinstall
pip install --upgrade --force-reinstall -r scripts/requirements.txt

# For TensorFlow GPU support (CUDA 11.8)
pip install tensorflow[and-cuda]==2.13.0
```

## Integration with Smirkle Web App

The detector can be extended to:

1. **Training data collection**: Save frames where smirks are detected
2. **Model validation**: Compare DeepFace results with face-api.js
3. **Threshold tuning**: Test different happiness thresholds
4. **Offline testing**: Test game logic without browser/internet

## Performance Notes

- **CPU**: ~20-30 FPS on modern laptop
- **GPU**: ~50-60 FPS with CUDA
- **Memory**: ~500 MB base + TensorFlow models

## License

Same as Smirkle project (MIT)
