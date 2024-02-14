import {
    getCollectionLabelsForRecord,
    getCustomCollectionLabels,
    getCustomCollectionsJsx,
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

    const collectionItemsJsx = getCustomCollectionsJsx(
        photosService,
        record?.collections,
        addToRemoveFromCollectionWrapper,
    );

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
