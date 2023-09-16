import { formatTimerTime } from '../devices/helpers.ts';

function LiveTimer(props) {

  const { timer, cancelLiveTimer } = props;

  const expiresIn = formatTimerTime(timer.expiresIn);

  return (
    <div className="live-timer">
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