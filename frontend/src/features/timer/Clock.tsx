import './clock.css';

import { formatClockTime } from '../devices/helpers.ts';

function Clock({clockTime}) {

  return <div className="timer-panel-item"><div className="clock">{formatClockTime(clockTime)}</div></div>;
}

export default Clock;