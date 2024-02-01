import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosManageCollectionsLayer.scss";

function PhotosManageCollectionsLayer({ addToRemoveFromCollection, hideLayer, uiInfo, record, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const { showKeyboard } = useScreenKeyboard();

    const keyboardConfigTags = {
        fieldLabel: "Collection Name:",
        instructions: "Type the name of the collection to add the picture to.",
        value: "",
        onClose: (value) => addToRemoveFromCollection(value),
    };

    const allCollections = libraryInfo?.collections?.map((info) => info.collectionName).sort();
    const defaultCollections = allCollections
        .filter((collectionName) => ["unsorted", "trashed", "favorites"].includes(collectionName))
        .sort((a, b) => (a > b ? -1 : 1));

    const customCollections = allCollections
        .filter((collectionName) => !["unsorted", "trashed", "favorites"].includes(collectionName))
        .sort();

    const collections = [...defaultCollections, ...customCollections];
    
    const collectionItemsJsx = collections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find((info) => info.collectionName === collection);

        let className = "touch-item";

        if ((collection === "unsorted" && !record.collections.length) || record.collections?.includes(collection)) {
            className += " touch-item-selected";
        } 

        return (
            <div
                key={index}
                className={className}
                onClick={() => addToRemoveFromCollection(collection)}
            >
                {collection[0].toUpperCase() + collection.substring(1)}
                <div className="touch-item-info">
                    {collectionInfo?.count} picture{collectionInfo?.count === 1 ? `` : `s`}
                </div>
            </div>
        );
    });

    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="options-groups-container">
                <div className="header">Collections this picture belongs to</div>
                <div className="options-group">
                    <div className="label">Tap a collection to add to/remove the picture from:</div>
                    <div className="touch-items-container">{collectionItemsJsx}</div>
                </div>
                <div className="options-group" onClick={() => showKeyboard(keyboardConfigTags)}>
                    <div className="action" style={{ maxWidth: "400px" }}>
                        Use Different Collection
                    </div>
                </div>
            </div>
            <div className="actions-container">
                <div className="action" onClick={hideLayer}>
                    Cancel
                </div>
                <div
                    className="action"
                    onClick={() => {
                        hideLayer();
                    }}
                >
                    Close
                </div>
            </div>
        </div>
    );
}

export default PhotosManageCollectionsLayer;
