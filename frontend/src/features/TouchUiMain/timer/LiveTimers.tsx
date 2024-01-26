import LiveTimer from "./LiveTimer";

import './liveTimers.css';

function LiveTimers(props) {  
  const liveTimers = props.liveTimers ?? [];

  const liveTimersJsx = liveTimers.map((timer, index) => {
    return <LiveTimer key={index} timer={timer} {...props}/>
  });

  let classes = `timer-panel-item live-timers ${liveTimers.length ? '' : 'timer-panel-bg'}`;
  return <div className={classes}>{liveTimersJsx}</div>;
}

export default LiveTimers;