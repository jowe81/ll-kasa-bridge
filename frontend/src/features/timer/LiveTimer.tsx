import { formatTimerTime } from '../devices/helpers.ts';
import constants from '../../constants.ts';

function LiveTimer(props) {

  const { timer, cancelLiveTimer, selectTimer } = props;

  const expiresIn = formatTimerTime(timer.expiresIn + 0); //Add a second
  const className = `live-timer ${props.selectedTimer == timer.liveId ? `selected-timer` : ``}`;

  let colorClass = 'live-timer-normal';

  if (timer.expiresIn < 0) {
    colorClass = 'live-timer-expired';
  } else if (timer.expiresIn < 30 * constants.SECOND) {
    colorClass = 'live-timer-closer';
  } else if (timer.expiresIn < constants.MINUTE) {
    colorClass = 'live-timer-close';
  }

  const displayClassNames = `live-timer-display ${colorClass}`;

  return (
    <div className={className} onClick={selectTimer} data-id={timer.liveId} data-selected={props.selectedTimer}>
      <div className={displayClassNames}>
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