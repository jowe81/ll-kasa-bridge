import NudgeButton from "./NudgeButton";
import './nudgePanel.css';

function NudgePanel(props) {

  const {nudgeTimer, liveTimers, selectedTimer} = props;

  const liveTimer = liveTimers?.find(timer => timer.liveId == selectedTimer);

  const nudgeButtons = [
    { 
      nudgeTimer,
      liveTimer,
      label: '--', 
      up: false, 
      fast: true, 
    },
    { 
      nudgeTimer,
      liveTimer,
      label: '-',
      up: false,
      fast: false,
    },
    { 
      nudgeTimer,
      liveTimer,
      label: '+',
      up: true,
      fast: false,
    },
    { 
      nudgeTimer,
      liveTimer,
      label: '++',
      up: true,
      fast: true,
    },
  ];

  let contentJsx;

  if (liveTimers?.length) {
    const nudgeButtonsJsx = nudgeButtons.map((button, index) => <NudgeButton key={index} button={button} />);
    contentJsx = nudgeButtonsJsx;
  } else {
    contentJsx = <div className="timer-main-label">Jess's Kitchen Timers</div>
  }



  return (
    <div className="timer-panel-item nudge-panel">{contentJsx}</div>
  )
}

export default NudgePanel;