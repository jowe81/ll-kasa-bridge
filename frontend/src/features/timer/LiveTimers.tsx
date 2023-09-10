import LiveTimer from "./LiveTimer";

import './liveTimers.css';

function LiveTimers(props) {

  const liveTimers = [
    { label:'0:03:00' },
    // { label:'0:04:23' },
    // { label:'0:06:27' },
  ]

  const liveTimersJsx = liveTimers.map((timer, index) => <LiveTimer key={index} timer={timer}/>);

  return (
    <div className="timer-panel-item live-timers">
      { liveTimersJsx }
    </div>
  )
}

export default LiveTimers;