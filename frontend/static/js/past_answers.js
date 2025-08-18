// past_answers.js - Admin submissions review page

document.addEventListener('DOMContentLoaded', () => {
    console.log('Past Answers page loaded.');

    // DOM Elements
    const filterExamSelect = document.getElementById('filterExam');
    const filterStudentInput = document.getElementById('filterStudent');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const submissionsLoadingIndicator = document.getElementById('submissionsLoadingIndicator');
    const noSubmissionsMessage = document.getElementById('noSubmissionsMessage');
    const submissionList = document.getElementById('submissionList');

    let allSubmissions = [];
    let filteredSubmissions = [];

    // Initialize the page
    async function initializePage() {
        await fetchExamOptions();
        await fetchSubmissions();
    }

    // Fetch exam options for filter dropdown
    async function fetchExamOptions() {
        try {
            const response = await fetch('/api/admin/exams');
            const data = await response.json();
            if (response.ok) {
                filterExamSelect.innerHTML = '<option value="">All Exams</option>';
                data.exams.forEach(exam => {
                    const option = document.createElement('option');
                    option.value = exam.id;
                    option.textContent = exam.name;
                    filterExamSelect.appendChild(option);
                });
            } else {
                console.error('Failed to fetch exam options:', data.message);
            }
        } catch (error) {
            console.error('Error fetching exam options:', error);
        }
    }

    // Fetch all submissions
    async function fetchSubmissions() {
        showLoading(true);
        try {
            const response = await fetch('/api/admin/submissions');
            const data = await response.json();
            if (response.ok) {
                allSubmissions = data.submissions || [];
                filteredSubmissions = [...allSubmissions];
                renderSubmissions();
            } else {
                console.error('Failed to fetch submissions:', data.message);
                showNoSubmissions('Failed to load submissions.');
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showNoSubmissions('Network error loading submissions.');
        } finally {
            showLoading(false);
        }
    }

    // Render submissions list
    function renderSubmissions() {
        if (filteredSubmissions.length === 0) {
            showNoSubmissions('No submissions found matching criteria.');
            return;
        }

        submissionList.innerHTML = '';
        filteredSubmissions.forEach(submission => {
            const submissionCard = createSubmissionCard(submission);
            submissionList.appendChild(submissionCard);
        });
    }

    // Create a submission card
    function createSubmissionCard(submission) {
        const card = document.createElement('div');
        card.className = 'submission-card';
        
        const startTime = new Date(submission.start_time).toLocaleString();
        const warningCount = submission.logs.filter(log => log.type === 'warning').length;
        
        card.innerHTML = `
            <div class="submission-header">
                <div class="submission-info">
                    <h3>${submission.student_name}</h3>
                    <p class="submission-meta">
                        <span><i class="fas fa-user"></i> ${submission.student_id}</span>
                        <span><i class="fas fa-file-alt"></i> ${submission.exam_name}</span>
                        <span><i class="fas fa-clock"></i> ${startTime}</span>
                    </p>
                </div>
                <div class="submission-score">
                    <span class="score-badge">${submission.score}</span>
                </div>
            </div>
            <div class="submission-details">
                <div class="detail-item">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${warningCount} warnings</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-question-circle"></i>
                    <span>${submission.answers.length} questions</span>
                </div>
            </div>
            <div class="submission-actions">
                <a href="admin_review.html?session_id=${submission.session_id}" class="btn btn-primary btn-review">
                    <i class="fas fa-search"></i> Review
                </a>
            </div>
        `;
        
        return card;
    }

    // Apply filters
    function applyFilters() {
        const selectedExam = filterExamSelect.value;
        const studentFilter = filterStudentInput.value.toLowerCase();

        filteredSubmissions = allSubmissions.filter(submission => {
            const examMatch = !selectedExam || submission.test_id === selectedExam;
            const studentMatch = !studentFilter || 
                submission.student_name.toLowerCase().includes(studentFilter) ||
                submission.student_id.toLowerCase().includes(studentFilter);
            
            return examMatch && studentMatch;
        });

        renderSubmissions();
    }

    // Show/hide loading indicator
    function showLoading(show) {
        if (submissionsLoadingIndicator) {
            submissionsLoadingIndicator.style.display = show ? 'block' : 'none';
        }
        if (submissionList) {
            submissionList.style.display = show ? 'none' : 'block';
        }
    }

    // Show no submissions message
    function showNoSubmissions(message) {
        if (noSubmissionsMessage) {
            noSubmissionsMessage.textContent = message;
            noSubmissionsMessage.style.display = 'block';
        }
        if (submissionList) {
            submissionList.style.display = 'none';
        }
    }

    // Event listeners
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }

    if (filterStudentInput) {
        filterStudentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    if (filterExamSelect) {
        filterExamSelect.addEventListener('change', applyFilters);
    }

    // Initialize the page
    initializePage();
}); 