function NumPadButton(props) {

  const { button, onButtonPress } = props;

  return (
    <div className="base-button num-pad-button" onClick={onButtonPress} data-value={button.value ?? button.label}>{ button.label }</div>
  )
}

export default NumPadButton;