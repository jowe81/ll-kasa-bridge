function LiveTimer(props) {

  const { timer } = props;

  return (
    <div className="base-button live-timer">{ timer.label }</div>
  )
}

export default LiveTimer;