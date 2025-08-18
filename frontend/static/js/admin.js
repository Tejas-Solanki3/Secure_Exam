// static/js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin Dashboard JS loaded.');

    // --- DOM Elements ---
    const activeSessionsCountElement = document.getElementById('activeSessionsCount');
    const pendingAlertsCountElement = document.getElementById('pendingAlertsCount');
    const courseFilterSelect = document.getElementById('courseFilterSelect');
    const sessionListElement = document.getElementById('sessionList');
    const sessionDetailsSectionElement = document.getElementById('sessionDetailsSection');
    const selectSessionMessageElement = document.getElementById('selectSessionMessage');
    const selectedSessionDetailsContentElement = document.getElementById('selectedSessionDetailsContent');
    const sessionsLoadingIndicator = document.getElementById('sessionsLoadingIndicator');
    const detailsLoadingIndicator = document.getElementById('detailsLoadingIndicator');
    const noSessionsMessage = document.getElementById('noSessionsMessage');

    // Detail elements
    const detailStudentNameElement = document.getElementById('detailStudentName');
    const detailStudentIdElement = document.getElementById('detailStudentId');
    const detailExamNameElement = document.getElementById('detailExamName');
    const detailExamCodeElement = document.getElementById('detailExamCode');
    const detailStartTimeElement = document.getElementById('detailStartTime');
    const detailEndTimeElement = document.getElementById('detailEndTime');
    const detailStatusElement = document.getElementById('detailStatus');
    const detailAlertCountElement = document.getElementById('detailAlertCount');
    const detailAlertListElement = document.getElementById('detailAlertList');
    const detailDownloadListElement = document.getElementById('detailDownloadList');
    const detailsActionsElement = document.getElementById('detailsActions');
    const reviewSessionBtn = document.getElementById('reviewSessionBtn');
    const flagSessionBtn = document.getElementById('flagSessionBtn');
    const noAlertsMessage = document.getElementById('noAlertsMessage');
    const noDownloadsMessage = document.getElementById('noDownloadsMessage');

    // Test Management Buttons
    const createTestBtn = document.getElementById('createTestBtn');
    const viewPastAnswersBtn = document.getElementById('viewPastAnswersBtn');
    const exportLogsBtn = document.getElementById('exportLogsBtn'); // New export button

    // --- Functions to Fetch Data from Backend ---

    async function fetchSummaryData() {
        console.log('Fetching summary data...');
        try {
            const response = await fetch('/api/admin/summary');
            const data = await response.json();
            if (response.ok) {
                if(activeSessionsCountElement) activeSessionsCountElement.textContent = data.activeSessions;
                if(pendingAlertsCountElement) pendingAlertsCountElement.textContent = data.pendingAlerts;
                console.log('Summary data loaded:', data);
            } else {
                console.error('Failed to fetch summary data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching summary data:', error);
        }
    }

    async function fetchExamOptions() {
        console.log('Fetching exam options...');
        try {
            const response = await fetch('/api/admin/exams');
            const data = await response.json();
            if (response.ok) {
                courseFilterSelect.innerHTML = ''; // Clear existing options
                data.exams.forEach(exam => {
                    const option = document.createElement('option');
                    option.value = exam.id;
                    option.textContent = exam.name;
                    courseFilterSelect.appendChild(option);
                });
                console.log('Exam options loaded:', data.exams);
            } else {
                console.error('Failed to fetch exam options:', data.message);
            }
        } catch (error) {
            console.error('Error fetching exam options:', error);
        }
    }

    async function fetchActiveSessions(filter = '') {
        console.log(`Fetching active sessions with filter: ${filter}...`);
        if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'block';
        if(sessionListElement) sessionListElement.innerHTML = '';
        if(noSessionsMessage) noSessionsMessage.style.display = 'none';
        if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none';
        if(selectSessionMessageElement) selectSessionMessageElement.style.display = 'block';

        try {
            const response = await fetch(`/api/admin/sessions?courseId=${filter}`);
            const data = await response.json();
            if (response.ok) {
                if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'none';

                if (data.sessions.length === 0) {
                    if(noSessionsMessage) noSessionsMessage.style.display = 'block';
                } else {
                    if(sessionListElement) {
                        data.sessions.forEach(session => {
                            const listItem = document.createElement('div');
                            listItem.classList.add('list-item');
                            listItem.dataset.sessionId = session.id;
                            listItem.innerHTML = `
                                <div class="item-info">
                                    <div class="item-title">${session.studentName}</div>
                                    <div class="item-meta">${session.examName}</div>
                                </div>
                                <span class="status-indicator ${session.status.toLowerCase()}"></span>
                                <span class="item-meta">${session.time}</span>
                                <i class="fas fa-chevron-right action-icon" style="margin-left: 10px;"></i>
                            `;
                            sessionListElement.appendChild(listItem);
                        });
                    }
                }
                console.log('Active sessions loaded:', data.sessions);
            } else {
                console.error('Failed to fetch sessions:', data.message);
                if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'none';
                if(noSessionsMessage) {
                    noSessionsMessage.textContent = `Error loading sessions: ${data.message}`;
                    noSessionsMessage.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'none';
            if(noSessionsMessage) {
                noSessionsMessage.textContent = `Network error loading sessions: ${error.message}`;
                noSessionsMessage.style.display = 'block';
            }
        }
    }

    async function fetchSessionDetails(sessionId) {
        console.log(`Fetching session details for: ${sessionId}...`);
        if(selectSessionMessageElement) selectSessionMessageElement.style.display = 'none';
        if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none';
        if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'block';

        try {
            const response = await fetch(`/api/admin/session/${sessionId}`);
            const data = await response.json();
            if (response.ok) {
                if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'none';
                if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'block';

                const details = data.details;
                if(detailStudentNameElement) detailStudentNameElement.textContent = details.studentName;
                if(detailStudentIdElement) detailStudentIdElement.textContent = details.studentId;
                if(detailExamNameElement) detailExamNameElement.textContent = details.examName;
                if(detailExamCodeElement) detailExamCodeElement.textContent = details.examCode;
                if(detailStartTimeElement) detailStartTimeElement.textContent = details.startTime;
                if(detailEndTimeElement) detailEndTimeElement.textContent = details.endTime;
                if(detailStatusElement) detailStatusElement.textContent = details.status;
                if(detailAlertCountElement) detailAlertCountElement.textContent = details.alerts.length;

                // Populate alerts list
                if(detailAlertListElement) {
                    detailAlertListElement.innerHTML = '';
                    if (details.alerts.length > 0) {
                        if(noAlertsMessage) noAlertsMessage.style.display = 'none';
                        details.alerts.forEach(alert => {
                            const alertItem = document.createElement('li');
                            const alertIconClass = alert.type === 'warning' ? 'fas fa-exclamation-triangle' :
                                                   alert.type === 'error' ? 'fas fa-times-circle' :
                                                   'fas fa-info-circle';
                            alertItem.innerHTML = `<i class="${alertIconClass} alert-icon"></i> ${alert.message} <span style="font-size: 0.9em; color: var(--text-subtle); margin-left: 5px;">${new Date(alert.timestamp).toLocaleTimeString()}</span>`;
                            detailAlertListElement.appendChild(alertItem);
                        });
                    } else {
                        if(noAlertsMessage) noAlertsMessage.style.display = 'block';
                    }
                }

                // Populate downloads list
                if(detailDownloadListElement) {
                    detailDownloadListElement.innerHTML = '';
                    if (details.downloadLinks.length > 0) {
                        if(noDownloadsMessage) noDownloadsMessage.style.display = 'none';
                        details.downloadLinks.forEach(link => {
                            const downloadItem = document.createElement('li');
                            const downloadIconClass = link.name.toLowerCase().includes('log') ? 'fas fa-file-alt' :
                                                      link.name.toLowerCase().includes('submission') ? 'fas fa-file-code' :
                                                      'fas fa-download';
                            downloadItem.innerHTML = `
                                <i class="${downloadIconClass} report-icon"></i>
                                <div class="item-info">
                                    <div class="item-title">${link.name}</div>
                                </div>
                                <a href="${link.url}" class="action-icon" download><i class="fas fa-download"></i></a>
                            `;
                            detailDownloadListElement.appendChild(downloadItem);
                        });
                    } else {
                        if(noDownloadsMessage) noDownloadsMessage.style.display = 'block';
                    }
                }
                if(detailsActionsElement) detailsActionsElement.style.display = 'flex';
                console.log('Session details loaded:', details);
            } else {
                console.error('Failed to fetch session details:', data.message);
                if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'none';
                if(selectSessionMessageElement) {
                    selectSessionMessageElement.textContent = `Details for session ${sessionId} not found: ${data.message}`;
                    selectSessionMessageElement.style.display = 'block';
                }
                if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching session details:', error);
            if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'none';
            if(selectSessionMessageElement) {
                selectSessionMessageElement.textContent = `Network error fetching details: ${error.message}`;
                selectSessionMessageElement.style.display = 'block';
            }
            if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none';
        }
    }

    async function exportAllLogs() {
        console.log('Exporting all logs...');
        try {
            const response = await fetch('/api/admin/export-all-logs-csv');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'all_proctoring_logs.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                alert('All logs exported successfully!');
                console.log('All logs exported.');
            } else {
                const errorData = await response.json();
                alert('Failed to export logs: ' + (errorData.message || 'Unknown error.'));
                console.error('Failed to export logs:', errorData);
            }
        } catch (error) {
            alert('Error exporting logs. Please check your network connection.');
            console.error('Error exporting logs:', error);
        }
    }


    // --- Event Listeners ---

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    const response = await fetch('/api/admin/logout', { method: 'POST' });
                    const result = await response.json();
                    if (response.ok) {
                        localStorage.removeItem('adminLoggedIn'); // Clear client-side flag
                        console.log('Admin logged out successfully.');
                        window.location.href = 'admin_login.html'; // Redirect to admin login page
                    } else {
                        alert('Logout failed: ' + (result.message || 'Error occurred.'));
                        console.error('Logout failed:', result);
                    }
                } catch (error) {
                    alert('Error during logout. Please try again.');
                    console.error('Error during logout fetch:', error);
                }
            }
        });
    }

    // Initial data load
    fetchSummaryData();
    fetchExamOptions();
    fetchActiveSessions();

    // Event delegation for session list items
    if (sessionListElement) {
        sessionListElement.addEventListener('click', (event) => {
            const listItem = event.target.closest('.list-item');
            if (listItem) {
                const sessionId = listItem.dataset.sessionId;
                if (sessionId) {
                    sessionListElement.querySelectorAll('.list-item').forEach(item => item.classList.remove('selected'));
                    listItem.classList.add('selected');
                    fetchSessionDetails(sessionId);
                }
            }
        });
    }

    // Course Filter
    if (courseFilterSelect) {
        courseFilterSelect.addEventListener('change', (event) => {
            fetchActiveSessions(event.target.value);
        });
    }

    // Export Logs Button
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', exportAllLogs);
    }

    // Test Management Buttons (Client-side redirects)
    // Note: createTestBtn is handled by the modal in admin_dashboard.html
    if (viewPastAnswersBtn) {
        viewPastAnswersBtn.addEventListener('click', () => {
            console.log('Navigating to past_answers.html');
            window.location.href = 'past_answers.html';
        });
    }

    // Note: manageStudentsBtn is handled by the modal in admin_dashboard.html

    // Client-side authentication check for admin dashboard (basic)
    // In a real app, this would be a backend check on every protected route
    // const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    // if (!adminLoggedIn) {
    //     alert('You must be logged in as an administrator to access this page.');
    //     window.location.href = 'admin_login.html';
    // }
});
