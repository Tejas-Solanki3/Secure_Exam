// static/js/face_detector.js

let videoElement = null;
let overlayCanvas = null;
let canvasCtx = null;
let handleViolationCallback = null;
let cameraInstance = null;
let currentSessionId = null; 

// Head movement tracking variables
let lastDirection = '';
let neutralX = null;
let neutralY = null;
const headMovementThreshold = 0.05;
let suspiciousMovementStartTime = null;
const suspiciousMovementDurationThreshold = 10000; // 10 seconds

// Multi-face detection variables
let multiFaceWarningShown = false;
let multiFaceDetectionCount = 0;
const multiFaceDetectionThreshold = 5; // Number of consecutive detections before locking

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 2, // Allow detection of up to 2 faces
  refineLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

function onResults(results) {
  if (!videoElement || !videoElement.videoWidth || !overlayCanvas || !canvasCtx) {
    return;
  }

  overlayCanvas.width = videoElement.videoWidth;
  overlayCanvas.height = videoElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  canvasCtx.drawImage(results.image, 0, 0, overlayCanvas.width, overlayCanvas.height);

  let violationMessage = null;

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const facesDetected = results.multiFaceLandmarks.length;
    
    // Draw face meshes for all detected faces
    for (let i = 0; i < results.multiFaceLandmarks.length; i++) {
      const landmarks = results.multiFaceLandmarks[i];
      const color = i === 0 ? '#00FF00' : '#FF0000'; // Green for primary face, red for additional faces
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: color, lineWidth: 2 });
      
      // Add face number label
      const noseTip = landmarks[1];
      canvasCtx.fillStyle = color;
      canvasCtx.font = '16px Arial';
      canvasCtx.fillText(`Face ${i + 1}`, noseTip.x * overlayCanvas.width, noseTip.y * overlayCanvas.height - 10);
    }

    // Handle multi-face detection
    if (facesDetected > 1) {
      multiFaceDetectionCount++;
      
      if (!multiFaceWarningShown && multiFaceDetectionCount >= 3) {
        // Show warning after 3 consecutive detections
        logActivity(`⚠️ Multiple faces detected (${facesDetected})! Warning issued.`, 'warning');
        multiFaceWarningShown = true;
      }
      
      if (multiFaceDetectionCount >= multiFaceDetectionThreshold) {
        // Lock exam after threshold reached
        if (window.handleMultiFaceDetection) {
          window.handleMultiFaceDetection();
        }
        return; // Stop processing
      }
    } else {
      // Reset multi-face detection counter when only one face is detected
      multiFaceDetectionCount = 0;
      multiFaceWarningShown = false;
    }

    // Head movement detection for primary face only
    if (results.multiFaceLandmarks[0]) {
      const headMovement = detectHeadMovement(results.multiFaceLandmarks[0]);

      if (headMovement !== 'Neutral' && headMovement !== 'Calibrating' && headMovement !== 'Looking Down') {
        if (suspiciousMovementStartTime === null) {
          suspiciousMovementStartTime = Date.now();
          logActivity(`Suspicious movement detected: ${headMovement}.`, 'warning');
        } else if (Date.now() - suspiciousMovementStartTime >= suspiciousMovementDurationThreshold) {
          violationMessage = `Sustained suspicious head movement (${headMovement}).`;
          suspiciousMovementStartTime = null; 
        }
      } else {
        suspiciousMovementStartTime = null;
      }
    }
  } else {
    violationMessage = "No face detected in camera view.";
    suspiciousMovementStartTime = null;
    // Reset multi-face detection when no faces are detected
    multiFaceDetectionCount = 0;
    multiFaceWarningShown = false;
  }

  if (violationMessage && handleViolationCallback) {
    handleViolationCallback(violationMessage); 
  }

  canvasCtx.restore();
}

function initFaceDetector(videoEl, canvasEl, violationCallback, sessionId) {
    videoElement = videoEl;
    overlayCanvas = canvasEl;
    canvasCtx = overlayCanvas.getContext('2d');
    handleViolationCallback = violationCallback;
    currentSessionId = sessionId;

    // Reset multi-face detection variables
    multiFaceDetectionCount = 0;
    multiFaceWarningShown = false;

    cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
            await faceMesh.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });

    cameraInstance.start();
}

function stopFaceDetector() {
    if (cameraInstance) {
        cameraInstance.stop();
        cameraInstance = null;
        console.log("MediaPipe FaceMesh camera stopped.");
    }
}

function detectHeadMovement(landmarks) {
  const eyeMidpointX = (landmarks[33].x + landmarks[263].x) / 2;
  const eyeMidpointY = (landmarks[33].y + landmarks[263].y) / 2;

  if (neutralX === null || neutralY === null) {
    if (window.headMovementInitCount === undefined) window.headMovementInitCount = 0;
    window.headMovementInitCount++;
    if (window.headMovementInitCount > 30) {
      neutralX = eyeMidpointX;
      neutralY = eyeMidpointY;
      logActivity('Head movement calibration complete', 'info');
    }
    return 'Calibrating';
  }

  const dx = eyeMidpointX - neutralX;
  const dy = eyeMidpointY - neutralY;
  let currentDirection = 'Neutral';

  // --- THIS IS THE FIX: Inverted Logic for Mirrored Camera ---
  if (dx > headMovementThreshold) currentDirection = 'Looking Left'; // User's left is right side of screen (higher X)
  else if (dx < -headMovementThreshold) currentDirection = 'Looking Right'; // User's right is left side of screen (lower X)
  else if (dy > headMovementThreshold) currentDirection = 'Looking Down';
  else if (dy < -headMovementThreshold) currentDirection = 'Looking Up';
  
  if (currentDirection !== lastDirection) {
    lastDirection = currentDirection;
    logActivity(`Head movement: ${currentDirection}`, 'info');
  }
  return currentDirection;
}

// Reset function for new exam sessions
function resetFaceDetector() {
  multiFaceDetectionCount = 0;
  multiFaceWarningShown = false;
  suspiciousMovementStartTime = null;
  neutralX = null;
  neutralY = null;
  lastDirection = '';
  if (window.headMovementInitCount !== undefined) {
    window.headMovementInitCount = 0;
  }
}

window.initFaceDetector = initFaceDetector;
window.stopFaceDetector = stopFaceDetector;
window.resetFaceDetector = resetFaceDetector;
