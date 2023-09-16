import { getHumanReadableLength } from '../devices/helpers.ts';


function NudgeButton(props) {

  const { button } = props;

  let label;
  let step;

  const nudge = button.liveTimer?.nudge;
  
  if (nudge) {
    // How many milliseconds to nudge?
    step = (button.fast ? nudge.fast : nudge.slow);
    label = `${button.up ? `+` : `-`} ${getHumanReadableLength(step)}`;

    if (!button.up) {
      step = step * -1;
    }
  }

  return (
    <div 
      className="base-button nudge-button" 
      data-up={button.up}
      data-fast={button.fast}
      data-step={step}
      onClick={button.nudgeTimer}
    >
      { label ?? button.label} 
    </div>
  )
}

export default NudgeButton;