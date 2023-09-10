function PresetButton(props) {

  const { button } = props;
  console.log('button: ', button)
  return (
    <div className="base-button preset-button" onClick={button.onClick}>{ button.label }</div>
  )
}

export default PresetButton;