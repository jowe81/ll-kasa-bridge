import { FunctionComponent, useRef, ChangeEvent } from "react";
import KeyboardWrapper from "./KeyboardWrapper";
import "./screenKeyboard.css";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";

const ScreenKeyboard: FunctionComponent = (props: any) => {
    const { hideKeyboard, inputValue, setInputValue } = useScreenKeyboard();

    const keyboard = useRef<any>(null);

    const { fieldLabel, instructions } = props;

    // Manual change (typing with the regular keyboard)
    const onChangeInput = (event: ChangeEvent<HTMLInputElement>): void => {                        
        const value = event.target.value;
        setInputValue(value);
        keyboard.current?.setInput(value);
    };

    return (
        <div className="keyboard-layer">
            <div className="keyboard-header">
                <div className="keyboard-text-container">
                    <div className="keyboard-close-button" onClick={hideKeyboard}>Close</div>
                    <div className="keyboard-clear-button" onClick={() => setInputValue && setInputValue("")}>Clear</div>
                    <div className="keyboard-field-label">{fieldLabel}</div>
                    <div className="keyboard-instructions">{instructions}</div>
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
