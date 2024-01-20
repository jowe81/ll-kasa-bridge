import { useState, MutableRefObject, FunctionComponent } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

interface IProps {
    onChange: (input: string) => void;
    keyboardRef: MutableRefObject<Keyboard>;
}

const KeyboardWrapper: FunctionComponent<IProps> = function ({ onChange, keyboardRef }) {
    const [layoutName, setLayoutName] = useState("default");
    const onKeyPress = (button) => {
        console.log("Button pressed", button);
        if (button === "{shift}" || button === "{lock}") {
            setLayoutName(layoutName === "default" ? "shift" : "default");
        }
    };

    return (
        <Keyboard
            keyboardRef={(r) => {
                if (!keyboardRef) {
                    return;
                }
                return (keyboardRef.current = r);
            }}
            layoutName={layoutName}
            onChange={onChange}
            onKeyPress={onKeyPress}
            onRender={() => console.log("Rendered keyboard")}
        />
    );
};

export default KeyboardWrapper;