import LiveTimer from "./LiveTimer";

function CurrentTimers(props) {

  const liveTimers = [
    { label:'0:03:00' },
    { label:'0:04:23' },
    { label:'0:06:27' },
  ]

  const liveTimersJsx = liveTimers.map(timer => <LiveTimer timer={timer}/>);

  return (
    <div className="timer-panel-item current-timers">
      { liveTimersJsx }
    </div>
  )
}

export default CurrentTimers;