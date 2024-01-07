function PresetButton(props) {

  const { button } = props;

  if (!button.topLabel) {
    button.topLabel = button.id;
  }

  let topLabelText = button.topLabel;
  let subLabelText = button.subLabel;

  if (!subLabelText) {
    subLabelText = topLabelText;
    topLabelText = null;
  }

  const classNamesButton = `base-button ${button.id === '__custom' ? 'preset-button-custom' : 'preset-button' }`;
  const classNameSubLabel = (!button.subLabel || button.subLabel === button.id) ? `preset-button-sub-label-muted` : `preset-button-sub-label`;

  return (
      <div
          className={classNamesButton}
          data-id={button.id}
          onClick={button.onClick}
      >
          <div className="preset-button-label">{topLabelText}</div>
          <div className="preset-button-sub-label">{subLabelText}</div>
      </div>
  );
}

export default PresetButton;