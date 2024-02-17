import PhotosInfoLayer from "./PhotosInfoLayer";
import PhotosFilterLayer from "./PhotosFilterLayer";
import PhotosManageCollectionsLayer from "./PhotosManageCollectionsLayer";
import PhotosManageTagsLayer from "./PhotosManageTagsLayer";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";
import { getFirstDynformsServiceRecordFromLastRequest } from "../../dynformsHelpers";
import { useAppSelector, useAppDispatch } from "./../../app/hooks.ts";
import { photosTouchLayerStateChanged } from "../localState/localStateSlice";
import { slideShowIsPaused, getCollectionsLastAddedTo } from "./photosHelpers.tsx";
import './photosTouchLayer.scss';

function PhotosTouchLayer({fullWidth, screenMode, setScreenMode}) {
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
    const favoritesClick = (collectionName) => runPhotosServiceCommand("addToRemoveFromCollection", { collectionName });
    const addRemoveTag = (tagString) => runPhotosServiceCommand("addRemoveTag", { tagString });
    const addToRemoveFromCollection = (collectionName) => runPhotosServiceCommand("addToRemoveFromCollection", { collectionName });
    const generalClick = () => addToRemoveFromCollection("general");
    const setPhotosServiceFilter = (filter) => {
        // Should hide the main layer here but it behaves funny.
        runPhotosServiceCommand("setFilter", { filter })        
    };
    const pausebuttonClick = () => runPhotosServiceCommand("pauseResumeSlideshow", {});
    
    const photoButtonHidden = showMainLayer ? "" : "photo-button-hidden";
    const isInJessFavorites = record?.collections?.includes("Jess' Faves");
    const isInJohannesFavorites = record?.collections?.includes("Johannes' Faves");
    const isTrashed = record?.collections?.includes("trashed");
    const isUnsorted = !record?.collections?.length;

    const infoLayerProps = {
        hideLayer: () => setShowInfoLayer(false),
        photosService,
        record,
        fullWidth,
        screenMode,
        setScreenMode,
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
        let currentLabels = []; 
        if (record?.collections?.length) {
            currentLabels = record.collections.filter(collection => collection !== 'general');
        }
            
        const collectionsLastAddedTo = getCollectionsLastAddedTo(photosService, fullWidth ? 7 : 3, true);
        const collectionsLastAddedToJsx = collectionsLastAddedTo?.map((collectionName, index) => {
            const isActive = record?.collections.includes(collectionName);
            
            return (
                <div key={index}
                    className={`photo-button photo-button-collection-shortcut ${
                        isUnsorted ? `photo-button-green-inactive` : photoButtonHidden
                    } ${isActive ? "photo-button-green-active" : "photo-button-green-inactive"}`}
                    onClick={() => addToRemoveFromCollection(collectionName)}
                >
                    {collectionName}
                </div>
            );
        });

        const trashCanJsx = (
            <div
                className={`photo-button ${
                    isTrashed ? `photo-button-green-inactive` : `photo-button-orange-inactive`
                } ${isUnsorted ? `` : photoButtonHidden}`}
                onClick={hideRestoreBtnClick}
            >
                {isTrashed && <img src="/big-icons/icon-bg-save.png" />}
                {!isTrashed && <img src="/big-icons/icon-bg-trashed.png" />}
            </div>
        );                            


        return (
            <>
                {showInfoLayer && <PhotosInfoLayer {...infoLayerProps} />}
                <div className="photo-touch-layer">
                    <div className={`photo-main-touch-layer-horizontal-row`}>
                        <div
                            className={`photo-button photo-button-top-row ${photoButtonHidden} ${
                                showInfoLayer ? `info-layer-button-active` : ``
                            }`}
                            onClick={showInfoLayerClick}
                        >
                            <div className="button-label">Info Layer</div>
                        </div>
                        <div
                            className={`photo-button photo-button-top-row ${photoButtonHidden}`}
                            onClick={() => setShowChangeFilterLayer(true)}
                        >
                            Change Filter
                        </div>
                        <div
                            className={`photo-button photo-button-top-row photo-button-items-info ${photoButtonHidden}`}
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
                            className={`photo-button photo-button-top-row photo-button-items-info ${photoButtonHidden}`}
                            onClick={() => setShowManageCollectionsLayer(true)}
                        >
                            <div className="button-label">Collections</div>
                            <div className="current-items">
                                {currentLabels.length ? (
                                    currentLabels.join(", ").toLowerCase()
                                ) : (
                                    <div className="no-items-yet">no collections assigned</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={`photo-main-touch-layer-horizontal-row`} style={{ flexGrow: 10 }}>
                        <div
                            className={`photo-button photo-button-mid-row ${photoButtonHidden}`}
                            onClick={prevBtnClick}
                        >
                            Previous Picture
                        </div>
                        <div
                            className={`photo-button photo-button-mid-row photo-button-show-ui`}
                            onClick={showUiBtnClick}
                        >
                            Close
                        </div>
                        <div
                            className={`photo-button photo-button-mid-row ${photoButtonHidden}`}
                            onClick={nextBtnClick}
                        >
                            Next Picture
                        </div>
                    </div>
                    <div className={`photo-main-touch-layer-horizontal-row`}>
                        <div className="photo-buttons-bottom-row-left-container">
                            {isUnsorted && (
                                <>
                                    {["full"].includes(screenMode) && (
                                        <div className={`photo-button-settings-pause-container`}>
                                            {trashCanJsx}{" "}
                                            <div
                                                className={`photo-button`}
                                                onClick={() => setScreenMode(screenMode === "full" ? "__prev" : "full")}
                                            >
                                                <img
                                                    src={`/big-icons/icon-bg-${
                                                        screenMode === "full" ? "collapse" : "expand"
                                                    }.png`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!["full"].includes(screenMode) && trashCanJsx}

                                    <div
                                        className={`photo-button photo-button-collection-shortcut photo-button-green-inactive`}
                                        onClick={generalClick}
                                    >
                                        <img src="/big-icons/icon-bg-save.png" />
                                    </div>
                                </>
                            )}
                            {!isUnsorted && (
                                <>
                                    {["full"].includes(screenMode) && (
                                        <div className={`photo-button-settings-pause-container ${photoButtonHidden}`}>
                                            {trashCanJsx}{" "}
                                            <div
                                                className={`photo-button ${photoButtonHidden}`}
                                                onClick={() => setScreenMode(screenMode === "full" ? "__prev" : "full")}
                                            >
                                                <img
                                                    src={`/big-icons/icon-bg-${
                                                        screenMode === "full" ? "collapse" : "expand"
                                                    }.png`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!["full"].includes(screenMode) && trashCanJsx}
                                    <div
                                        className={`photo-button-settings-pause-container ${photoButtonHidden}`}
                                        onClick={pausebuttonClick}
                                    >
                                        <div className={`photo-button`}>
                                            <img src="/big-icons/icon-bg-settings.png" />
                                        </div>
                                        <div className={`photo-button`}>
                                            <img
                                                src={
                                                    slideShowIsPaused(photosService)
                                                        ? `/big-icons/icon-bg-play.png`
                                                        : `/big-icons/icon-bg-pause.png`
                                                }
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="photo-buttons-bottom-row-right-container">
                            {collectionsLastAddedToJsx}
                            <div
                                className={`photo-button photo-button-collection-shortcut ${
                                    isUnsorted ? `photo-button-purple-inactive` : photoButtonHidden
                                } ${isInJessFavorites ? "photo-button-purple-active" : "photo-button-purple-inactive"}`}
                                onClick={() => favoritesClick("Jess' Faves")}
                            >
                                Jess' Faves
                                <img src="/big-icons/icon-bg-favorite.png" />
                            </div>
                            <div
                                className={`photo-button photo-button-collection-shortcut ${
                                    isUnsorted ? `photo-button-purple-inactive` : photoButtonHidden
                                } ${
                                    isInJohannesFavorites
                                        ? "photo-button-purple-active"
                                        : "photo-button-purple-inactive"
                                }`}
                                onClick={() => favoritesClick("Johannes' Faves")}
                            >
                                Johannes' Faves
                                <img src="/big-icons/icon-bg-favorite.png" />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default PhotosTouchLayer;
