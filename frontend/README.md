# InsightFace-REST Web Frontend

A modern, user-friendly web interface for the InsightFace-REST API with support for both **image** and **video** processing.

![Frontend Demo](screenshot.png)

## 🌟 Features

### ✨ Core Capabilities
- **📷 Image Processing** - Upload images or paste URLs for face detection and recognition
- **🎥 Video Processing** - Extract frames from videos and process them sequentially
- **🎨 Visual Detection** - Draw bounding boxes, landmarks, and labels on detected faces
- **📊 Detailed Results** - View confidence scores, embeddings, demographics, and timing information
- **⚙️ Configurable Parameters** - Adjust detection threshold, face limits, and processing options
- **🔍 Real-time Preview** - See images and results in real-time

### 🎯 Supported Operations

#### Image Processing
- Face detection with bounding boxes
- Face recognition (embedding extraction)
- Gender and age estimation
- Facial landmark detection (5 key points)
- Face mask detection
- Multiple image formats (JPEG, PNG, BMP, WebP)
- Base64 encoding support

#### Video Processing
- Frame extraction at configurable intervals
- Batch processing of video frames
- Progress tracking with visual feedback
- Frame-by-frame face detection statistics
- Timeline analysis of face counts

#### Visualization
- Interactive bounding box overlay
- Facial landmark markers
- Confidence score labels
- Age and gender annotations
- Color-coded detection feedback

---

## 🚀 Quick Start

### 1. Start the InsightFace-REST API

First, ensure the backend API is running:

```bash
# From the repository root
./deploy_trt.sh  # For GPU
# or
./deploy_cpu.sh  # For CPU
```

The API should be running at `http://localhost:18081`

### 2. Open the Frontend

#### Option A: Simple HTTP Server (Python)
```bash
cd frontend
python3 -m http.server 8000
```
Then open: `http://localhost:8000`

#### Option B: Node.js HTTP Server
```bash
cd frontend
npx http-server -p 8000
```
Then open: `http://localhost:8000`

#### Option C: Direct File Access
Simply double-click `index.html` - it should work in most browsers, but CORS may block some features.

### 3. Configure API Connection

1. Click **"Health Check"** to verify the API is accessible
2. Adjust the **API URL** if your backend is on a different host/port
3. Click **"Server Info"** to see loaded models and configuration

---

## 📖 Usage Guide

### 🖼️ Image Processing Tab

#### Upload an Image
1. Click the upload area or drag & drop an image
2. Or paste an image URL in the text field and click "Load"
3. Configure options:
   - ✅ **Extract Embeddings** - Generate 512-d face vectors for recognition
   - ✅ **Extract Gender & Age** - Predict demographics
   - ✅ **Show Landmarks** - Display facial keypoints
   - ✅ **Detect Masks** - Check for medical mask presence
4. Click **"🚀 Process Image"**

#### Results
- **Visual overlay**: Bounding boxes and labels appear on the image
- **JSON results**: Detailed information shown below (confidence, embeddings, timing)
- **Face data**: Click to expand embedding vectors

### 🎬 Video Processing Tab

#### Process a Video
1. Click the upload area to select a video file (MP4, WebM, AVI)
2. Set **Frame Sampling Rate** (e.g., 30 = process 1 frame every 30 frames)
   - Higher values = faster processing, fewer frames analyzed
   - Lower values = more thorough analysis, slower processing
3. Click **"🎥 Extract & Process Frames"**
4. Watch the progress bar as frames are extracted and analyzed

#### Results
- **Summary**: Total frames processed, faces detected, averages
- **Timeline table**: Timestamp and face count for each analyzed frame
- **Statistics**: Identify when faces appear/disappear in the video

### 🎨 Draw Detections Tab

This mode draws visualizations directly on the image (processed server-side):

1. Upload an image
2. Configure drawing options:
   - ✅ **Draw Landmarks** - Show facial keypoints
   - ✅ **Draw Scores** - Display confidence percentages
   - ✅ **Draw Face Sizes** - Show face dimensions
3. Click **"🎨 Draw Detections"**
4. Download the annotated image

---

## ⚙️ Configuration Options

### API Settings

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| **API URL** | Backend server address | `http://localhost:18081` | Any valid URL |
| **Detection Threshold** | Minimum confidence for face detection | `0.6` | 0.0 - 1.0 |
| **Max Faces** | Limit number of faces to process | `0` (unlimited) | 0 - 1000 |

### Image Processing Options

| Option | Description | Impact |
|--------|-------------|--------|
| **Extract Embeddings** | Generate 512-d face vectors | Required for face recognition/matching |
| **Extract Gender & Age** | Predict demographics | Adds ~1-2ms per face |
| **Show Landmarks** | Detect facial keypoints | Minimal overhead |
| **Detect Masks** | Check for medical masks | Adds ~1ms per face |

### Video Processing Options

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **Frame Sampling Rate** | Process 1 frame every N frames | 30 for 1 fps analysis, 10 for detailed tracking |

---

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│         Web Browser (Frontend)          │
│  ┌────────────┐      ┌───────────────┐ │
│  │   HTML5    │◄────►│  JavaScript   │ │
│  │  UI Layer  │      │  (Async API)  │ │
│  └────────────┘      └───────┬───────┘ │
└──────────────────────────────┼─────────┘
                               │ HTTP/JSON
                               ▼
