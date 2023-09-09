import NumPadButton from "./NumPadButton";
import './numPad.css';

function NumPad(props) {

  const numPadButtons = [
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '4' },
    { label: '5' },
    { label: '6' },
    { label: '7' },
    { label: '8' },
    { label: '9' },
    { label: 'X' },
    { label: '0' },
    { label: 'Set' },
  ];

  const numPadButtonsJsx = numPadButtons.map(button => <NumPadButton button={button} />);

  return (
    <div className="timer-panel-item num-pad">{ numPadButtonsJsx }</div>
  )
}

export default NumPad;