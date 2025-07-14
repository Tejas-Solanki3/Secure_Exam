// static/js/create_test.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Create Test page JS loaded.');
    const questionsArea = document.getElementById('questionsArea');
    const addQuestionTypeBtn = document.getElementById('addQuestionTypeBtn');
    const questionTypeSelect = document.getElementById('questionType');
    const createTestForm = document.getElementById('createTestForm');

    let questionCounter = 0; // To give unique IDs to questions

    // Function to add a question form based on type
    function addQuestionForm(type) {
        questionCounter++;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-form-area');
        questionDiv.dataset.questionType = type;
        questionDiv.dataset.questionId = `q${questionCounter}`; // Use dataset for ID

        let questionHtml = `<div class="form-group">
                                 <label for="questionText_${questionDiv.dataset.questionId}">Question Text:</label>
                                 <textarea id="questionText_${questionDiv.dataset.questionId}" rows="3" required></textarea>
                             </div>`;

        if (type === 'mcq') {
            questionHtml += `
                <div class="form-group">
                    <label>Options:</label>
                    <ul class="options-list" data-question-id="${questionDiv.dataset.questionId}">
                        <li><input type="text" placeholder="Option A" required><button type="button" class="remove-option-btn"><i class="fas fa-times-circle"></i></button></li>
                         <li><input type="text" placeholder="Option B" required><button type="button" class="remove-option-btn"><i class="fas fa-times-circle"></i></button></li>
                    </ul>
                    <button type="button" class="btn btn-secondary btn-sm add-option-btn" data-question-id="${questionDiv.dataset.questionId}"><i class="fas fa-plus-circle"></i> Add Option</button>
                </div>
                <div class="form-group">
                     <label>Correct Answer(s) (Option letters, e.g., A,C):</label>
                     <input type="text" placeholder="A" required>
                </div>
            `;
        }
        // Subjective questions only need the text area

        questionHtml += `<button type="button" class="btn btn-danger btn-sm" style="float: right;" data-question-id="${questionDiv.dataset.questionId}">Remove Question</button>`;


        questionDiv.innerHTML = questionHtml;
        questionsArea.appendChild(questionDiv);

        console.log(`Added ${type} question form with ID: ${questionDiv.dataset.questionId}`);
    }

    // Add initial event listener for "Add Question" button
    if (addQuestionTypeBtn) {
        addQuestionTypeBtn.addEventListener('click', () => {
            const selectedType = questionTypeSelect.value;
            addQuestionForm(selectedType);
        });
    }

    // Event delegation for Remove Question and Add Option buttons within questionsArea
    if (questionsArea) {
        questionsArea.addEventListener('click', (event) => {
            const removeQuestionBtn = event.target.closest('.question-form-area .btn-danger');
            if (removeQuestionBtn) {
                 const questionDiv = removeQuestionBtn.closest('.question-form-area');
                if (questionDiv) {
                     console.log('Removing question:', questionDiv.dataset.questionId);
                    questionDiv.remove();
                }
            }

            const addOptionBtn = event.target.closest('.add-option-btn');
            if (addOptionBtn) {
                const optionsList = addOptionBtn.closest('.form-group').querySelector('.options-list');
                if (optionsList) {
                     const optionItem = document.createElement('li');
                    const optionLetter = String.fromCharCode(65 + optionsList.children.length); // A, B, C, ...
                    optionItem.innerHTML = `<input type="text" placeholder="Option ${optionLetter}" required><button type="button" class="remove-option-btn"><i class="fas fa-times-circle"></i></button>`;
                    optionsList.appendChild(optionItem);
                    console.log('Added option to question:', addOptionBtn.dataset.questionId);
                }
            }

            const removeOptionBtn = event.target.closest('.remove-option-btn');
             // Ensure it's a remove option button, not remove question button
            if (removeOptionBtn && !removeOptionBtn.closest('.question-form-area .btn-danger')) {
                 const optionItem = removeOptionBtn.closest('li');
                if (optionItem) {
                     const optionsList = optionItem.closest('.options-list');
                    if (optionsList && optionsList.children.length > 2) { // Don't remove if only 2 options left
                        optionItem.remove();
                        console.log('Removed option.');
                        // Re-label options if needed (optional, more complex)
                    } else {
                        alert('MCQ questions must have at least 2 options.');
                    }
                }
            }
        });
    }


    // Handle form submission (Save Test)
    if (createTestForm) {
        createTestForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log('Create Test form submitted.');

            // TODO: Collect test data (title, duration)
            const testTitle = document.getElementById('testTitle').value;
            const testDuration = document.getElementById('testDuration').value;
            console.log('Test details:', { title: testTitle, duration: testDuration });

            // TODO: Collect question data from #questionsArea
            const questionsData = [];
            let validationError = false; // Flag for frontend validation

            questionsArea.querySelectorAll('.question-form-area').forEach(questionDiv => {
                const questionId = questionDiv.dataset.questionId;
                const questionType = questionDiv.dataset.questionType;
                const questionTextarea = questionDiv.querySelector('textarea');
                 const questionText = questionTextarea ? questionTextarea.value.trim() : '';

                 if (!questionText) {
                     alert(`Question text for ${questionId} is required.`);
                     questionTextarea.focus();
                     validationError = true;
                     return; // Skip this question and mark form as invalid
                 }

                const questionData = {
                    id: questionId,
                    type: questionType,
                    text: questionText
                };

                if (questionType === 'mcq') {
                    const options = [];
                     let hasValidOption = false;
                    questionDiv.querySelectorAll('.options-list input[type="text"]').forEach((input, index) => {
                         const optionText = input.value.trim();
                         if (optionText) {
                              const optionLetter = String.fromCharCode(65 + index);
                             options.push({ letter: optionLetter, text: optionText });
                             hasValidOption = true;
                         } else {
                             // Alert for empty options
                             alert(`Option ${String.fromCharCode(65 + index)} for ${questionId} is empty.`);
                              input.focus();
                             validationError = true;
                         }
                    });

                    if (options.length < 2 && !validationError) {
                         alert(`MCQ question ${questionId} must have at least 2 options.`);
                         validationError = true;
                    }


                     const correctAnswerInput = questionDiv.querySelector('.form-group input[type="text"]:last-child');
                    const correctAnswers = correctAnswerInput ? correctAnswerInput.value.toUpperCase().split(',').map(item => item.trim()).filter(item => item) : [];

                    if (correctAnswers.length === 0 && !validationError) {
                         alert(`Correct answer(s) for MCQ question ${questionId} are required.`);
                         correctAnswerInput.focus();
                         validationError = true;
                    } else {
                         // Optional: Validate if correct answer letters match existing options
                         const validOptionLetters = options.map(opt => opt.letter);
                         const invalidCorrectAnswers = correctAnswers.filter(ca => !validOptionLetters.includes(ca));
                         if (invalidCorrectAnswers.length > 0 && !validationError) {
                              alert(`Invalid correct answer letter(s) for MCQ question ${questionId}: ${invalidCorrectAnswers.join(', ')}. Options are ${validOptionLetters.join(', ')}.`);
                             correctAnswerInput.focus();
                             validationError = true;
                         }
                    }


                    questionData.options = options;
                    questionData.correctAnswers = correctAnswers; // For marking purposes
                }
                // Subjective questions have no options or correct answers field here

                questionsData.push(questionData);

                 // Stop iterating if validation error occurred
                 if (validationError) return;

            });

             // Prevent submission if there was a validation error during question processing
             if (validationError) {
                 console.warn('Frontend validation failed. Stopping submission.');
                 return;
             }

            // Final check: Ensure at least one question is added
             if (questionsData.length === 0) {
                 alert('Please add at least one question to the test.');
                 return;
             }


            console.log('Collected Questions data:', questionsData);


            // TODO: Implement Fetch API call to backend endpoint to save the test data.
            // Example:
            /*
            fetch('/api/admin/create_test', { // Replace with your actual backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                     // Include auth token if needed
                },
                body: JSON.stringify({
                    title: testTitle,
                    duration: testDuration,
                    questions: questionsData
                })
            })
            .then(response => {
                 if (!response.ok) {
                     // Handle HTTP errors (e.g., 400, 500)
                     return response.json().then(error => { throw new Error(error.message || 'Failed to create test'); });
                 }
                 return response.json();
            })
            .then(data => {
                console.log('Test creation response:', data);
                if (data.success) {
                    alert('Test created successfully!');
                    // TODO: Redirect to test list page or show confirmation
                    // window.location.href = 'admin_tests.html'; // Example
                } else {
                    // This else block might not be needed if HTTP errors are caught above,
                    // but good for backend sending success: false in 200 OK
                     alert('Failed to create test: ' + (data.message || 'Unknown error'));
                }
            })
            .catch((error) => {
                console.error('Error during test creation fetch:', error);
                alert('An error occurred while creating the test: ' + error.message);
            });
            */

            // For Demo: Just show collected data in console and alert success
            console.log('Simulating test creation with data:', {
                title: testTitle,
                duration: testDuration,
                questions: questionsData
            });
            alert('Test creation form submitted (placeholder). Check console for data.');
        });
    }


});