import './clock.css';

import { useState, useEffect } from "react";

function Clock(props: any) {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    setInterval(() => {
      setTime(Date.now())      
    }, 1000);
  }, []);

    
  return <><div className="fullscreen-panel-clock">{currentTime(time, false)}</div></>;
}

function currentTime(ms, showSeconds = false) {
    // Create a new Date object
    var currentTime = new Date(ms ? ms : null);

    // Get hours, minutes, and seconds
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();

    // Add leading zero if needed
    const h = hours < 10 ? "0" + hours : hours;
    const m = minutes < 10 ? "0" + minutes : minutes;
    const s = seconds < 10 ? "0" + seconds : seconds;

    // Format the time as hh:mm:ss
    var formattedTime = h + ":" + m;
    if (showSeconds) {
        formattedTime += ":" + s;
    }

    // Display the result
    return formattedTime;
}

export default Clock;
