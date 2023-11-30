import { formatTimerTime, formatClockTime } from '../../TouchUiMain/devices/helpers.ts';
import constants from '../../../constants.ts';

function LiveTimer(props) {

  const { timer, cancelLiveTimer, selectTimer } = props;

  const expiresIn = formatTimerTime(timer.expiresIn + 0); //Add a second
  const className = `compact-live-timer`;

  let colorClass = "compact-live-timer-normal";

  if (timer.expiresIn < 0) {
    colorClass = "compact-live-timer-expired";
  } else if (timer.expiresIn < 30 * constants.SECOND) {
    colorClass = "compact-live-timer-closer";
  } else if (timer.expiresIn < constants.MINUTE) {
    colorClass = "compact-live-timer-close";
  }

  const displayClassNames = `compact-live-timer-display ${colorClass}`;
  const subLabelClassNames = `compact-sub-label-container ${colorClass}`;

  const subLabelJsx = timer.subLabel ?
    <span>{timer.subLabel}, ready { timer.expiresIn >= 0 ? `at ${formatClockTime(timer.expires)}` : `now!` }</span> :
    <span>{timer.expiresIn >= 0 ? 
      `${timer.id ? `${timer.id}, expires` : `Custom, expires`} ${formatClockTime(timer.expires)}` :
      timer.id ? `${timer.id} expired!` : `Custom timer expired!` }
    </span>;


  return (
      <div
          className={className}
          onClick={cancelLiveTimer}
          data-id={timer.liveId}
          data-live-id={timer.liveId}
          data-selected={props.selectedTimer}
      >
          <div>
              <div className={subLabelClassNames}>{subLabelJsx}</div>
              <div className={displayClassNames}>{expiresIn}</div>
          </div>
      </div>
  );
}

export default LiveTimer;