import TouchUISelectBox from "./TouchUISelectBox";
import TouchUIBooleanField from "./TouchUIBooleanField";
import { useState } from "react";
import { getConsecutiveNumbers, getDatesInMonth, getMonthsOfTheYear } from "./../TouchUiMain/calendar/calendarHelpers";

function TouchUIDateSelector({onChange}) {
    const now = new Date();

    const initialState = {
        year: now.getFullYear(),
        month: now.getMonth()+1,
        date: now.getDate(),
        enabled: false,
    }    
    const [date, setDate] = useState(initialState);

    const handleSelect = (property, value) => {
        const newDate= { ...date };

        if (property !== 'enabled') {
            newDate[property] = parseInt(value);
        } else {
            newDate[property] = value;
        }
        
        setDate(newDate);
        onChange(newDate);
        console.log('new', newDate)
    }

    function getSelectOptions(values, labels?) {
        if (!labels) {
            labels = values;
        }

        return values.map((value, index) => {
            return { text: labels[index], value };
        });
    }    

    const yearOptions = getSelectOptions(getConsecutiveNumbers(1990, now.getFullYear()));
    const monthOptions = getSelectOptions(getConsecutiveNumbers(1, 12), getMonthsOfTheYear());
    const dateOptions = getSelectOptions(getConsecutiveNumbers(1, 31));

    const selectProps = {
        initialValue: null,
        handleSelect,        
    }

    function handleSwitchClick(value) {        
        handleSelect('enabled', value)
    }

    const switchProps = {
        handleClick: handleSwitchClick,
        classTrueEnabled: 'touch-ui-switch-true-enabled',
        classFalseEnabled: 'touch-ui-switch-false-enabled',
    }

    let dateSelectorClassName = "touch-ui-date-selector-container";
    if (!date.enabled) {
        dateSelectorClassName += " touch-ui-section-disabled";
    }

    return (
        <div className="touch-ui-date-selector-outer-container">
            <div className={dateSelectorClassName}>
                <TouchUISelectBox
                    {...selectProps}
                    initialValue={date.year}
                    propName="year"
                    placeholder="Year"
                    options={yearOptions}
                />
                <TouchUISelectBox
                    {...selectProps}
                    initialValue={date.month}
                    propName="month"
                    placeholder="Month"
                    options={monthOptions}
                />
                <TouchUISelectBox
                    {...selectProps}
                    initialValue={date.date}
                    propName="date"
                    placeholder="Day"
                    options={dateOptions}
                />
            </div>
            <div style={{ marginLeft: "25px", marginTop: "5px" }}>
                <TouchUIBooleanField {...switchProps} />
            </div>
        </div>
    );
}

export default TouchUIDateSelector;
