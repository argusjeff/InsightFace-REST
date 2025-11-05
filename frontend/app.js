// Global variables
let currentImage = null;
let currentVideo = null;
let currentDrawFile = null;

// Tab switching
function switchTab(tab) {
    // Hide all tabs
    document.getElementById('content-image').classList.add('hidden');
    document.getElementById('content-video').classList.add('hidden');
    document.getElementById('content-draw').classList.add('hidden');

    // Remove active state from all tabs
    document.getElementById('tab-image').classList.remove('tab-active');
    document.getElementById('tab-video').classList.remove('tab-active');
    document.getElementById('tab-draw').classList.remove('tab-active');

    // Show selected tab
    document.getElementById('content-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('tab-active');
}

// Get API URL
function getApiUrl() {
    return document.getElementById('apiUrl').value.replace(/\/$/, '');
}

// Health check
async function checkHealth() {
    try {
        const response = await fetch(`${getApiUrl()}/health`);
        const data = await response.json();

        if (response.ok) {
            alert(`✅ Server is healthy!\n\nVersion: ${data.version}\nStatus: ${data.status}`);
        } else {
            alert(`⚠️ Server responded with status ${response.status}`);
        }
    } catch (error) {
        alert(`❌ Cannot connect to server\n\nError: ${error.message}\n\nMake sure the API is running at: ${getApiUrl()}`);
    }
}

// Get server info
async function getInfo() {
    try {
        const response = await fetch(`${getApiUrl()}/info`);
        const data = await response.json();

        const info = `
🖥️ Server Information

Version: ${data.version}
TensorRT: ${data.tensorrt_version || 'N/A'}
Log Level: ${data.log_level}

📊 Models:
• Detection: ${data.models.det_name}
• Recognition: ${data.models.rec_name}
• Gender/Age: ${data.models.ga_name || 'Disabled'}
• Backend: ${data.models.inference_backend}
• Max Size: ${data.models.max_size.join('x')}
• FP16: ${data.models.force_fp16 ? 'Enabled' : 'Disabled'}

⚙️ Defaults:
• Threshold: ${data.defaults.det_thresh}
• Extract Embeddings: ${data.defaults.extract_embedding}
• Extract G/A: ${data.defaults.extract_ga}
        `.trim();

        alert(info);
    } catch (error) {
        alert(`❌ Error fetching server info:\n\n${error.message}`);
    }
}

// Image upload handler
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentImage = file;
    displayImagePreview(file);
}

// Display image preview
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${e.target.result}" class="max-w-full h-auto">`;
    };
    reader.readAsDataURL(file);
}

// Process image from URL
async function processImageUrl() {
    const url = document.getElementById('imageUrl').value.trim();
    if (!url) {
        alert('Please enter an image URL');
        return;
    }

    try {
        // Display preview
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${url}" class="max-w-full h-auto" onerror="this.parentElement.innerHTML='<p class=\\'text-red-500\\'>Failed to load image</p>'">`;

        currentImage = url;
    } catch (error) {
        alert(`Error loading image: ${error.message}`);
    }
}

