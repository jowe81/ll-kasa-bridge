import { useState, useEffect } from 'react'

function TouchUIBooleanField({initialValue, handleClick, labelTrue='ON', labelFalse = 'OFF', valueTrue = true, valueFalse = false, classTrueEnabled = '', classFalseEnabled = ''}) {
    const [value, setValue] = useState(initialValue ?? valueFalse);

    // InitialValue is not just initial but gets updated when a remote change comes in.
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const onClick = (value) => {
        setValue(value);
        handleClick(value);
    };

    return (
        <div className="touch-boolean-field-container">
            <div
                className={`switch-left ${
                    value === valueTrue ? `switch-active ${classTrueEnabled}` : `switch-inactive`
                }`}
                onClick={() => onClick(valueTrue)}
            >
                {labelTrue}
            </div>
            <div
                className={`switch-right ${
                    value === valueTrue ? `switch-inactive` : `switch-active ${classFalseEnabled}`
                }`}
                onClick={() => onClick(valueFalse)}
            >
                {labelFalse}
            </div>
        </div>
    );
}

export default TouchUIBooleanField