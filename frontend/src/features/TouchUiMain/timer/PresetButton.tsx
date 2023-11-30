function PresetButton(props) {

  const { button } = props;


  let labelText = button.subLabel ? button.label : '';
  let subLabelText = button.subLabel ?? button.id;

  return (
      <div
          className="base-button preset-button"
          data-id={button.id}
          onClick={button.onClick}
      >
          <div className="preset-button-label">{labelText}</div>
          <div className="preset-button-sub-label">{subLabelText}</div>
      </div>
  );
}

export default PresetButton;