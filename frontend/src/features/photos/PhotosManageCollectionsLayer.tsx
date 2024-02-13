import {
    getCollectionLabelsForRecord,
    getCustomCollectionLabels,
    getDefaultCollectionsJsx,
    getLibraryInfo,
} from "./photosHelpers.tsx";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosManageCollectionsLayer.scss";

function PhotosManageCollectionsLayer({
    addToRemoveFromCollection,
    hideLayer,
    hideLayers,
    record,
    photosService,
}) {
    const libraryInfo = getLibraryInfo(photosService);
    const customCollections = getCustomCollectionLabels(photosService);

    const isUnsorted = !record?.collections?.length;

    const { showKeyboard } = useScreenKeyboard();

    const addToRemoveFromCollectionWrapper = (collectionName) => {
        // If the record was previously unsorted, the backend will advance to the next picture; so hide this layer.
        if (isUnsorted) {
            hideLayers();
        }
        addToRemoveFromCollection(collectionName);
    };

    const keyboardConfigTags = {
        fieldLabel: "Collection Name:",
        instructions: "Type the name of the collection to add the picture to.",
        value: "",
        onClose: (value) => addToRemoveFromCollectionWrapper(value),
    };


    const defaultCollectionsJsx = getDefaultCollectionsJsx(
        photosService,
        record?.collections,
        addToRemoveFromCollectionWrapper,
        false,
    );

    const collectionItemsJsx = customCollections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find((info) => info.item === collection);

        let className = "touch-item";

        if ((collection === "unsorted" && !record?.collections.length) || record?.collections?.includes(collection)) {
            className += " touch-item-selected";
        }

        return (
            <div key={index} className={className} onClick={() => addToRemoveFromCollectionWrapper(collection)}>
                {collection[0].toUpperCase() + collection.substring(1)}
                <div className="touch-item-info">
                    {collectionInfo?.count} picture{collectionInfo?.count === 1 ? `` : `s`}
                </div>
            </div>
        );
    });


    const currentLabels = getCollectionLabelsForRecord(photosService);

    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="touch-layer-title">
                <div className="header">Collections Containing This Picture</div>
            </div>

            <div className="options-groups-container">
                <div className="options-group">
                    <div className="label">Currently Selected Collections:</div>
                    <div className="italic">
                        {currentLabels.length ? <div className="emphasize">{currentLabels.join(", ")}</div> : <div className="mute">(none)</div>}
                    </div>                                        
                </div>
                <div className="options-group">
                    <div className="label">Tap on any collection to add to/remove the picture from it:</div>
                    <div className="touch-items-container">{defaultCollectionsJsx}</div>
                    <div className="touch-items-container">{collectionItemsJsx}</div>
                </div>
                <div className="options-group" onClick={() => showKeyboard(keyboardConfigTags)}>
                    <div className="action" style={{ maxWidth: "400px" }}>
                        Add to a New Collection
                    </div>
                </div>
            </div>
            <div className="actions-container">
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
