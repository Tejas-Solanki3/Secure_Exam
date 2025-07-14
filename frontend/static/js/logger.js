// static/js/logger.js

const logList = document.getElementById('logList'); // Assuming an ol/ul with id="logList" in exam.html

function logActivity(message, type = 'info') {
    console.log(`[Log - ${type.toUpperCase()}] ${message}`);

    if (logList) {
        const li = document.createElement('li');
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let iconClass = 'fas fa-info-circle'; // Default info icon
        let iconColorClass = 'log-icon-info';

        if (type === 'success') {
            iconClass = 'fas fa-check-circle';
            iconColorClass = 'log-icon-success';
        } else if (type === 'warning') {
            iconClass = 'fas fa-exclamation-triangle';
            iconColorClass = 'log-icon-warning';
        } else if (type === 'error') {
             iconClass = 'fas fa-times-circle';
            iconColorClass = 'log-icon-error';
        }


        li.innerHTML = `<span class="log-time">${timeString}</span> <span class="log-message">${message}</span> <i class="${iconClass} ${iconColorClass}"></i>`;

        // Add some basic styles for log icons if not in style.css yet
        if (!document.querySelector('.log-icon-info')) {
             const styleSheet = document.styleSheets[0];
            styleSheet.insertRule('.log-icon-info { color: gray; }', styleSheet.cssRules.length);
            styleSheet.insertRule('.log-icon-warning { color: orange; }', styleSheet.cssRules.length);
             styleSheet.insertRule('.log-icon-error { color: red; }', styleSheet.cssRules.length);
        }


        // Add new log entry to the top
        logList.prepend(li);
    }
}

// Example usage (would be called from exam.js or other modules)
// document.addEventListener('DOMContentLoaded', () => {
//     logActivity('Exam interface loaded', 'success');
// });