// Process image
async function processImage() {
    if (!currentImage) {
        alert('Please upload or specify an image first');
        return;
    }

    const btn = document.getElementById('processBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading mx-auto"></div>';

    try {
        let imageData;

        if (typeof currentImage === 'string') {
            // URL
            imageData = { urls: [currentImage] };
        } else {
            // File upload - convert to base64
            const base64 = await fileToBase64(currentImage);
            imageData = { data: [base64] };
        }

        const requestBody = {
            images: imageData,
            threshold: parseFloat(document.getElementById('threshold').value),
            limit_faces: parseInt(document.getElementById('limitFaces').value),
            extract_embedding: document.getElementById('extractEmbedding').checked,
            extract_ga: document.getElementById('extractGA').checked,
            return_landmarks: document.getElementById('returnLandmarks').checked,
            detect_masks: document.getElementById('detectMasks').checked,
            return_face_data: false,
            verbose_timings: true
        };

        const response = await fetch(`${getApiUrl()}/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        displayResults(result);

        // Draw bounding boxes on image
        if (result.data && result.data[0] && result.data[0].faces) {
            drawBoundingBoxes(result.data[0].faces);
        }

    } catch (error) {
        alert(`❌ Error processing image:\n\n${error.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Process Image';
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data:image/...;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Draw bounding boxes on preview image
function drawBoundingBoxes(faces) {
    const preview = document.getElementById('imagePreview');
    const img = preview.querySelector('img');
    if (!img) return;

    // Remove existing boxes
    preview.querySelectorAll('.face-box, .face-label, .landmark').forEach(el => el.remove());

    const imgRect = img.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();

    // Calculate scale
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    faces.forEach((face, index) => {
        const bbox = face.bbox;
        if (!bbox) return;

        // Draw bounding box
        const box = document.createElement('div');
        box.className = 'face-box';
        box.style.left = `${bbox[0] * scaleX}px`;
        box.style.top = `${bbox[1] * scaleY}px`;
        box.style.width = `${(bbox[2] - bbox[0]) * scaleX}px`;
        box.style.height = `${(bbox[3] - bbox[1]) * scaleY}px`;
        preview.appendChild(box);

        // Draw label
        const label = document.createElement('div');
        label.className = 'face-label';
        label.style.left = `${bbox[0] * scaleX}px`;
        label.style.top = `${(bbox[1] * scaleY) - 25}px`;

        let labelText = `Face ${index + 1} (${(face.prob * 100).toFixed(1)}%)`;
        if (face.gender && face.age) {
            labelText += ` - ${face.gender}, ${face.age}`;
        }
        label.textContent = labelText;
        preview.appendChild(label);

        // Draw landmarks
        if (face.landmarks && document.getElementById('returnLandmarks').checked) {
            face.landmarks.forEach(point => {
                const landmark = document.createElement('div');
                landmark.className = 'landmark';
                landmark.style.left = `${point[0] * scaleX}px`;
                landmark.style.top = `${point[1] * scaleY}px`;
                preview.appendChild(landmark);
            });
        }
    });
}

// Display results in JSON format
function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');

    resultsSection.classList.remove('hidden');

    let html = '';

    if (result.data && result.data.length > 0) {
        const imageResult = result.data[0];

        if (imageResult.status !== 'ok') {
            html = `<div class="bg-red-50 border border-red-200 rounded p-4">
                <p class="text-red-700">❌ Error: ${imageResult.traceback || 'Unknown error'}</p>
            </div>`;
        } else {
            const faces = imageResult.faces || [];
            const timings = imageResult.took || {};

            html += `<div class="mb-4 p-4 bg-blue-50 rounded">
                <h3 class="font-semibold text-blue-900 mb-2">📊 Summary</h3>
                <p>Faces detected: <strong>${faces.length}</strong></p>
                <p>Total time: <strong>${timings.total_ms?.toFixed(2) || 'N/A'} ms</strong></p>
                ${timings.detect_ms ? `<p>Detection: <strong>${timings.detect_ms.toFixed(2)} ms</strong></p>` : ''}
                ${timings.rec_ms ? `<p>Recognition: <strong>${timings.rec_ms.toFixed(2)} ms</strong></p>` : ''}
            </div>`;

            faces.forEach((face, index) => {
                html += `<div class="mb-4 p-4 border border-gray-200 rounded">
                    <h4 class="font-semibold mb-2">Face ${index + 1}</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span class="text-gray-600">Confidence:</span>
                            <span class="font-medium">${(face.prob * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Size:</span>
                            <span class="font-medium">${face.size || 'N/A'} px</span>
                        </div>
                        ${face.gender ? `<div>
                            <span class="text-gray-600">Gender:</span>
                            <span class="font-medium">${face.gender}</span>
                        </div>` : ''}
                        ${face.age ? `<div>
                            <span class="text-gray-600">Age:</span>
                            <span class="font-medium">${face.age}</span>
                        </div>` : ''}
                        ${face.mask !== undefined ? `<div>
                            <span class="text-gray-600">Mask:</span>
                            <span class="font-medium">${face.mask ? 'Yes' : 'No'}</span>
                        </div>` : ''}
                    </div>
                    ${face.vec ? `<details class="mt-2">
                        <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-800">View Embedding (512-d vector)</summary>
                        <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">${JSON.stringify(face.vec.slice(0, 10), null, 2)}... (showing first 10 of 512)</pre>
                    </details>` : ''}
                </div>`;
            });
        }
    }

    resultsDiv.innerHTML = html;
}

// Video upload handler
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentVideo = file;

    const preview = document.getElementById('videoPreview');
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<video src="${url}" controls class="w-full h-auto"></video>`;

    document.getElementById('processVideoBtn').disabled = false;
}

// Process video
async function processVideo() {
    if (!currentVideo) {
        alert('Please upload a video first');
        return;
    }

    const btn = document.getElementById('processVideoBtn');
    btn.disabled = true;

    const progressDiv = document.getElementById('videoProgress');
    const progressBar = document.getElementById('videoProgressBar');
    const progressText = document.getElementById('videoProgressText');
    progressDiv.classList.remove('hidden');

    try {
        // Create video element
        const video = document.createElement('video');
        video.src = URL.createObjectURL(currentVideo);

        await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
        });

        const canvas = document.getElementById('videoCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const frameRate = parseInt(document.getElementById('frameRate').value);
        const duration = video.duration;
        const fps = 30; // Assume 30 fps
        const totalFrames = Math.floor(duration * fps);
        const framesToProcess = Math.floor(totalFrames / frameRate);

        let processedFrames = 0;
        const results = [];

        progressText.textContent = `Processing 0/${framesToProcess} frames...`;

        for (let i = 0; i < framesToProcess; i++) {
            const time = (i * frameRate) / fps;
            video.currentTime = time;

            await new Promise((resolve) => {
                video.onseeked = resolve;
            });

            // Draw frame to canvas
            ctx.drawImage(video, 0, 0);

            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

            // Process frame
            const response = await fetch(`${getApiUrl()}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: { data: [base64] },
                    threshold: parseFloat(document.getElementById('threshold').value),
                    extract_embedding: false,
                    return_face_data: false,
                    extract_ga: false
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data[0] && result.data[0].faces) {
                    results.push({
                        time: time.toFixed(2),
                        faces: result.data[0].faces.length
                    });
                }
            }

            processedFrames++;
            const progress = (processedFrames / framesToProcess) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Processing ${processedFrames}/${framesToProcess} frames...`;
        }

        // Display video results
        displayVideoResults(results);

        progressText.textContent = `✅ Completed! Processed ${framesToProcess} frames`;

    } catch (error) {
        alert(`❌ Error processing video:\n\n${error.message}`);
        progressDiv.classList.add('hidden');
    } finally {
        btn.disabled = false;
    }
}

// Display video results
function displayVideoResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');

    resultsSection.classList.remove('hidden');

    const totalFaces = results.reduce((sum, r) => sum + r.faces, 0);
    const avgFaces = totalFaces / results.length;

    let html = `
        <div class="mb-4 p-4 bg-purple-50 rounded">
            <h3 class="font-semibold text-purple-900 mb-2">🎥 Video Analysis</h3>
            <p>Frames processed: <strong>${results.length}</strong></p>
            <p>Total faces detected: <strong>${totalFaces}</strong></p>
            <p>Average faces per frame: <strong>${avgFaces.toFixed(2)}</strong></p>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 border-b text-left">Time (s)</th>
                        <th class="px-4 py-2 border-b text-left">Faces Detected</th>
                    </tr>
                </thead>
                <tbody>
    `;

    results.forEach(r => {
        html += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b">${r.time}</td>
                <td class="px-4 py-2 border-b">${r.faces}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

// Draw detections upload handler
function handleDrawUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentDrawFile = file;
    document.getElementById('drawBtn').disabled = false;
}

// Draw detections
async function drawDetections() {
    if (!currentDrawFile) {
        alert('Please upload an image first');
        return;
    }

    const btn = document.getElementById('drawBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading mx-auto"></div>';

    try {
        const formData = new FormData();
        formData.append('file', currentDrawFile);
        formData.append('threshold', document.getElementById('threshold').value);
        formData.append('draw_landmarks', document.getElementById('drawLandmarks').checked);
        formData.append('draw_scores', document.getElementById('drawScores').checked);
        formData.append('draw_sizes', document.getElementById('drawSizes').checked);
        formData.append('limit_faces', document.getElementById('limitFaces').value);

        const response = await fetch(`${getApiUrl()}/multipart/draw_detections`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const result = document.getElementById('drawResult');
        result.innerHTML = `<img src="${url}" class="max-w-full h-auto">`;

    } catch (error) {
        alert(`❌ Error drawing detections:\n\n${error.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🎨 Draw Detections';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('InsightFace-REST Frontend loaded');

    // Check if API is accessible
    checkHealth();
});
