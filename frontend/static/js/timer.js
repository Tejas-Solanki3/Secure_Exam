// static/js/timer.js

let timerInterval;
let timeRemainingInSeconds;

function startTimer(durationInSeconds) {
    timeRemainingInSeconds = durationInSeconds;

    const timerDisplay = document.getElementById('timeRemaining');
    if (!timerDisplay) {
        console.error('Timer display element not found!');
        return;
    }

    function updateTimerDisplay() {
        const hours = Math.floor(timeRemainingInSeconds / 3600);
        const minutes = Math.floor((timeRemainingInSeconds % 3600) / 60);
        const seconds = timeRemainingInSeconds % 60;

        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.textContent = `${formattedTime} Remaining`;

        if (timeRemainingInSeconds <= 0) {
            clearInterval(timerInterval);
            console.log('Timer finished!');
            // TODO: Handle exam end when timer reaches zero
        } else {
            timeRemainingInSeconds--;
        }
    }

    // Update immediately and then every second
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    console.log('Timer stopped.');
}

function getRemainingTime() {
    return timeRemainingInSeconds;
}

// Example usage (would be called from exam.js)
// document.addEventListener('DOMContentLoaded', () => {
//     // Start a timer for 2 hours (7200 seconds)
//     // startTimer(7200);
// });