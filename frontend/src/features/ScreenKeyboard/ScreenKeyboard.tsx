import { FunctionComponent, useRef, ChangeEvent, useEffect } from "react";
import KeyboardWrapper from "./KeyboardWrapper";
import "./screenKeyboard.css";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";

const ScreenKeyboard: FunctionComponent = () => {
    const { closeKeyboard, inputValue, keyboardConfig, setInputValue } = useScreenKeyboard();

    const keyboard = useRef<any>(null);

    useEffect(() => {
        setInputValue(keyboardConfig.value);
    }, []);

    // Manual change (typing with the regular keyboard)
    const onChangeInput = (event: ChangeEvent<HTMLInputElement>): void => {                        
        const value = event.target.value;
        setInputValue(value);
        keyboard.current?.setInput(value);
    };
    
    // Clear button
    const handleClear = () => {
        setInputValue("");
        keyboard.current?.setInput("");
    }

    return (
        <div className="keyboard-layer">
            <div className="keyboard-header">
                <div className="keyboard-text-container">
                    <div className="keyboard-button" onClick={() => closeKeyboard(true)}>Save</div>
                    <div className="keyboard-button" onClick={() => closeKeyboard(false)}>Cancel</div>                    
                    <div className="keyboard-button" onClick={handleClear}>Clear</div>
                    <div className="keyboard-field-label">{keyboardConfig.fieldLabel}</div>
                    <div className="keyboard-instructions">{keyboardConfig.instructions}</div>
                </div>
                <input
                    value={inputValue}
                    placeholder={"Tap on the virtual keyboard to start"}
                    onChange={(e) => onChangeInput(e)}
                />
            </div>
            <KeyboardWrapper keyboardRef={keyboard} onChange={setInputValue} />
        </div>
    );
};

export default ScreenKeyboard;
