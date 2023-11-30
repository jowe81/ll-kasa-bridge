import './inputField.css';


function InputField({displayValue, onButtonPress, currentValue}) {

  return (
    <div className="timer-panel-item input-field">
      <div className="action-buttons">
        <div className="base-button input-field-button" data-value="_close" onClick={onButtonPress}>Cancel</div>
        <div className="base-button input-field-button" data-value="_clear" onClick={onButtonPress}>Clear</div>
      </div>
      <div className="input-field-display">{displayValue}</div>      
    </div>
  );
}

export default InputField;