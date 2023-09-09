import NudgeButton from "./NudgeButton";
import './nudgePanel.css';

function NudgePanel(props) {

  const nudgeButtons = [
    { label: '<<' },
    { label: '<' },
    { label: '>' },
    { label: '>>' },
  ];

  const nudgeButtonsJsx = nudgeButtons.map(btn => <NudgeButton button={btn} />);

  return (
    <div className="timer-panel-item nudge-panel">{ nudgeButtonsJsx }</div>
  )
}

export default NudgePanel;