import PhotosInfoLayer from "./PhotosInfoLayer";
import PhotosFilterLayer from "./PhotosFilterLayer";
import PhotosManageCollectionsLayer from "./PhotosManageCollectionsLayer";
import PhotosManageTagsLayer from "./PhotosManageTagsLayer";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";
import { getFirstDynformsServiceRecordFromLastRequest } from "../../dynformsHelpers";
import { useAppSelector, useAppDispatch } from "./../../app/hooks.ts";
import { photosTouchLayerStateChanged } from "../localState/localStateSlice";
import './photosTouchLayer.css';

function PhotosTouchLayer({fullScreen}) {
    // State management
    const dispatch = useAppDispatch();
    const photosTouchLayerState = useAppSelector((state) => state.localState.photosTouchLayer);    
    const { showMainLayer, showInfoLayer, showChangeFilterLayer, showManageCollectionsLayer, showManageTagsLayer } = photosTouchLayerState;
    const updateState = (path, payload) => dispatch(photosTouchLayerStateChanged({...photosTouchLayerState, [path]: payload }));
    const setShowMainLayer = (payload) => updateState('showMainLayer', payload);
    const setShowInfoLayer = (payload) => updateState("showInfoLayer", payload);
    const setShowChangeFilterLayer = (payload) => updateState("showChangeFilterLayer", payload);
    const setShowManageCollectionsLayer = (payload) => updateState("showManageCollectionsLayer", payload);
    const setShowManageTagsLayer = (payload) => updateState("showManageTagsLayer", payload);

    const photosService = getPhotosService();
    const record = getFirstDynformsServiceRecordFromLastRequest(photosService?.channel);

    function runPhotosServiceCommand(commandId, body) {
        runChannelCommand(photosService?.channel, commandId, body);
    }

    // Touch Button Handlers
    const showUiBtnClick = () => setShowMainLayer(!showMainLayer);
    const showInfoLayerClick = () => {
        setShowInfoLayer(!showInfoLayer);
    }

    const prevBtnClick = () => runPhotosServiceCommand("previousPicture", {});
    const nextBtnClick = () => runPhotosServiceCommand("nextPicture", {});
    const hideRestoreBtnClick = () => runPhotosServiceCommand("hideRestorePicture", { hide: !record.collections?.includes('trashed') });
    const favoritesClick = () => runPhotosServiceCommand("toggleFavorites", {});    
    const addRemoveTag = (tagString) => runPhotosServiceCommand("addRemoveTag", { tagString });
    const addToRemoveFromCollection = (collectionName) => runPhotosServiceCommand("addToRemoveFromCollection", { collectionName });
    const generalClick = () => addToRemoveFromCollection("general");
    const setPhotosServiceFilter = (filter) => runPhotosServiceCommand("setFilter", { filter });
    
    const photoButtonHidden = showMainLayer ? "" : "photo-button-hidden";
    const isInFavorites = record?.collections?.includes("favorites");
    const isTrashed = record?.collections?.includes("trashed");
    const isUnsorted = !record?.collections?.length;

    const infoLayerProps = {
        hideLayer: () => setShowInfoLayer(false),
        photosService,
        record,
        fullScreen,
    };

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
            hideLayers: () => {
                // Both layers should be hidden here but the main layer behaves funny.
                //setTimeout(() => setShowMainLayer(true), 1500);
                setShowManageCollectionsLayer(false);
            },
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
            <>
                {showInfoLayer && <PhotosInfoLayer {...infoLayerProps} />}
                <div className="photo-touch-layer">
                    <div className={`photo-main-touch-layer-horizontal-row`}>
                        <div
                            className={`photo-button photo-button-top-row ${photoButtonHidden}`}
                            onClick={prevBtnClick}
                        >
                            Previous Picture
                        </div>
                        <div
                            className={`photo-button photo-button-top-row ${photoButtonHidden}`}
                            onClick={() => setShowChangeFilterLayer(true)}
                        >
                            Change Filter
                        </div>
                        <div
                            className={`photo-button photo-button-top-row ${photoButtonHidden}`}
                            onClick={nextBtnClick}
                        >
                            Next Picture
                        </div>
                    </div>
                    <div className={`photo-main-touch-layer-horizontal-row`} style={{ flexGrow: 10 }}>
                        <div
                            className={`photo-button info-layer-button  ${photoButtonHidden} ${
                                showInfoLayer ? `info-layer-button-active` : ``
                            }`}
                            onClick={showInfoLayerClick}
                        >
                            <div className="button-label">Info Layer</div>
                        </div>
                        <div className={`photo-button photo-button-show-ui`} onClick={showUiBtnClick}>
                            Close
                        </div>
                    </div>
                    <div className={`photo-main-touch-layer-horizontal-row photo-rating-buttons-container`}>
                        <div
                            className={`photo-button photo-button-rating photo-button-trash ${
                                isUnsorted ? `photo-button-orange` : isTrashed ? `` : photoButtonHidden
                            } ${isTrashed ? "photo-button-green" : ""}`}
                            onClick={hideRestoreBtnClick}
                        >
                            {isTrashed && <img src="/big-icons/icon-bg-save.png" />}
                            {!isTrashed && <img src="/big-icons/icon-bg-trashed.png" />}
                        </div>
                        {isUnsorted && (
                            <div
                                className={`photo-button photo-button-rating photo-button-add-to-general photo-button-green`}
                                onClick={generalClick}
                            >
                                <img src="/big-icons/icon-bg-save.png" />
                            </div>
                        )}
                        {!isUnsorted && <div className={`photo-button-spaceholder-15 ${photoButtonHidden}`}></div>}
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
                            className={`photo-button photo-button-favorite ${isUnsorted ? `photo-button-purple-inactive` : photoButtonHidden} ${
                                isInFavorites ? "photo-button-purple-active" : ""
                            }`}
                            onClick={favoritesClick}
                        >
                            {/* {isInFavorites ? "Remove from" : "Add to"} Favorites */}
                            <img src="/big-icons/icon-bg-favorite.png" />
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default PhotosTouchLayer;
