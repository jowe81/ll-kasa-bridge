function PresetButton(props) {

  const { button } = props;


  let topLabelText = button.topLabel ?? button.id;
  let subLabelText = button.subLabel;

  return (
      <div
          className="compact-base-button compact-preset-button"
          data-id={button.id}
          onClick={button.onClick}
      >
          <div className="compact-timer-preset-button-label">{topLabelText}</div>
          <div className="compact-timer-preset-button-sub-label">
              {subLabelText}
          </div>
      </div>
  );
}

export default PresetButton;