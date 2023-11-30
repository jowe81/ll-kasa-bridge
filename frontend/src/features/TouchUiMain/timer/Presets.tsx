import PresetButton from "./PresetButton";
import './presets.css';

function Presets(props) {

  const timers = { ...props.configuredTimers } ?? {};

  const presetButtons: any = [];

  Object.keys(timers).forEach(key => {
    presetButtons.push(timers[key]);
  })

  // Put this as the last button
  presetButtons.push({ 
    label: 'Custom', 
    subLabel: '?',
    onClick: props.onCustomClick
  });

  const presetButtonsJsx = presetButtons.map((button, index) => {
   return <PresetButton key={index} onClick={props.onClick} button={button} />
  });

  return (
    <div className="timer-panel-item presets">{ presetButtonsJsx }</div>
  )
}

export default Presets;