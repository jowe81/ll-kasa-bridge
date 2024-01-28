import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosAddToCollectionLayer.scss";

function PhotosAddToCollectionLayer({ addToCollection, hideLayer, uiInfo, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const { showKeyboard } = useScreenKeyboard();
    const [collectionName, setCollectionName] = useState("");

    const keyboardConfigTags = {
        fieldLabel: "Collection Name:",
        instructions: "Type the name of the collection to add the picture to.",
        value: collectionName,
        onClose: (value) => setCollectionName(value),
    };

    const collections = libraryInfo?.collections?.map((info) => info.collectionName);

    const collectionItemsJsx = collections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find((info) => info.collectionName === collection);

        if (collectionInfo) {
        }

        return (
            <div key={index} className={`touch-item`} onClick={() => setCollectionName(collection)}>
                {collection[0].toUpperCase() + collection.substring(1)}
                <div className="touch-item-info">{collectionInfo?.count} pictures</div>
            </div>
        );
    });

    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="options-groups-container">
                <div className="header">Add Picture to Collection</div>
                <div className="options-group">
                    <div className="label">Select an existing collection:</div>
                    <div className="touch-items-container">{collectionItemsJsx}</div>
                </div>
                <div className="options-group" onClick={() => showKeyboard(keyboardConfigTags)}>
                    <div className="label">Collection Name (tap to type):</div>
                    <div className="touch-items-container">{collectionName}</div>
                </div>
            </div>
            <div className="actions-container">
                <div className="action" onClick={hideLayer}>
                    Cancel
                </div>
                <div className="action" onClick={() => {
                    addToCollection(collectionName);
                    hideLayer();
                }}>
                    Add Picture
                </div>
            </div>
        </div>
    );
}

export default PhotosAddToCollectionLayer;
