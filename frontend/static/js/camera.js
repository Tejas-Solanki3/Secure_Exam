// static/js/camera.js

const webcamVideoElement = document.getElementById('webcamVideo');
let currentStream = null;

async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
         logActivity('Camera not supported in browser', 'error');
        return false;
    }

    console.log('Attempting to start camera...');
     logActivity('Requesting camera access...');

    try {
        // Request both video and potentially audio access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        currentStream = stream;

        if (webcamVideoElement) {
            webcamVideoElement.srcObject = stream;
             logActivity('Camera stream started', 'success');
            console.log('Camera stream started successfully.');
            return true;
        } else {
             console.error('Webcam video element not found!');
             logActivity('Webcam video element not found', 'error');
             stopCamera(); // Stop the stream if we can't attach it
             return false;
        }

    } catch (err) {
        console.error('Error accessing camera: ', err);
        logActivity(`Error accessing camera: ${err.message}`, 'error');
        // TODO: Handle specific errors like permission denied
         return false;
    }
}

function stopCamera() {
    if (currentStream) {
        const tracks = currentStream.getTracks();
        tracks.forEach(track => track.stop());
        currentStream = null;
        console.log('Camera stream stopped.');
         logActivity('Camera stream stopped');
    }
     if (webcamVideoElement) {
        webcamVideoElement.srcObject = null;
    }
}

// Example usage (would be called from exam.js)
// document.addEventListener('DOMContentLoaded', async () => {
//      await startCamera();
// });

// Make stopCamera available globally or export if using modules
// window.stopCamera = stopCamera; // Or export { startCamera, stopCamera };