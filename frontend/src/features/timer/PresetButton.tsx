function PresetButton(props) {

  const { button } = props;
  return (
    <div className="base-button preset-button" data-id={button.id} onClick={button.onClick}>{ button.label }</div>
  )
}

export default PresetButton;