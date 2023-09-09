function NumPadButton(props) {

  const { button } = props;

  return (
    <div className="base-button num-pad-button">{ button.label }</div>
  )
}

export default NumPadButton;