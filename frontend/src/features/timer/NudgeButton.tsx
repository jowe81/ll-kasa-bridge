function NudgeButton(props) {

  const { button } = props;

  return (
    <div className="base-button nudge-button">{ button.label }</div>
  )
}

export default NudgeButton;