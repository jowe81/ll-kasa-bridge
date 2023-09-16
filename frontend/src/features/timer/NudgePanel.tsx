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

  const nudgeButtonsJsx = nudgeButtons.map((button, index) => <NudgeButton key={index} button={button} />);

  return (
    <div className="timer-panel-item nudge-panel">{ nudgeButtonsJsx }</div>
  )
}

export default NudgePanel;