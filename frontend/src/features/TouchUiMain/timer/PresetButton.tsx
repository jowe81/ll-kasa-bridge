function PresetButton(props) {

  const { button } = props;


  let topLabelText = button.topLabel ?? button.id;
  let subLabelText = button.subLabel;

  const classNames = `base-button ${button.id === '__custom' ? 'preset-button-custom' : 'preset-button' }`;

  return (
      <div
          className={classNames}
          data-id={button.id}
          onClick={button.onClick}
      >
          <div className="preset-button-label">{topLabelText}</div>
          <div className="preset-button-sub-label">{subLabelText}</div>
      </div>
  );
}

export default PresetButton;