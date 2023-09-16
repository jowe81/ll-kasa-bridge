import LiveTimer from "./LiveTimer";

import './liveTimers.css';

function LiveTimers(props) {

  const liveTimers = props.liveTimers ?? [];

  const liveTimersJsx = liveTimers.map((timer, index) => {
    return <LiveTimer key={index} timer={timer} cancelLiveTimer={props.cancelLiveTimer}/>
  });

  return (
    <div className="timer-panel-item live-timers">
      { liveTimersJsx }
    </div>
  )
}

export default LiveTimers;