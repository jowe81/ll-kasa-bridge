import './clock.css';

import { formatClockTime } from '../devices/helpers.ts';

function Clock({clockTime}) {
  let formattedClockTime;

  if (clockTime) {
    formattedClockTime = clockTime;
  } else {
    console.warn('Timer: No clock time from server; falling back to local time.');
    formattedClockTime = formatClockTime(Date.now());
  }
  

  return <div className="timer-panel-item"><div className="clock">{formattedClockTime}</div></div>;
}

export default Clock;