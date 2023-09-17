function PresetButton(props) {

  const { button } = props;

  return (
    <div 
      className="base-button preset-button"
      data-id={button.id} 
      onClick={button.onClick}
    >
      <div className="preset-button-label">{ button.label }</div>
      <div className="preset-button-sub-label">{ button.subLabel }</div>
    </div>
  )
}

export default PresetButton;