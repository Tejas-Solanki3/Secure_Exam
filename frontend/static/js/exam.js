// static/js/exam.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const endExamBtn = document.getElementById('endExamBtn');
    const submitConfirmModal = document.getElementById('submitConfirmModal');
    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
    const webcamVideo = document.getElementById('webcamVideo');
    const overlayCanvas = document.getElementById('overlayCanvas');
    const proctoringToggle = document.getElementById('proctoringToggle');
    const selfieModal = document.getElementById('selfieVerificationModal');
    const selfieVideo = document.getElementById('selfieVideo');
    const captureSelfieBtn = document.getElementById('captureSelfieBtn');
    const contentBlocker = document.getElementById('contentBlocker');
    const examTitleEl = document.getElementById('examTitle');
    const examCodeEl = document.getElementById('examCode');
    const questionProgressEl = document.getElementById('questionProgress');
    const questionTextEl = document.getElementById('questionText');
    const answerAreaEl = document.getElementById('answerArea');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const progressIndicator = document.getElementById('progressIndicator');
    const progressBar = document.getElementById('progressBar');

    // --- State Variables ---
    let currentSessionId = null;
    let currentStudentId = localStorage.getItem('currentStudentId') || 'unknown_student';
    const testId = new URLSearchParams(window.location.search).get('test_id');
    let questions = [];
    let studentAnswers = {};
    let currentQuestionIndex = 0;

    // --- Core Exam Logic ---
    function renderQuestion(index) {
        const question = questions[index];
        questionProgressEl.textContent = `Question ${index + 1} of ${questions.length}`;
        questionTextEl.textContent = question.text;
        answerAreaEl.innerHTML = '';
        if (question.type === 'mcq') {
            const optionsHtml = question.options.map((option) => `<label><input type="radio" name="question_${index}" value="${option}" ${studentAnswers[index] === option ? 'checked' : ''}> ${option}</label>`).join('');
            answerAreaEl.innerHTML = optionsHtml;
        } else if (question.type === 'subjective') {
            const answer = studentAnswers[index] || '';
            answerAreaEl.innerHTML = `<textarea class="subjective-answer" placeholder="Type your answer here...">${answer}</textarea>`;
        }
        prevQuestionBtn.disabled = index === 0;
        nextQuestionBtn.textContent = (index === questions.length - 1) ? 'Finish' : 'Next';
    }

    function saveCurrentAnswer() {
        if (!questions[currentQuestionIndex]) return;
        const question = questions[currentQuestionIndex];
        if (question.type === 'mcq') {
            const selectedOption = answerAreaEl.querySelector(`input[name="question_${currentQuestionIndex}"]:checked`);
            if (selectedOption) studentAnswers[currentQuestionIndex] = selectedOption.value;
        } else if (question.type === 'subjective') {
            const textArea = answerAreaEl.querySelector('textarea');
            if (textArea) studentAnswers[currentQuestionIndex] = textArea.value;
        }
    }

    prevQuestionBtn.addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion(currentQuestionIndex);
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        } else {
            endExamBtn.click();
        }
    });

    // --- Submission Logic ---
    endExamBtn.addEventListener('click', () => {
        saveCurrentAnswer();
        submitConfirmModal.style.display = 'flex';
    });
    cancelSubmitBtn.addEventListener('click', () => {
        submitConfirmModal.style.display = 'none';
    });
    confirmSubmitBtn.addEventListener('click', async () => {
        logActivity('Student confirmed exam submission.');
        const formattedAnswers = questions.map((q, index) => ({
            question_text: q.text,
            answer: studentAnswers[index] || null
        }));
        try {
            const response = await fetch('/api/exam/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: currentSessionId, answers: formattedAnswers })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            stopTimer();
            stopProctoringCamera();
            window.location.href = `submission_success.html?session_id=${currentSessionId}`;
        } catch (error) {
            alert(`Submission failed: ${error.message}`);
            submitConfirmModal.style.display = 'none';
        }
    });

    // --- Selfie & Setup Workflow ---
    function updateProgress(step, total) {
        const percentage = (step / total) * 100;
        if (progressIndicator) progressIndicator.textContent = `Step ${step} of ${total}`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
    }

    async function handleSelfieVerification() {
        if (!testId) {
            alert("No test selected."); window.location.href = 'student_dashboard.html'; return;
        }
        selfieModal.style.display = 'flex';
        updateProgress(1, 2);
        await startCamera(selfieVideo);
    }

    captureSelfieBtn.addEventListener('click', async () => {
        captureSelfieBtn.disabled = true;
        captureSelfieBtn.textContent = 'Processing...';
        updateProgress(2, 2);
        const canvas = document.createElement('canvas');
        canvas.width = selfieVideo.videoWidth;
        canvas.height = selfieVideo.videoHeight;
        canvas.getContext('2d').drawImage(selfieVideo, 0, 0, canvas.width, canvas.height);
        const selfieData = canvas.toDataURL('image/jpeg');
        stopCamera();
        try {
            const sessionResponse = await fetch('/api/exam/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: currentStudentId, test_id: testId })
            });
            const sessionData = await sessionResponse.json();
            if (!sessionResponse.ok) throw new Error(sessionData.message);
            currentSessionId = sessionData.session_id;
            window.currentSessionId = currentSessionId; // Make it globally available for logger.js
            const selfieResponse = await fetch('/upload-selfie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selfie: selfieData, session_id: currentSessionId })
            });
            if (!selfieResponse.ok) throw new Error('Failed to upload selfie.');
            setTimeout(() => { selfieModal.style.display = 'none'; startExam(); }, 500);
        } catch (error) { 
            alert(`Error: ${error.message}`); 
            captureSelfieBtn.disabled = false;
            captureSelfieBtn.textContent = 'Capture Selfie';
            updateProgress(1, 2);
        }
    });

    // --- Proctoring Logic ---
    proctoringToggle.addEventListener('change', () => {
        const proctoringEnabled = proctoringToggle.checked;
        if (proctoringEnabled) {
            logActivity('Proctoring manually enabled.', 'info');
            startProctoringCamera();
        } else {
            logActivity('Proctoring manually disabled.', 'warning');
            stopProctoringCamera();
        }
    });
    async function startProctoringCamera() {
       const started = await startCamera(webcamVideo);
       if (started) initFaceDetector(webcamVideo, overlayCanvas, handleViolation, currentSessionId);
    }
    function stopProctoringCamera() {
        stopCamera();
        stopFaceDetector();
    }
    function handleViolation(message) {
        logActivity(`Violation: ${message}`, 'warning');
    }

    async function startExam() {
        contentBlocker.style.display = 'none';
        logActivity('Identity verified. Exam started.');
        
        // Initialize security features
        initializeSecurity();
        
        try {
            const response = await fetch(`/api/exam/details/${testId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            examTitleEl.textContent = data.details.name;
            examCodeEl.textContent = data.details.code;
            questions = data.details.questions;
            questions.forEach((q, i) => studentAnswers[i] = null);
            startTimer(data.details.duration_seconds);
            renderQuestion(currentQuestionIndex);
            await startProctoringCamera();
        } catch (error) {
            alert(`Error: ${error.message}`);
            window.location.href = 'student_dashboard.html';
        }
    }

    // --- Enhanced Security: Lockdown and Proctoring Violation Logic ---
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Use the new two-strike system for tab switching
            if (window.handleTabSwitch) {
                window.handleTabSwitch();
            } else {
                logActivity('Tab switched or window minimized', 'warning');
            }
        }
    });

    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        logActivity('Right-click disabled', 'warning');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I') || (event.metaKey && event.altKey && event.key === 'i')) {
            event.preventDefault();
            logActivity('Developer tools access attempt blocked', 'warning');
        }
    });

    // --- Security Initialization ---
    function initializeSecurity() {
        // Reset security counters for new exam
        if (window.resetSecurityCounters) {
            window.resetSecurityCounters();
        }
        if (window.resetFaceDetector) {
            window.resetFaceDetector();
        }
    }

    // --- Initial Load ---
    handleSelfieVerification();
});
