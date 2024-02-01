import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";

function PhotosManageTagsLayer({ addRemoveTag, hideLayer, uiInfo, record, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;
    const recordInfo = photosService?.state?.api?.recordInfo;

    const { showKeyboard } = useScreenKeyboard();
    const [tagName, setTagName] = useState("");

    const keyboardConfigTags = {
        fieldLabel: "Tag:",        
        value: "",
        onClose: (value) => addRemoveTag(value),
    };

    const tags = record?.tags ?? [];        
    const currentTagItemsJsx = tags?.map((tag, index) => {
        return (
            <div
                key={index}
                className={`touch-item ${record.tags.includes(tag) ? "touch-item-selected" : ""}`}
                onClick={() => addRemoveTag(tag)}
            >
                {tag[0].toUpperCase() + tag.substring(1)}
            </div>
        );
    });

    const availableTags = recordInfo?.availableTags ?? [];
    const availableTagItemsJsx = availableTags.map((tag, index) => {
        return (
            <div
                key={index}
                className={`touch-item ${record.tags.includes(tag) ? "touch-item-selected" : ""}`}
                onClick={() => addRemoveTag(tag)}
            >
                {tag[0].toUpperCase() + tag.substring(1)}
            </div>
        );
    });

    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="options-groups-container">
                <div className="header">Tags on this picture</div>
                <div className="options-group">
                    <div className="label">Tap to remove a tag from the picture:</div>
                    <div className="touch-items-container">{currentTagItemsJsx}</div>
                </div>
                <div className="options-group">
                    <div className="label">Tap to add a tag to the picture:</div>
                    <div className="touch-items-container">{availableTagItemsJsx}</div>
                </div>
                <div className="options-group" onClick={() => showKeyboard(keyboardConfigTags)}>
                    <div className="action" style={{ maxWidth: "300px" }}>
                        Add a Different Tag
                    </div>
                </div>
            </div>
            <div className="actions-container">
                <div className="action" onClick={hideLayer}>
                    Cancel
                </div>
                <div className="action" onClick={hideLayer}>
                    Close
                </div>
            </div>
        </div>
    );
}

export default PhotosManageTagsLayer;
