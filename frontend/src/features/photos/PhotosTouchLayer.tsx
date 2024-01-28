import PhotosFilterLayer from "./PhotosFilterLayer";
import PhotosAddToCollectionLayer from "./PhotosAddToCollectionLayer";
import { useState } from "react";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";
import { getDynformsServiceRecord } from "../../dynformsHelpers";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import './photosTouchLayer.css';

function PhotosTouchLayer() {
    const [showMainLayer, setShowMainLayer] = useState(false);
    const [showChangeFilterLayer, setShowChangeFilterLayer] = useState(false);
    const [showAddToCollectionLayer, setShowAddToCollectionLayer] = useState(false);
    const { showKeyboard } = useScreenKeyboard();

    const photosService = getPhotosService();
    const record = getDynformsServiceRecord(photosService?.channel);

    function runPhotosServiceCommand(commandId, body) {
        runChannelCommand(photosService?.channel, commandId, body);
    }

    // Touch Button Handlers
    const showUiBtnClick = () => setShowMainLayer(!showMainLayer);

    const prevBtnClick = () => runPhotosServiceCommand("previousPicture", {});
    const nextBtnClick = () => runPhotosServiceCommand("nextPicture", {});
    const hideRestoreBtnClick = () => { 
        runPhotosServiceCommand("hideRestorePicture", { hide: !record.collections?.includes('trashed') })
    };
    const favoritesClick = () => runPhotosServiceCommand("toggleFavorites", {});
    const addTags = (tagString) => runPhotosServiceCommand("addTags", { tagString });
    const addToRemoveFromCollection = (collectionName) => runPhotosServiceCommand("addToRemoveFromCollection", { collectionName });
    const setPhotosServiceFilter = (filter) => runPhotosServiceCommand("setFilter", { filter });
    
    const photoButtonHidden = showMainLayer ? "" : "photo-button-hidden";
    const isInFavorites = record?.collections?.includes("favorites");
    const isHidden = record?.collections?.includes("trashed");

    function onKeyboardCloseTags(value) {
        console.log("Keyboard returned with: ", value);
        addTags(value);
    }   

    const keyboardConfigTags = {
        fieldLabel: "Tags to add:",
        instructions: "Use commas or spaces to separate multiple tags.",
        onClose: onKeyboardCloseTags,
    };

    if (showChangeFilterLayer) {
        const props = {
            hideChangeFilterLayer: () => setShowChangeFilterLayer(false),
            setPhotosServiceFilter: (filter) => {
                setShowChangeFilterLayer(false);
                setPhotosServiceFilter(filter);
                setShowMainLayer(false);
                //nextBtnClick();
            },
            photosService,
            uiInfo: photosService?.state.uiInfo,
        }

        return (
            <PhotosFilterLayer {...props}/>
        )
    } else if (showAddToCollectionLayer) {
        const props = {
            hideLayer: () => setShowAddToCollectionLayer(false),
            addToRemoveFromCollection,
            photosService,
            record,
            uiInfo: photosService?.state.uiInfo,
        };

        return <PhotosAddToCollectionLayer {...props} />;

    } else {
        return (
            <div className="photo-touch-layer">
                <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={prevBtnClick}>
                    Previous Picture
                </div>
                <div
                    className={`photo-button photo-button-top-row ${photoButtonHidden}`}
                    onClick={() => setShowChangeFilterLayer(true)}
                >
                    Change Filter
                </div>
                <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={nextBtnClick}>
                    Next Picture
                </div>
                <div className={`photo-button photo-button-show-ui ${photoButtonHidden}`} onClick={showUiBtnClick}>
                    Close
                </div>
                <div className={`photo-rating-outer-container ${photoButtonHidden}`}>
                    <div className="photo-rating-header-container">Collection Management</div>
                    <div className="photo-rating-buttons-container">
                        <div
                            className={`photo-button photo-button-rating photo-button-rating-hide ${photoButtonHidden} ${
                                isHidden ? "photo-button-engaged" : ""
                            }`}
                            onClick={hideRestoreBtnClick}
                        >
                            {isHidden && <p>Restore</p>}
                            {!isHidden && (
                                <p>
                                    Trash
                                </p>
                            )}
                        </div>
                        <div
                            className={`photo-button photo-button-rating photo-button-rating-tag ${photoButtonHidden}`}
                            onClick={() => showKeyboard(keyboardConfigTags)}
                        >
                            <div className="button-label">Add Tags</div>
                            <div className="current-tags">
                                {record?.tags && record.tags.length ? (
                                    record.tags.join(", ")
                                ) : (
                                    <div className="no-tags-yet">no tags assigned</div>
                                )}
                            </div>
                        </div>
                        <div
                            className={`photo-button photo-button-rating ${photoButtonHidden}`}
                            onClick={() => setShowAddToCollectionLayer(true)}
                        >
                            Other Collections
                        </div>
                        <div
                            className={`photo-button photo-button-rating ${photoButtonHidden} ${
                                isInFavorites ? "photo-button-engaged" : ""
                            }`}
                            onClick={favoritesClick}
                        >
                            {isInFavorites ? "Remove from" : "Add to"} Favorites
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PhotosTouchLayer;
