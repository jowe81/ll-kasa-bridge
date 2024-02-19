import {
    getCollectionLabelsForRecord,
    getCustomCollectionsJsx,
    getDefaultCollectionsJsx,
    getLatestOps,
    getLibraryInfo,
} from "./photosHelpers.tsx";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosManageCollectionsLayer.scss";

function PhotosManageCollectionsLayer({
    applyToAllPicturesInSelectedFolders,
    addToRemoveFromCollection,
    hideLayer,
    hideLayers,
    record,
    photosService,
}) {
    const libraryInfo = getLibraryInfo(photosService);
    const latestOps = getLatestOps(photosService);

    let dirnameFilter;

    const lastUsedFilter = latestOps?.lastUsedFilter;
    if (lastUsedFilter) {
        dirnameFilter = lastUsedFilter.$and?.find(filterItem => filterItem.dirname);
    }

    const isUnsorted = !record?.collections?.length;

    const { showKeyboard } = useScreenKeyboard();

    const addToRemoveFromCollectionWrapper = (collectionName) => {
        console.log(`Unsorted`, isUnsorted, `dirnamefilter`, dirnameFilter)
        if (isUnsorted && !dirnameFilter) { 
            // Record was previously unsorted, request the backend to advance to the next picture; hide this layer.
            addToRemoveFromCollection(collectionName, true);
            hideLayers();
        } else {
            console.log('%%%%%%%%%%%%%%%%%');
            // Either it wasn't unsorted or the filter is on a folder; in which case we also do not advance.
            addToRemoveFromCollection(collectionName, false);
        }        
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
                {dirnameFilter &&
                    <div className="action" onClick={() => {
                        applyToAllPicturesInSelectedFolders('collections');
                        hideLayer();
                    }}>
                        Apply Selection to All Pictures in Selected Folders
                    </div>
                }
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
