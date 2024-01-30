import PhotosFilterLayer from "./PhotosFilterLayer";
import PhotosManageCollectionsLayer from "./PhotosManageCollectionsLayer";
import PhotosManageTagsLayer from "./PhotosManageTagsLayer";
import { useState } from "react";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";
import { getDynformsServiceRecord } from "../../dynformsHelpers";
import './photosTouchLayer.css';

function PhotosTouchLayer() {
    const [showMainLayer, setShowMainLayer] = useState(false);
    const [showChangeFilterLayer, setShowChangeFilterLayer] = useState(false);
    const [showManageCollectionsLayer, setShowManageCollectionsLayer] = useState(false);
    const [showManageTagsLayer, setShowManageTagsLayer] = useState(false);

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
    const addRemoveTag = (tagString) => runPhotosServiceCommand("addRemoveTag", { tagString });
    const addToRemoveFromCollection = (collectionName) => runPhotosServiceCommand("addToRemoveFromCollection", { collectionName });
    const setPhotosServiceFilter = (filter) => runPhotosServiceCommand("setFilter", { filter });
    
    const photoButtonHidden = showMainLayer ? "" : "photo-button-hidden";
    const isInFavorites = record?.collections?.includes("favorites");
    const isHidden = record?.collections?.includes("trashed");

    if (showChangeFilterLayer) {
        const props = {
            hideChangeFilterLayer: () => setShowChangeFilterLayer(false),
            setPhotosServiceFilter: (filter) => {
                setShowChangeFilterLayer(false);
                setPhotosServiceFilter(filter);
                setShowMainLayer(false);
            },
            photosService,
            uiInfo: photosService?.state.uiInfo,
        }

        return (
            <PhotosFilterLayer {...props}/>
        )
    } else if (showManageCollectionsLayer) {
        const props = {
            hideLayer: () => setShowManageCollectionsLayer(false),
            addToRemoveFromCollection,
            photosService,
            record,
            uiInfo: photosService?.state.uiInfo,
        };

        return <PhotosManageCollectionsLayer {...props} />;
    } else if (showManageTagsLayer) {
        const props = {
            hideLayer: () => setShowManageTagsLayer(false),
            addRemoveTag,
            photosService,
            record,
            uiInfo: photosService?.state.uiInfo,
        };

        return <PhotosManageTagsLayer {...props} />;
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
                            {!isHidden && <p>Trash</p>}
                        </div>
                        <div
                            className={`photo-button photo-button-rating photo-button-rating-tag ${photoButtonHidden}`}
                            onClick={() => setShowManageTagsLayer(true)}
                        >
                            <div className="button-label">Tags</div>
                            <div className="current-items">
                                {record?.tags && record.tags.length ? (
                                    record.tags.join(", ")
                                ) : (
                                    <div className="no-items-yet">no tags assigned</div>
                                )}
                            </div>
                        </div>
                        <div
                            className={`photo-button photo-button-rating photo-button-rating-tag ${photoButtonHidden}`}
                            onClick={() => setShowManageCollectionsLayer(true)}
                        >
                            <div className="button-label">Collections</div>
                            <div className="current-items">
                                {record?.collections && record.collections.length ? (
                                    record.collections.join(", ").toLowerCase()
                                ) : (
                                    <div className="no-items-yet">no collections assigned</div>
                                )}
                            </div>
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
