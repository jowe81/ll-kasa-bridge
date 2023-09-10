import NudgeButton from "./NudgeButton";
import './nudgePanel.css';

function NudgePanel(props) {

  const nudgeButtons = [
    { label: '<<' },
    { label: '<' },
    { label: '>' },
    { label: '>>' },
  ];

  const nudgeButtonsJsx = nudgeButtons.map((button, index) => <NudgeButton key={index} button={button} />);

  return (
    <div className="timer-panel-item nudge-panel">{ nudgeButtonsJsx }</div>
  )
}

export default NudgePanel;