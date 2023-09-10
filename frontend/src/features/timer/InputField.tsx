import './inputField.css';


function InputField({value}) {

  return (
    <div className="timer-panel-item input-field">
      {value ?? "_" }
    </div>
  );
}

export default InputField;