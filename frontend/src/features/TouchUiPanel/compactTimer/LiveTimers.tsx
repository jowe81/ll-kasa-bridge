import LiveTimer from "./LiveTimer";

import './liveTimers.css';

function LiveTimers(props) {  
  const liveTimers = props.liveTimers ?? [];

  const liveTimersJsx = liveTimers.map((timer, index) => {
    return <LiveTimer key={index} timer={timer} {...props}/>
  });

  return (
    <div className="compact-live-timers">
      { liveTimersJsx }
    </div>
  )
}

export default LiveTimers;