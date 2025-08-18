// static/js/logger.js

// Global variables for security tracking
let tabSwitchCount = 0;
let maxTabSwitches = 1; // Allow 1 tab switch before locking
let examLocked = false;
let multiFaceDetected = false;

/**
 * Logs an activity message to the console and the UI activity log.
 * @param {string} message The message to log.
 * @param {string} [type='info'] The type of log (e.g., 'info', 'warning', 'error', 'success').
 */
function logActivity(message, type = 'info') {
    const logList = document.getElementById('logList');
    if (!logList) return;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = document.createElement('li');
    
    let iconClass = 'fas fa-info-circle log-icon-info';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle log-icon-success';
    } else if (type === 'warning') {
        iconClass = 'fas fa-exclamation-triangle log-icon-warning';
    } else if (type === 'error') {
        iconClass = 'fas fa-times-circle log-icon-error';
    }

    logEntry.innerHTML = `<span class="log-time">${timestamp}</span> <span class="log-message">${message}</span> <i class="${iconClass}"></i>`;
    logList.prepend(logEntry);

    if (logList.children.length > 50) {
        logList.removeChild(logList.lastChild);
    }
    
    if (type === 'error') {
        console.error(`[${timestamp}] ${message}`);
    } else if (type === 'warning') {
        console.warn(`[${timestamp}] ${message}`);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

/**
 * Handle tab switching with two-strike system
 */
function handleTabSwitch() {
    tabSwitchCount++;
    
    if (tabSwitchCount === 1) {
        // First strike - warning
        logActivity(`⚠️ Tab switching detected! This is your first warning. Next violation will lock the exam.`, 'warning');
        showWarningModal('Tab Switching Detected', 'You have switched tabs during the exam. This is your first warning. Any further tab switching will result in exam termination.');
    } else if (tabSwitchCount > maxTabSwitches) {
        // Second strike - lock exam
        logActivity(`🚫 Multiple tab switches detected! Exam locked due to security violation.`, 'error');
        lockExam('Multiple tab switches detected');
    }
}

/**
 * Handle multiple face detection
 */
function handleMultiFaceDetection() {
    if (!multiFaceDetected) {
        multiFaceDetected = true;
        logActivity(`🚫 Multiple faces detected in camera! Exam locked due to security violation.`, 'error');
        lockExam('Multiple faces detected in camera');
    }
}

/**
 * Lock the exam and redirect to dashboard
 */
function lockExam(reason) {
    if (examLocked) return; // Prevent multiple locks
    
    examLocked = true;
    
    // Stop all timers and monitoring
    if (window.examTimer) {
        clearInterval(window.examTimer);
    }
    
    // Stop camera
    if (window.videoStream) {
        window.videoStream.getTracks().forEach(track => track.stop());
    }
    
    // Show lock modal
    showLockModal(reason);
    
    // Log the violation
    const violationData = {
        session_id: window.currentSessionId || null,
        type: 'exam_locked',
        reason: reason,
        timestamp: new Date().toISOString(),
        tabSwitchCount: tabSwitchCount,
        multiFaceDetected: multiFaceDetected
    };
    
    // Send violation to backend
    fetch('/api/exam/violation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(violationData)
    }).catch(error => {
        console.error('Error logging violation:', error);
    });
}

/**
 * Show warning modal
 */
function showWarningModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle"></i> ${title}
                    </h5>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-check"></i> I Understand
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 5000);
}

/**
 * Show exam lock modal
 */
function showLockModal(reason) {
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-lock"></i> Exam Locked
                    </h5>
                </div>
                <div class="modal-body">
                    <p><strong>Your exam has been locked due to a security violation:</strong></p>
                    <p class="text-danger">${reason}</p>
                    <p>You will be redirected to the student dashboard.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" onclick="redirectToDashboard()">
                        <i class="fas fa-home"></i> Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Redirect to student dashboard
 */
function redirectToDashboard() {
    window.location.href = '/student_dashboard.html';
}

/**
 * Reset security counters (for new exam)
 */
function resetSecurityCounters() {
    tabSwitchCount = 0;
    examLocked = false;
    multiFaceDetected = false;
}

// Export functions for use in other modules
window.logActivity = logActivity;
window.handleTabSwitch = handleTabSwitch;
window.handleMultiFaceDetection = handleMultiFaceDetection;
window.lockExam = lockExam;
window.resetSecurityCounters = resetSecurityCounters;
