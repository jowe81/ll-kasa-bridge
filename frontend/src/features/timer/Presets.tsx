import PresetButton from "./PresetButton";

function Presets(props) {
  const presetButtons = [
    { label: '1m' },
    { label: '3m' },
    { label: '4m' },
    { label: '6m30' },
    { label: '10m' },
  ];

  const presetButtonsJsx = presetButtons.map(button => <PresetButton button={button} />);

  return (
    <div className="timer-panel-item presets">{ presetButtonsJsx }</div>
  )
}

export default Presets;