function PresetButton(props) {

  const { button } = props;

  return (
    <div className="base-button preset-button">{ button.label }</div>
  )
}

export default PresetButton;