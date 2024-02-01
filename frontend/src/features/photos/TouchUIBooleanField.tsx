import { useState } from 'react'

function TouchUIBooleanField({initialValue, handleClick, labelTrue, labelFalse, styleTrue, styleFalse, valueTrue = true, valueFalse = false}) {
    const [value, setValue] = useState(initialValue ?? valueFalse);

    const onClick = (value) => {
        setValue(value);
        handleClick(value);
    }

    return (
        <div className="touch-boolean-field-container">
            <div
                className={`switch-left ${value === valueTrue ? `switch-active` : `switch-inactive`}`}
                style={styleTrue}
                onClick={() => onClick(valueTrue)}
            >
                {labelTrue ?? "ON"}
            </div>
            <div
                className={`switch-right ${value === valueTrue ? `switch-inactive` : `switch-active`}`}
                style={styleFalse}
                onClick={() => onClick(valueFalse)}
            >
                {labelFalse ?? "OFF"}
            </div>
        </div>
    );
}

export default TouchUIBooleanField