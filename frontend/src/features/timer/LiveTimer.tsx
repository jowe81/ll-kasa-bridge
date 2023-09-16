import { formatTimerTime } from '../devices/helpers.ts';

function LiveTimer(props) {

  const { timer, cancelLiveTimer, selectTimer } = props;

  const expiresIn = formatTimerTime(timer.expiresIn + 1000); //Add a second
  const className = `live-timer ${props.selectedTimer == timer.liveId ? `selected-timer` : ``}`;

  return (
    <div className={className} onClick={selectTimer} data-id={timer.liveId} data-selected={props.selectedTimer}>
      <div className="live-timer-display">
        { expiresIn }
      </div>
      <div 
        className="live-timer-cancel-button" 
        data-id={timer.id} 
        data-live-id={timer.liveId}
        onClick={cancelLiveTimer}
      >
        Cancel
      </div>
    </div>

  )
}

export default LiveTimer;