// static/js/past_answers.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Past Answers page JS loaded.');

    // Get elements
    const filterExamSelect = document.getElementById('filterExam');
    const filterStudentInput = document.getElementById('filterStudent');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const submissionListArea = document.getElementById('submissionList');
    const submissionsLoadingIndicator = document.getElementById('submissionsLoadingIndicator');
    const noSubmissionsMessage = document.getElementById('noSubmissionsMessage');
    const answerDetailsArea = document.getElementById('answerDetailsArea');
    const answerDetailsStudentName = document.getElementById('answerDetailsStudentName');
    const answerDetailsExamName = document.getElementById('answerDetailsExamName');
    const questionAnswerPairsArea = document.getElementById('questionAnswerPairs');


    // --- Placeholder Data (Simulating Backend Response) ---
    const mockSubmissions = [
        { id: 'sub123', studentName: 'Sarah Johnson', examName: 'Advanced Mathematics', submitTime: '14:30', examId: 'math101', studentId: 's001',
          answers: [
              { questionText: 'Q1: What is the derivative of x²?', studentAnswer: 'a) 2x', isCorrect: true },
              { questionText: 'Q2: Describe the process of photosynthesis.', studentAnswer: 'Photosynthesis is the process where plants use sunlight...', isCorrect: null }, // Subjective answers might not have isCorrect initially
              { questionText: 'Q3: Multiple Choice Question Example', studentAnswer: 'b) Option B', isCorrect: false }
          ]},
        { id: 'sub456', studentName: 'Michael Chen', examName: 'Physics 101', submitTime: '15:00', examId: 'phy101', studentId: 's002',
          answers: [
               { questionText: 'Q1: What is Newton\'s first law?', studentAnswer: 'An object at rest stays at rest unless acted upon by an external force.', isCorrect: true },
               { questionText: 'Q2: What is the speed of light?', studentAnswer: 'Around 300,000 km/s', isCorrect: true}
          ]},
        { id: 'sub789', studentName: 'Emily Davis', examName: 'Computer Science', submitTime: '16:00', examId: 'cs101', studentId: 's003',
          answers: [
               { questionText: 'Q1: What is JavaScript?', studentAnswer: 'A programming language.', isCorrect: true}
          ]},
        // Add more mock submissions
    ];

    // Mock exam data for filter options
     const mockExams = [{id: '', name: 'All Exams'}, {id: 'math101', name: 'Advanced Mathematics'}, {id: 'phy101', name: 'Physics 101'}, {id: 'cs101', name: 'Computer Science'}];


    // --- Placeholder Functions ---

    // Simulate fetching and displaying the list of submissions
    function loadSubmissions(examFilter = '', studentFilter = '') {
        console.log(`Loading submissions (placeholder) with exam filter: ${examFilter}, student filter: ${studentFilter}...`);
        if(submissionsLoadingIndicator) submissionsLoadingIndicator.style.display = 'block'; // Show loading indicator
        if(submissionListArea) submissionListArea.innerHTML = ''; // Clear previous list
        if(noSubmissionsMessage) noSubmissionsMessage.style.display = 'none'; // Hide no submissions message
        if(answerDetailsArea) answerDetailsArea.style.display = 'none'; // Hide answer details when loading list


        // Simulate network delay
        setTimeout(() => {
            if(submissionsLoadingIndicator) submissionsLoadingIndicator.style.display = 'none'; // Hide loading indicator
            // TODO: Implement Fetch API call to backend with filters

            // Filter mock data
            const filteredSubmissions = mockSubmissions.filter(submission => {
                const matchesExam = examFilter === '' || submission.examId === examFilter;
                const matchesStudent = studentFilter === '' ||
                                       submission.studentId.toLowerCase().includes(studentFilter.toLowerCase()) ||
                                       submission.studentName.toLowerCase().includes(studentFilter.toLowerCase());
                return matchesExam && matchesStudent;
            });


            if (filteredSubmissions.length === 0) {
                if(noSubmissionsMessage) noSubmissionsMessage.style.display = 'block';
            } else {
                // Populate the submission list
                if(submissionListArea) {
                     filteredSubmissions.forEach(submission => {
                        const submissionItem = document.createElement('div');
                        submissionItem.classList.add('submission-item');
                        submissionItem.dataset.submissionId = submission.id; // Store submission ID
                        submissionItem.innerHTML = `
                            <div class="submission-info">
                                <div class="student-name">${submission.studentName}</div>
                                <div class="exam-details">${submission.examName} - Submitted ${submission.submitTime}</div>
                            </div>
                             <button class="btn view-answers-btn btn-sm" data-submission-id="${submission.id}">View Answers</button> <!-- Added data-id -->
                        `;
                        submissionListArea.appendChild(submissionItem);
                    });
                }
            }
             console.log('Submissions loaded (placeholder).');
        }, 500); // Simulate 0.5 second load time
    }

    // Simulate fetching and displaying details for a single submission
    function viewSubmissionAnswers(submissionId) {
        console.log(`Viewing answers for submission: ${submissionId} (placeholder)...`);
        // TODO: Implement Fetch API call to backend for specific submission details

        // Find the submission in mock data
        const selectedSubmission = mockSubmissions.find(submission => submission.id === submissionId);

        if (selectedSubmission && answerDetailsArea && answerDetailsStudentName && answerDetailsExamName && questionAnswerPairsArea) {
            // Populate the answer details area
            answerDetailsStudentName.textContent = selectedSubmission.studentName;
            answerDetailsExamName.textContent = selectedSubmission.examName;
            questionAnswerPairsArea.innerHTML = ''; // Clear previous answers

            selectedSubmission.answers.forEach(pair => {
                const pairDiv = document.createElement('div');
                pairDiv.classList.add('question-answer-pair');

                 let answerClass = '';
                 if (pair.isCorrect === true) answerClass = 'correct';
                 else if (pair.isCorrect === false) answerClass = 'incorrect';
                 // Subjective answers might not have a class initially

                pairDiv.innerHTML = `
                    <div class="question-text">${pair.questionText}</div>
                    <div class="student-answer ${answerClass}">Student Answer: ${pair.studentAnswer}</div>
                `;
                questionAnswerPairsArea.appendChild(pairDiv);
            });

            answerDetailsArea.style.display = 'block'; // Show the answer details area

        } else {
            console.error(`Submission with ID ${submissionId} not found or elements missing.`);
             if(answerDetailsArea) answerDetailsArea.style.display = 'none';
             alert(`Submission details for ID ${submissionId} not found.`);
        }
    }


    // Simulate loading filter options (e.g., list of exams)
    function loadFilterOptions() {
        console.log('Loading filter options (placeholder)...');
        // TODO: Implement Fetch API call to backend to get list of exams etc.
         // Populate the exam filter select
        if(filterExamSelect) {
             mockExams.forEach(exam => {
                const option = document.createElement('option');
                option.value = exam.id;
                option.textContent = exam.name;
                filterExamSelect.appendChild(option);
            });
        }
        console.log('Filter options loaded (placeholder).');
    }


    // --- Event Listeners ---

    // Initial load of filter options and submissions
    loadFilterOptions();
    loadSubmissions(); // Load initial list


    // Handle filter button click
    if (applyFilterBtn && filterExamSelect && filterStudentInput) {
        applyFilterBtn.addEventListener('click', () => {
            const selectedExam = filterExamSelect.value;
            const studentSearch = filterStudentInput.value.trim();
            loadSubmissions(selectedExam, studentSearch);
        });
    }

    // Handle clicking on a submission item OR the "View Answers" button to view answers
     if (submissionListArea) {
         submissionListArea.addEventListener('click', (event) => {
             const submissionItem = event.target.closest('.submission-item');
             const viewButton = event.target.closest('.view-answers-btn');

             let submissionId = null;
             if (submissionItem) {
                 submissionId = submissionItem.dataset.submissionId;
             } else if (viewButton) {
                 submissionId = viewButton.dataset.submissionId; // Get from button's data attribute
                 event.stopPropagation(); // Prevent click from bubbling up to the parent .submission-item if both are clicked
             }


             if (submissionId) {
                 // Remove 'selected' class from previous and add to the clicked item
                 if (submissionItem) { // Ensure we have the list item if clicked directly
                    submissionListArea.querySelectorAll('.submission-item').forEach(item => item.classList.remove('selected'));
                    submissionItem.classList.add('selected');
                 } else if (viewButton) { // If button clicked, find the parent item
                     const parentItem = viewButton.closest('.submission-item');
                     if (parentItem) {
                        submissionListArea.querySelectorAll('.submission-item').forEach(item => item.classList.remove('selected'));
                        parentItem.classList.add('selected');
                     }
                 }

                 viewSubmissionAnswers(submissionId);
             }
         });
     }


     // Optional: Implement logic for marking subjective answers as correct/incorrect if needed
     // This would require more UI elements and JS logic, likely involving backend updates.

});