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

        if (timeRemainingInSeconds < 0) {
            clearInterval(timerInterval);
            console.log('Timer finished!');
            alert("Time's up! The exam will now be submitted.");
            // In a real app, this would trigger the submit function
            // window.submitExam(); 
        } else {
            timeRemainingInSeconds--;
        }
    }

    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    console.log('Timer stopped.');
}

window.startTimer = startTimer;
window.stopTimer = stopTimer;
