import PresetButton from "./PresetButton";
import './presets.css';

function Presets(props) {

  const presetButtons = [
    { label: 'Custom', onClick: props.onCustomClick },
    { label: '1m' },
    { label: '3m' },
    { label: '4m' },
    { label: '6m30' },
    { label: '10m' },
  ];

  const presetButtonsJsx = presetButtons.map((button, index) => <PresetButton key={index} button={button} />);

  return (
    <div className="timer-panel-item presets">{ presetButtonsJsx }</div>
  )
}

export default Presets;