┌─────────────────────────────────────────┐
│    InsightFace-REST API (Backend)       │
│         FastAPI + TensorRT              │
└─────────────────────────────────────────┘
```

### Key Technologies

**Frontend:**
- Pure HTML5/CSS3/JavaScript (no frameworks required)
- Tailwind CSS for styling
- Canvas API for video frame extraction
- File API for local file handling
- Fetch API for HTTP requests

**Video Frame Extraction:**
- Uses HTML5 `<video>` element to load video
- Seeks to specific timestamps
- Draws frames to `<canvas>`
- Converts canvas to base64 JPEG
- Sends to API as image data

### Browser Requirements

- **Modern browsers** with ES6 support (Chrome 60+, Firefox 60+, Safari 12+, Edge 79+)
- **HTML5 Canvas** support
- **File API** support
- **Fetch API** support

---

## 🎨 UI Screenshots

### Image Processing
Upload images, configure detection parameters, and see results with visual overlays.

### Video Processing
Extract frames from videos and track faces across time with progress indicators.

### Draw Detections
Server-side visualization with professional annotations.

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to server"
- **Check API is running**: Run `curl http://localhost:18081/health`
- **Check firewall**: Ensure port 18081 is accessible
- **Check CORS**: If using `file://` protocol, run a local web server instead
- **Update API URL**: Change to correct host/port in settings

### ❌ "Failed to load image"
- **Check image URL**: Ensure URL is publicly accessible
- **Check CORS**: Remote images may block cross-origin requests
- **Try upload instead**: Upload the file directly

### ⚠️ Video processing is slow
- **Increase frame sampling rate**: Process fewer frames (e.g., 60 instead of 30)
- **Use shorter videos**: Test with 10-30 second clips first
- **Check API performance**: Ensure GPU acceleration is working

### ⚠️ Bounding boxes misaligned
- This can happen if the image is scaled differently than expected
- Try refreshing the page and re-uploading
- Check browser zoom level (should be 100%)

---

## 🔐 Security Considerations

⚠️ **Important**: This frontend is designed for **development and testing** purposes.

For production deployment:
- Add authentication (API keys, OAuth, etc.)
- Use HTTPS for API connections
- Validate and sanitize all inputs
- Implement rate limiting
- Add CSP (Content Security Policy) headers
- Consider user privacy for uploaded images

---

## 🚀 Advanced Usage

### Integrating with Your Application

You can use the frontend code as a starting point for your own application:

```javascript
// Example: Process an image programmatically
async function detectFaces(imageFile) {
    const base64 = await fileToBase64(imageFile);

    const response = await fetch('http://localhost:18081/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            images: { data: [base64] },
            threshold: 0.6,
            extract_embedding: true
        })
    });

    return await response.json();
}
```

### Compare Two Faces

```javascript
// Extract embeddings from two images
const result1 = await detectFaces(image1);
const result2 = await detectFaces(image2);

const embedding1 = result1.data[0].faces[0].vec;
const embedding2 = result2.data[0].faces[0].vec;

// Calculate cosine similarity
function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
}

const similarity = cosineSimilarity(embedding1, embedding2);
console.log(`Similarity: ${similarity}`);

if (similarity > 0.4) {
    console.log('Same person!');
} else {
    console.log('Different people');
}
```

---

## 📝 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check API status |
| `/info` | GET | Get server configuration |
| `/extract` | POST | Face detection and recognition |
| `/multipart/draw_detections` | POST | Draw visualizations |

See the main repository README for full API documentation.

---

## 🤝 Contributing

Contributions are welcome! To add features or fix bugs:

1. Fork the repository
2. Create a feature branch
3. Make your changes to `frontend/index.html` or `frontend/app.js`
4. Test thoroughly with the API
5. Submit a pull request

### Feature Ideas
- [ ] Face comparison tool (upload 2 images, compare similarity)
- [ ] Bulk image processing (upload folder)
- [ ] Face search database (store and search embeddings)
- [ ] Real-time webcam processing
- [ ] Export results to CSV/JSON
- [ ] Face clustering visualization
- [ ] Performance metrics dashboard
- [ ] Mobile-responsive design improvements

---

## 📄 License

This frontend is part of the InsightFace-REST project. Please refer to the main repository for licensing information.

---

## 🔗 Links

- [InsightFace-REST Repository](https://github.com/SthPhoenix/InsightFace-REST)
- [API Documentation](../README.md)
- [InsightFace Official](https://github.com/deepinsight/insightface)

---

## ❓ FAQ

**Q: Can I use this with a remote API server?**
A: Yes! Just change the API URL in the settings to your remote server address.

**Q: Does video processing work offline?**
A: Frame extraction is done in the browser (offline), but each frame is sent to the API (online) for processing.

**Q: Can I process multiple images at once?**
A: The current UI processes one image at a time. You can modify the code to send multiple images in the `images` array.

**Q: How accurate is face recognition?**
A: The default `glintr100` model achieves 99.83% accuracy on the LFW benchmark. Real-world accuracy depends on image quality, lighting, and angles.

**Q: Can I run this on mobile?**
A: Yes! The UI is responsive and works on mobile browsers. However, video processing may be slower on mobile devices.

---

Made with ❤️ for the InsightFace-REST community
