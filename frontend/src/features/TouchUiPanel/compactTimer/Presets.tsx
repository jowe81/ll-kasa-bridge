import PresetButton from "./PresetButton";
import './presets.css';

function Presets(props) {

  const timers = { ...props.configuredTimers } ?? {};

  const maxPresets = 8;
  const presetButtons: any = [];

  Object.keys(timers).every((key, index) => {
    if (index > maxPresets - 1) {
      return false;
    }
    
    presetButtons.push(timers[key]);
    return true;
  })


  const presetButtonsJsx = presetButtons.map((button, index) => {
   return <PresetButton key={index} onClick={props.onClick} button={button} />
  });

  return (
    <div className="compact-timer-presets">{ presetButtonsJsx }</div>
  )
}

export default Presets;