import { useState } from "react";

interface Option {
    text: string;
    value?: string|number;
}

function TouchUISelectBox({
    initialValue,
    handleSelect,
    propName = '',
    options = [],
    placeholder = '-- Select --',
}) {
    const [value, setValue] = useState(initialValue ?? placeholder);

    const onChange = (event) => {
        const value = event.target.value;
        const property = event.target.dataset.name;
        console.log(`Got ${value} for ${property}`);
        setValue(value);
        handleSelect(property, value);
    };

    return (
        <div className="touch-select-field-container">
            <select className="" onChange={onChange} value={value} data-name={propName}>
                <option>{placeholder}</option>
                {options.map((option, index) => <option key={index} value={option.value}>{option.text}</option>)}
            </select>
        </div>
    );
}

export default TouchUISelectBox;
