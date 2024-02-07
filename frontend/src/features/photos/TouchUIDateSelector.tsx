import TouchUISelectBox from "./TouchUISelectBox";
import TouchUIBooleanField from "./TouchUIBooleanField";
import { useState, useEffect } from "react";
import { getConsecutiveNumbers, getMonthsOfTheYear } from "./../TouchUiMain/calendar/calendarHelpers";

function TouchUIDateSelector({onChange, initialValue}) {
    const now = new Date();

    const initialState = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate(),
        enabled: false,
        ...initialValue,
    };
    const [date, setDate] = useState(initialState);

    // InitialValue is not just initial but gets updated when a remote change comes in.
    useEffect(() => {
        setDate({
            ...date,
            ...initialValue,
        });
    }, [initialValue]);

    const handleSelect = (property, value) => {
        const newDate = { ...date };

        if (property !== "enabled") {
            newDate[property] = parseInt(value);
        } else {
            newDate[property] = value;
        }

        setDate(newDate);
        onChange(newDate);
    };

    function getSelectOptions(values, labels?) {
        if (!labels) {
            labels = values;
        }

        return values.map((value, index) => {
            return { text: labels[index], value };
        });
    }

    const yearOptions = getSelectOptions(getConsecutiveNumbers(1980, now.getFullYear()));
    const monthOptions = getSelectOptions(getConsecutiveNumbers(1, 12), getMonthsOfTheYear());
    const dateOptions = getSelectOptions(getConsecutiveNumbers(1, 31));

    const selectProps = {
        initialValue: null,
        handleSelect,
    };

    function handleSwitchClick(value) {
        handleSelect("enabled", value);
    }

    const switchProps = {
        handleClick: handleSwitchClick,
        classTrueEnabled: "touch-ui-switch-true-enabled",
        classFalseEnabled: "touch-ui-switch-false-enabled",
        initialValue: date.enabled,
    };

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
