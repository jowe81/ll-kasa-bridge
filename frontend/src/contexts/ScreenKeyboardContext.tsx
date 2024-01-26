import React, { useState, createContext, useContext } from "react";

interface ScreenKeyboardContextValue {
    isKeyboardVisible?: boolean;
    showKeyboard: (config?: any) => void;
    closeKeyboard: (submit) => void;
    keyboardConfig: any;
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

const ScreenKeyboardContext = createContext<ScreenKeyboardContextValue>({});


export const useScreenKeyboard = () => {
    const context = useContext(ScreenKeyboardContext);
    if (!context) {
        throw new Error("useScreenKeyboard must be used within a ScreenKeyboardProvider");
    }
    return context;
};

export const ScreenKeyboardProvider = ({ children }) => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardConfig, setKeyboardConfig] = useState({});
    const [inputValue, setInputValue] = useState("");

    const showKeyboard = (config?: any) => {
        setKeyboardConfig(config);
        setInputValue(config.value ?? "");
        setKeyboardVisible(true);
    };

    const closeKeyboard = (submit: boolean) => {
        setKeyboardVisible(false);
        if (submit && keyboardConfig.onClose) {
            keyboardConfig.onClose(inputValue);
        }
        setKeyboardConfig({});
    };

    return (
        <ScreenKeyboardContext.Provider
            value={{ isKeyboardVisible, showKeyboard, closeKeyboard, keyboardConfig, inputValue, setInputValue }}
        >
            {children}
        </ScreenKeyboardContext.Provider>
    );
};
