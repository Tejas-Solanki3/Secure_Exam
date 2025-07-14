// static/js/exam.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Exam page loaded.');
    logActivity('Exam page loaded'); // Use the logging function

    // --- Start Camera ---
    // Call the startCamera function from camera.js
    // Make sure camera.js is loaded before exam.js
    if (typeof startCamera === 'function') {
        const cameraStarted = await startCamera();
        if (cameraStarted) {
            console.log('Camera successfully started for exam.');
        } else {
            console.error('Failed to start camera for exam.');
            logActivity('Failed to start camera', 'error');
            // TODO: Handle camera failure - maybe redirect to error page
            // window.location.href = 'error.html';
        }
    } else {
        console.error('Camera functions not available!');
        logActivity('Camera functions not available', 'error');
    }


    // --- Start Timer ---
    if (typeof startTimer === 'function') {
        startTimer(7200); // Start timer for 2 hours
        logActivity('Exam timer started');
    } else {
        console.error('Timer functions not available!');
         logActivity('Timer functions not available', 'error');
    }


    // --- Proctoring Features ---
    let violationCount = 0; // Counter for violations
    const maxViolations = 2; // Max allowed violations before locking
    const multiFaceAlert = document.getElementById('multiFaceAlert'); // Get the alert div
    const lockedModal = document.getElementById('testLockedModal'); // Get the locked modal div
    const reasonInput = lockedModal ? lockedModal.querySelector('#reasonInput') : null; // Get the reason input
    const sendReasonButton = lockedModal ? lockedModal.querySelector('.modal-actions .btn-primary') : null; // Get the send reason button
    const submitConfirmModal = document.getElementById('submitConfirmModal'); // Get the submit confirmation modal
    const confirmSubmitBtn = submitConfirmModal ? submitConfirmModal.querySelector('#confirmSubmitBtn') : null; // Get confirm submit button
    const cancelSubmitBtn = submitConfirmModal ? submitConfirmModal.querySelector('#cancelSubmitBtn') : null; // Get cancel submit button


    let alertTimeout; // To hide the proctoring alert automatically


    // Tab/Window Focus Detection
    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.warn('Tab is hidden (user switched tabs or minimized)');
            logActivity('Tab switched or window minimized', 'warning');
            handleViolation('Tab Switch');
        } else {
            console.log('Tab is visible');
            logActivity('Tab is visible again');
        }
    };

    const handleBlur = () => {
        console.warn('Window lost focus (user switched windows or applications)');
        logActivity('Window lost focus', 'warning');
         // Add a slight delay to avoid double counting with visibilitychange if just switching tabs
        setTimeout(() => {
             if (document.visibilityState === 'visible') {
                 console.log('Window blurred, but document is still visible - likely switched application');
                 // Decide if this counts as a violation based on your policy
                 // handleViolation('Window Blur - Switched Application');
             } else {
                 console.log('Window blurred because document became hidden (tab switch)');
             }
        }, 50); // Small delay
         handleViolation('Window Blur'); // Count all blurs as potential violations initially
    };

     const handleFocus = () => {
        console.log('Window gained focus');
        logActivity('Window gained focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);


    // Disable Right-Click on the entire document
    document.addEventListener('contextmenu', (event) => {
        console.warn('Right-click attempted. Preventing default behavior.');
         event.preventDefault(); // Prevent the default context menu
         logActivity('Right-click prevented', 'warning');
    });

    // Text selection is handled by CSS (user-select: none) applied via the 'test-locked' class


    function handleViolation(type) {
        // Only count violations if the test is NOT already locked
        if (!document.body.classList.contains('test-locked')) {
             violationCount++;
            console.log(`Violation detected: ${type}. Total violations: ${violationCount}`);
            logActivity(`Violation detected: ${type}. Count: ${violationCount}`, 'warning');

            if (violationCount <= maxViolations) {
                const warningsLeft = maxViolations - violationCount;
                showProctoringAlert(`Violation detected: ${type}. You have ${warningsLeft} warnings left.`);
            } else {
                // Lock the test
                console.error('Max violations reached. Locking test.');
                logActivity('Maximum violations reached. Test locked.', 'error');
                lockTest('Maximum proctoring violations reached.');
            }
        } else {
             console.log('Violation detected, but test is already locked. Ignoring.');
        }
    }

    function showProctoringAlert(message) {
         if (multiFaceAlert) {
             const alertMessageSpan = multiFaceAlert.querySelector('.alert-message');
             if (alertMessageSpan) {
                 alertMessageSpan.textContent = message;
             }
             multiFaceAlert.style.display = 'flex'; // Show the alert

             // Clear any existing timeout to prevent premature hiding
             if (alertTimeout) {
                 clearTimeout(alertTimeout);
             }

             // Hide the alert automatically after 5 seconds
             alertTimeout = setTimeout(() => {
                 multiFaceAlert.style.display = 'none';
             }, 5000); // Hide after 5 seconds
         } else {
             alert(message); // Fallback to native alert
         }
    }

    // Function to hide the proctoring alert manually
    const closeAlertButton = document.querySelector('#multiFaceAlert .close-alert');
    if (closeAlertButton) {
         closeAlertButton.addEventListener('click', () => {
            if (multiFaceAlert) {
                multiFaceAlert.style.display = 'none';
                 if (alertTimeout) {
                     clearTimeout(alertTimeout); // Clear timeout if closed manually
                 }
            }
         });
    }


    function lockTest(reason) {
        console.log(`Test Locked. Reason: ${reason}`);
        document.body.classList.add('test-locked');
        logActivity(`Test Locked: ${reason}`, 'error');

        if (typeof stopTimer === 'function') stopTimer();
        if (typeof stopCamera === 'function') stopCamera();

        if (multiFaceAlert && multiFaceAlert.style.display !== 'none') {
             multiFaceAlert.style.display = 'none';
             if (alertTimeout) {
                clearTimeout(alertTimeout);
             }
        }

        if (lockedModal) {
            lockedModal.style.display = 'flex';
             if(reasonInput) {
                 reasonInput.value = '';
                 reasonInput.disabled = false;
             }
             if(sendReasonButton) {
                sendReasonButton.disabled = false;
             }
        } else {
            alert(`Test Locked: ${reason}`);
        }

         // Disable interaction with the main exam content
         const examContainer = document.querySelector('.exam-container');
         if(examContainer) {
            // The CSS rule body.test-locked > *:not(.modal) handles this.
            // Explicitly disabling form elements here is a secondary measure.
             const form = examContainer.querySelector('.question-area form');
             if(form) {
                 const elements = form.elements;
                 for (let i = 0; i < elements.length; i++) {
                     elements[i].disabled = true;
                 }
             }
             const actionButtons = examContainer.querySelectorAll('.exam-actions button');
             actionButtons.forEach(btn => btn.disabled = true);

             const navButtons = examContainer.querySelectorAll('.question-navigation button');
             navButtons.forEach(btn => btn.disabled = true);

             // Hide any other modals that might be open (like submit confirm modal)
             if (submitConfirmModal && submitConfirmModal.style.display !== 'none') {
                  submitConfirmModal.style.display = 'none';
             }
         }


    }


    // --- Modal Event Listeners ---
    const multipleFaceModal = document.getElementById('multipleFaceModal');
    // testLockedModal is already declared at the top
    // submitConfirmModal is already declared at the top


    // Close modal when clicking on the close button (x)
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', () => {
             const modal = button.closest('.modal');
             // Prevent closing the locked modal using the close button
             if (modal && modal.id === 'testLockedModal') {
                 console.log('Close button on locked modal ignored.');
             } else if (modal) {
                 modal.style.display = 'none';
             }
        });
    });

    // Close modal when clicking outside of the modal content (Does NOT close locked modal)
    window.addEventListener('click', (event) => {
        if (event.target === multipleFaceModal) {
            multipleFaceModal.style.display = 'none';
        }
        // Do NOT close testLockedModal or submitConfirmModal by clicking outside
        // if (event.target === testLockedModal || event.target === submitConfirmModal) {
        //     event.target.style.display = 'none';
        // }
    });


    // Event listener for the "Send to Administrator" button in the locked modal
    if (sendReasonButton) {
         sendReasonButton.addEventListener('click', () => {
            if (reasonInput) {
                const reason = reasonInput.value.trim();
                console.log('Sending reason to administrator:', reason);
                logActivity('Reason sent to administrator', 'info');
                // TODO: Implement Fetch API call to backend to send reason

                 alert('Reason sent. Waiting for administrator review.');
                 reasonInput.disabled = true;
                 sendReasonButton.disabled = true;
            }
         });
    }


    // --- Exam Action Button Listeners ---
    const requestHelpBtn = document.getElementById('requestHelpBtn'); // Get Request Help button by ID
    const endExamBtn = document.getElementById('endExamBtn'); // Get End Exam button by ID

    if (requestHelpBtn) {
        requestHelpBtn.addEventListener('click', () => {
            console.log('Request Help button clicked (placeholder).');
            logActivity('Student requested help', 'info');
            // TODO: Implement sending a help request to the backend
            // TODO: Maybe show a confirmation message or modal
             alert('Help request sent.'); // Placeholder
        });
    }

    if (endExamBtn) {
        endExamBtn.addEventListener('click', () => {
            console.log('End Exam button clicked. Showing submit confirmation modal.');
            logActivity('Student clicked End Exam, showing confirmation', 'info');
            // Show the submit confirmation modal instead of navigating directly
            if (submitConfirmModal) {
                submitConfirmModal.style.display = 'flex';
            } else {
                // Fallback to old behavior if modal not found
                 console.warn('Submit confirmation modal not found, navigating directly.');
                 // Simulate submission process...
                  if (typeof stopTimer === 'function') stopTimer();
                  if (typeof stopCamera === 'function') stopCamera();
                 window.location.href = 'submission_success.html';
            }
        });
    }

    // --- Submit Confirmation Modal Button Listeners ---
    if (confirmSubmitBtn) {
        confirmSubmitBtn.addEventListener('click', () => {
            console.log('Submit Exam button clicked in modal. Simulating submission.');
             logActivity('Exam submission confirmed', 'info');
            // TODO: Implement actual submission process (save answers, stop proctoring, send data to backend)

            // Simulate submission process...
             console.log('Submitting exam data (placeholder)...');
             logActivity('Submitting exam data', 'info');

            // Stop timer and camera
            if (typeof stopTimer === 'function') stopTimer();
            if (typeof stopCamera === 'function') stopCamera();

            // Clean up event listeners to prevent violations after ending
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            // Removing contextmenu listener specifically can be tricky and might need a flag
            // document.removeEventListener('contextmenu', (event) => event.preventDefault());

             // Navigate to submission success page after simulated submission
            console.log('Navigating to submission success page.');
             // Hide the modal before navigating
             if (submitConfirmModal) {
                 submitConfirmModal.style.display = 'none';
             }
            window.location.href = 'submission_success.html';
        });
    }

    if (cancelSubmitBtn) {
        cancelSubmitBtn.addEventListener('click', () => {
            console.log('Return to Exam button clicked in modal.');
             logActivity('Exam submission cancelled', 'info');
            // Hide the submit confirmation modal and return to the exam
             if (submitConfirmModal) {
                 submitConfirmModal.style.display = 'none';
             }
             // Do NOT resume timer or camera here, they weren't stopped by showing the modal
        });
    }


    // --- Placeholder Functions for Exam Logic ---

    // Placeholder function to load questions
    function loadQuestions() {
        console.log('Loading exam questions (placeholder)...');
        // TODO: Implement Fetch API call to backend to get question data
        // TODO: Update the #questionArea HTML with the first question
    }

    // Placeholder function to handle saving an answer (e.g., when option is selected or text entered)
    function saveAnswer(questionId, answerData) {
        console.log(`Saving answer for question ${questionId}: ${JSON.stringify(answerData)} (placeholder)...`);
        // TODO: Implement Fetch API call to backend to save the answer
    }

    // Placeholder function to navigate to the next question
    function nextQuestion() {
        console.log('Navigating to next question (placeholder)...');
        // TODO: Implement logic to load the next question from the fetched data
        // TODO: Update the #questionArea HTML
    }

    // Placeholder function to navigate to the previous question
    function prevQuestion() {
        console.log('Navigating to previous question (placeholder)...');
        // TODO: Implement logic to load the previous question from the fetched data
        // TODO: Update the #questionArea HTML
    }

     // Attach listeners for question navigation buttons
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');

    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', prevQuestion);
    }

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', nextQuestion);
    }

    // Initial load of questions when the page loads
    // loadQuestions(); // Uncomment when ready to implement question loading


    // --- Example: Simulate violations to test locking (for development) ---
    // Uncomment these lines to test the locking feature
    // setTimeout(() => { handleViolation('Simulated Violation 1'); }, 3000);
    // setTimeout(() => { handleViolation('Simulated Violation 2'); }, 6000);
    // setTimeout(() => { handleViolation('Simulated Violation 3'); }, 9000); // This should trigger lock

});

// Make stopCamera/stopTimer available globally or export if using modules (defined in their respective files)
// window.stopCamera = stopCamera;
// window.stopTimer = stopTimer;