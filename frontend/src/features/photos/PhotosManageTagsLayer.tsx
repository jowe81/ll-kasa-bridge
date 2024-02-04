import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";

function PhotosManageTagsLayer({ addRemoveTag, hideLayer, uiInfo, record, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const { showKeyboard } = useScreenKeyboard();

    const keyboardConfigTags = {
        fieldLabel: "Tag:",
        value: "",
        onClose: (value) => addRemoveTag(value),
    };

    const tags = record?.tags ?? [];        
    let currentTagItemsJsx = tags?.map((tag, index) => {
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

    if (!record.tags.length) {
        currentTagItemsJsx = <div className="touch-item touch-item-placeholder">none assigned</div>;
    }

    const availableTags = libraryInfo?.tags ?? [];
    const availableTagItemsJsx = availableTags.map((tagInfo, index) => {
        const tag = tagInfo.item;
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
            <div className="touch-layer-title">
                <div className="header">Tags on This Picture</div>
            </div>
            <div className="options-groups-container">
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
                    Close
                </div>
            </div>
        </div>
    );
}

export default PhotosManageTagsLayer;
