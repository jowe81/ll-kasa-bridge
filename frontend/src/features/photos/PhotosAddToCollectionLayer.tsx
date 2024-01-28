import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosAddToCollectionLayer.scss";

function PhotosAddToCollectionLayer({ addToRemoveFromCollection, hideLayer, uiInfo, record, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const { showKeyboard } = useScreenKeyboard();
    const [collectionName, setCollectionName] = useState("");

    const keyboardConfigTags = {
        fieldLabel: "Collection Name:",
        instructions: "Type the name of the collection to add the picture to.",
        value: '',
        onClose: (value) => setCollectionName(value),
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

        if (collectionInfo) {
        }

        return (
            <div
                key={index}
                className={`touch-item ${record.collections.includes(collection) ? "touch-item-selected" : ""}`}
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
                    <div className="label">Add the picture to a new collection (tap to type a collection name):</div>
                    <div className="touch-items-container">{collectionName}</div>
                </div>
            </div>
            <div className="actions-container">
                <div className="action" onClick={hideLayer}>
                    Cancel
                </div>
                <div className="action" onClick={() => {
                    addToRemoveFromCollection(collectionName);
                    hideLayer();
                }}>
                    {collectionName ? `Add to "${collectionName}"` : `Close` }
                </div>
            </div>
        </div>
    );
}

export default PhotosAddToCollectionLayer;
