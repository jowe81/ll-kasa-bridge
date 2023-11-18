// ChatGPT
function msToTime(milliseconds, seconds = true) {
    // Calculate hours, minutes, and seconds
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // Format the time components with leading zeros if necessary
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    let result = `${formattedHours}:${formattedMinutes}`;
    if (seconds) {
      result += `:${formattedSeconds}`;
    }

    return result;
}

export {
  msToTime,
}