// static/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard JS loaded.');

    // Get elements (Ensure IDs match admin_dashboard.html)
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
    const detailExamNameElement = document.getElementById('detailExamName');
    const detailExamTimeElement = document.getElementById('detailExamTime');
    const detailAlertCountElement = document.getElementById('detailAlertCount');
    const detailAlertListElement = document.getElementById('detailAlertList');
    const detailDownloadListElement = document.getElementById('detailDownloadList');
    const detailsActionsElement = document.getElementById('detailsActions');
    const reviewSessionBtn = document.getElementById('reviewSessionBtn');
    const flagSessionBtn = document.getElementById('flagSessionBtn');
    const noAlertsMessage = document.getElementById('noAlertsMessage');
     const noDownloadsMessage = document.getElementById('noDownloadsMessage');

    // Test Management Buttons (Ensure these IDs are correct!)
    const createTestBtn = document.getElementById('createTestBtn');
    const viewPastAnswersBtn = document.getElementById('viewPastAnswersBtn');


    // --- Placeholder Data (Simulating Backend Response) ---
    const mockSessions = [
        { id: 'sess123', studentName: 'Sarah Johnson', examName: 'Advanced Mathematics', time: '10:30 AM', status: 'active', alerts: [{type: 'face', time: '10:45 AM'}, {type: 'leave', time: '10:42 AM'}, {type: 'noise', time: '10:42 AM'}], downloads: [{name: 'Session Log', size: '2.4 MB'}, {name: 'Recorded Video', size: '15:30 mins'}] },
        { id: 'sess456', studentName: 'Michael Chen', examName: 'Physics 101', time: '11:15 AM', status: 'active', alerts: [], downloads: [] },
        { id: 'sess789', studentName: 'Emily Davis', examName: 'Computer Science', time: '12:00 PM', status: 'active', alerts: [{type: 'face', time: '12:10 PM'}], downloads: [{name: 'Session Log', size: '2.0 MB'}] },
        // Add more mock sessions as needed
    ];

     // --- Placeholder Functions ---

    // Simulate fetching and displaying summary data
    function loadSummaryData() {
        console.log('Loading summary data (placeholder)...');
        // TODO: Implement Fetch API call to backend
        // Update the counts on the cards
        if(activeSessionsCountElement) activeSessionsCountElement.textContent = mockSessions.length;
        const pendingAlerts = mockSessions.reduce((count, session) => count + session.alerts.length, 0);
         if(pendingAlertsCountElement) pendingAlertsCountElement.textContent = pendingAlerts;
         console.log('Summary data loaded (placeholder).');
    }


    // Simulate fetching and displaying active sessions list
    function loadActiveSessions(filter = '') {
        console.log(`Loading active sessions (placeholder) with filter: ${filter}...`);
         if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'block'; // Show loading indicator
         if(sessionListElement) sessionListElement.innerHTML = ''; // Clear previous list
         if(noSessionsMessage) noSessionsMessage.style.display = 'none'; // Hide no sessions message
         if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none'; // Hide details when loading list
         if(selectSessionMessageElement) selectSessionMessageElement.style.display = 'block'; // Show select session message

        // Simulate network delay
        setTimeout(() => {
             if(sessionsLoadingIndicator) sessionsLoadingIndicator.style.display = 'none'; // Hide loading indicator
            // TODO: Implement Fetch API call to backend with filter
            // Filter mock data based on the selected course
            const filteredSessions = filter
                ? mockSessions.filter(session => session.examName.toLowerCase().includes(filter.toLowerCase())) // Basic mock filtering
                : mockSessions;

            if (filteredSessions.length === 0) {
                 if(noSessionsMessage) noSessionsMessage.style.display = 'block';
            } else {
                // Populate the session list
                if(sessionListElement) {
                     filteredSessions.forEach(session => {
                        const listItem = document.createElement('div');
                        listItem.classList.add('list-item');
                        listItem.dataset.sessionId = session.id; // Store session ID
                        listItem.innerHTML = `
                            <div class="item-info">
                                <div class="item-title">${session.studentName}</div>
                                <div class="item-meta">${session.examName}</div>
                            </div>
                            <span class="status-indicator active"></span> <!-- Assume active for now -->
                            <span class="item-meta">${session.time}</span>
                            <i class="fas fa-chevron-right action-icon" style="margin-left: 10px;"></i>
                        `;
                        sessionListElement.appendChild(listItem);
                    });
                }
            }
             console.log('Active sessions loaded (placeholder).');
        }, 500); // Simulate 0.5 second load time
    }

    // Simulate fetching and displaying session details
    function handleSessionClick(sessionId) {
        console.log(`Session item clicked: ${sessionId}. Loading details (placeholder)...`);
        if(selectSessionMessageElement) selectSessionMessageElement.style.display = 'none'; // Hide initial message
        if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none'; // Hide previous details
        if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'block'; // Show loading indicator

        // Simulate network delay
        setTimeout(() => {
            if(detailsLoadingIndicator) detailsLoadingIndicator.style.display = 'none'; // Hide loading indicator
            // TODO: Implement Fetch API call to backend to get detailed info for the selected session
            // Find the session in mock data
            const selectedSession = mockSessions.find(session => session.id === sessionId);

            if (selectedSession && selectedSessionDetailsContentElement) {
                 selectedSessionDetailsContentElement.style.display = 'block'; // Show the container for details

                // Populate the detail sections
                 if(detailStudentNameElement) detailStudentNameElement.textContent = selectedSession.studentName;
                 if(detailExamNameElement) detailExamNameElement.textContent = selectedSession.examName;
                 if(detailExamTimeElement) detailExamTimeElement.textContent = selectedSession.time;
                 if(detailAlertCountElement) detailAlertCountElement.textContent = selectedSession.alerts.length;

                // Populate alerts list
                 if(detailAlertListElement) {
                     detailAlertListElement.innerHTML = ''; // Clear previous alerts
                      if (selectedSession.alerts.length > 0) {
                          if(noAlertsMessage) noAlertsMessage.style.display = 'none';
                         selectedSession.alerts.forEach(alert => {
                            const alertItem = document.createElement('li');
                            // Basic alert type to icon mapping (can be more detailed)
                             const alertIconClass = alert.type === 'face' ? 'fas fa-user-times' :
                                                  alert.type === 'leave' ? 'fas fa-video-slash' :
                                                  alert.type === 'noise' ? 'fas fa-volume-up' :
                                                  'fas fa-exclamation-triangle'; // Default icon
                            alertItem.innerHTML = `<i class="${alertIconClass} alert-icon"></i> ${alert.type} detected <span style="font-size: 0.9em; color: var(--text-medium); margin-left: 5px;">${alert.time}</span>`;
                            detailAlertListElement.appendChild(alertItem);
                        });
                     } else {
                          if(noAlertsMessage) noAlertsMessage.style.display = 'block';
                     }
                      if(detailsAlerts) detailsAlerts.style.display = 'block'; // Show alerts section container
                 }


                // Populate downloads list
                 if(detailDownloadListElement) {
                     detailDownloadListElement.innerHTML = ''; // Clear previous downloads
                      if (selectedSession.downloads.length > 0) {
                          if(noDownloadsMessage) noDownloadsMessage.style.display = 'none';
                         selectedSession.downloads.forEach(download => {
                             const downloadItem = document.createElement('li');
                              // Basic file type to icon mapping
                              const downloadIconClass = download.name.toLowerCase().includes('log') ? 'fas fa-file-alt' :
                                                        download.name.toLowerCase().includes('video') ? 'fas fa-video' :
                                                        'fas fa-download'; // Default icon

                             downloadItem.innerHTML = `
                                 <i class="${downloadIconClass} report-icon"></i>
                                 <div class="item-info">
                                     <div class="item-title">${download.name}</div>
                                     <div class="item-meta">${download.size}</div>
                                 </div>
                                  <i class="fas fa-download action-icon"></i>
                             `;
                             detailDownloadListElement.appendChild(downloadItem);
                         });
                      } else {
                           if(noDownloadsMessage) noDownloadsMessage.style.display = 'block';
                      }
                      if(detailsDownloads) detailsDownloads.style.display = 'block'; // Show downloads section container
                 }


                if(detailsBasicInfo) detailsBasicInfo.style.display = 'block'; // Show basic info section
                if(detailsActionsElement) detailsActionsElement.style.display = 'flex'; // Show action buttons


            } else {
                console.error(`Session with ID ${sessionId} not found.`);
                 if(selectSessionMessageElement) {
                     selectSessionMessageElement.textContent = `Details for session ${sessionId} not found.`;
                     selectSessionMessageElement.style.display = 'block';
                 }
                 if(selectedSessionDetailsContentElement) selectedSessionDetailsContentElement.style.display = 'none'; // Ensure content is hidden
            }
             console.log('Session details loaded (placeholder).');
        }, 500); // Simulate 0.5 second load time
    }

    // Placeholder function for 'Review Session' button
    function reviewSession(sessionId) {
        console.log(`Review Session clicked for: ${sessionId} (placeholder)`);
        // TODO: Implement Redirect to a dedicated session review page or open a complex modal
         alert(`Review session feature coming soon for session: ${sessionId}!`);
    }

    // Placeholder function for 'Flag for Review' button
    function flagSessionForReview(sessionId) {
        console.log(`Flag for Review clicked for: ${sessionId} (placeholder)`);
        // TODO: Implement Fetch API call to send flag action to backend
        alert(`Session ${sessionId} flagged for review!`);
    }

    // Placeholder function for 'Create New Test' button
    function createNewTest() {
        console.log('Create New Test clicked (placeholder)');
        // TODO: Redirect to a test creation page or show a modal form
        console.log('Navigating to create_test.html'); // Log navigation
        window.location.href = 'create_test.html'; // Navigate to the new page
    }

    // Placeholder function for 'View Past Answers' button
    function viewPastAnswers() {
         console.log('View Past Answers clicked (placeholder)');
        // TODO: Redirect to a page for viewing past student submissions
         console.log('Navigating to past_answers.html'); // Log navigation
         window.location.href = 'past_answers.html'; // Navigate to the new page
    }


    // --- Event Listeners ---

    // Initial data load
    loadSummaryData(); // Load summary counts
    loadActiveSessions(); // Load the initial list of sessions


     // Add click listener to session list items using event delegation
    if (sessionListElement) {
        sessionListElement.addEventListener('click', (event) => {
            const listItem = event.target.closest('.list-item');
            if (listItem) {
                const sessionId = listItem.dataset.sessionId; // Get session ID from data attribute
                if (sessionId) {
                    // Remove 'selected' class from previous item and add to current (for styling)
                    sessionListElement.querySelectorAll('.list-item').forEach(item => item.classList.remove('selected'));
                    listItem.classList.add('selected');
                    handleSessionClick(sessionId);
                }
            }
        });
    }


    // Attach change listener to the course filter select
    if (courseFilterSelect) {
        courseFilterSelect.addEventListener('change', (event) => {
            handleCourseFilterChange(event.target.value);
        });
    }

    // Attach click listeners to detail action buttons using event delegation on the details section
    if (sessionDetailsSectionElement) {
        sessionDetailsSectionElement.addEventListener('click', (event) => {
            const reviewBtn = event.target.closest('#reviewSessionBtn');
            const flagBtn = event.target.closest('#flagSessionBtn');
            const downloadIcon = event.target.closest('.download-items .action-icon'); // Listener for download icons

            // In a real app, you'd get the session ID from the currently displayed details
            // For placeholder, we can use the ID of the currently selected item in the list
            const selectedListItem = sessionListElement ? sessionListElement.querySelector('.list-item.selected') : null;
            const currentSessionId = selectedListItem ? selectedListItem.dataset.sessionId : null;


            if (reviewBtn && currentSessionId) {
                reviewSession(currentSessionId);
            } else if (flagBtn && currentSessionId) {
                 flagSessionForReview(currentSessionId);
            } else if (downloadIcon) {
                 // Handle download click
                 const downloadItem = downloadIcon.closest('li');
                 const downloadName = downloadItem ? downloadItem.querySelector('.item-title').textContent : 'file';
                 console.log(`Download icon clicked for: ${downloadName} (placeholder). Session ID: ${currentSessionId}`);
                 alert(`Simulating download for "${downloadName}" (if session ${currentSessionId} is valid)`);
                 // TODO: Implement actual download logic (may involve backend endpoint)
            }
             // TODO: Add listeners for alert items if they are clickable (e.g., to view alert details/snapshots)
        });
    }


    // Attach listeners for Test Management buttons (Targeted by ID)
     if (createTestBtn) {
         console.log('Attaching click listener to #createTestBtn');
         createTestBtn.addEventListener('click', createNewTest);
     } else {
         console.error("#createTestBtn not found!");
     }

      if (viewPastAnswersBtn) {
          console.log('Attaching click listener to #viewPastAnswersBtn');
         viewPastAnswersBtn.addEventListener('click', viewPastAnswers);
     } else {
         console.error("#viewPastAnswersBtn not found!");
     }


     // TODO: Add logic to load course filter options from backend on page load

});