import './clock.css';

import { useState, useEffect } from "react";

function Clock(props: any) {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    setInterval(() => {
      setTime(Date.now())      
    }, 1000);
  }, []);

    
  return <><div className="fullscreen-panel-clock">{currentTime(time)}</div></>;
}

function msToTime(milliseconds, showSeconds) {
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
    if (showSeconds) {
        result += `:${formattedSeconds}`;
    }

    return result;
}

function currentTime(ms, showSeconds) {
    // Create a new Date object
    var currentTime = new Date(ms ? ms : null);

    // Get hours, minutes, and seconds
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();

    // Add leading zero if needed
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    // Format the time as hh:mm:ss
    var formattedTime = hours + ":" + minutes;
    if (showSeconds) {
      formattedTime += ":" + seconds;
    } 

    // Display the result
    return formattedTime;
}

export default Clock;
