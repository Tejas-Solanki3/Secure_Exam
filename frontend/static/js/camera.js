// static/js/camera.js

let currentStream; // To hold the MediaStream object

/**
 * Starts the camera and streams it to a given video element.
 * @param {HTMLVideoElement} videoElement The video element to stream to.
 * @returns {Promise<boolean>} Resolves true if camera started, false otherwise.
 */
async function startCamera(videoElement) {
    if (!videoElement) {
        console.error('Video element not provided to startCamera.');
        return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser.');
        return false;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = stream;
        currentStream = stream; // Store the stream to stop it later
        console.log('Camera stream started successfully.');
        return true;
    } catch (err) {
        console.error('Error accessing camera: ', err);
        // More specific error handling
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Camera access denied. Please allow camera permissions in your browser settings to proceed.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            alert('No camera found. Please ensure a camera is connected and enabled.');
        } else {
            alert('An unexpected error occurred while accessing the camera: ' + err.message);
        }
        return false;
    }
}

/**
 * Stops the currently active camera stream.
 */
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        console.log('Camera stream stopped.');
    }
}

// Make functions globally available
window.startCamera = startCamera;
window.stopCamera = stopCamera;
