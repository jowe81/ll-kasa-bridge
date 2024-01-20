import { useState } from "react";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";
import { getDynformsServiceRecord } from "../../dynformsHelpers";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import './photosTouchLayer.css';

function PhotosTouchLayer() {
    const [showLayer, setShowLayer] = useState(false);
    const { showKeyboard, inputValue } = useScreenKeyboard();

    const photosService = getPhotosService();
    const record = getDynformsServiceRecord(photosService?.channel);

    function runPhotosServiceCommand(commandId, body) {
        runChannelCommand(photosService?.channel, commandId, body);
    }

    // Touch Button Handlers
    const showUiBtnClick = () => setShowLayer(!showLayer);

    const prevBtnClick = () => runPhotosServiceCommand("previousPicture", {});
    const nextBtnClick = () => runPhotosServiceCommand("nextPicture", {});
    const hideRestoreBtnClick = () => runPhotosServiceCommand("hideRestorePicture", { hide: record.rating >= 0 || typeof record.rating === 'undefined' });
    const favoritesClick = () => runPhotosServiceCommand("toggleFavorites", {});
    
    const setFilterBtnClick = () => {

    }

    const photoButtonHidden = showLayer ? "" : "photo-button-hidden";
    const isInFavorites = record?.rating === 5;
    const isHidden = record?.rating === -1;

    function onKeyboardClose(value) {
        console.log('Keyboard returned with: ', value);
    }

    const keyboardConfig = {
        fieldLabel: "Collection Name:",
        instructions: "Type the name of a collection you want to add the image to.",
        onClose: onKeyboardClose,
    };
    return (
        <div className="photo-touch-layer">
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={prevBtnClick}>
                Previous Picture
            </div>
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={setFilterBtnClick}>
                Change Filter
            </div>
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={nextBtnClick}>
                Next Picture
            </div>
            <div className={`photo-button photo-button-show-ui ${photoButtonHidden}`} onClick={showUiBtnClick}>
                Close
            </div>
            <div className={`photo-button photo-button-pause ${photoButtonHidden}`} onClick={showUiBtnClick}>
                Pause
            </div>
            <div className={`photo-rating-outer-container ${photoButtonHidden}`}>
                <div className="photo-rating-header-container">Rating Options</div>
                <div className="photo-rating-buttons-container">
                    <div className={`photo-button photo-button-rating photo-button-rating-hide ${photoButtonHidden} ${isHidden ? 'photo-button-engaged' : ''}`} onClick={hideRestoreBtnClick}>
                        {isHidden && <p>Restore</p>}
                        {!isHidden && <p>Don't show<br/>this again</p>}
                    </div>
                    <div className={`photo-button photo-button-rating ${photoButtonHidden}`} onClick={() => {
                        showKeyboard(keyboardConfig);
                    }}>
                        Add to Collection
                    </div>
                    <div className={`photo-button photo-button-rating ${photoButtonHidden} ${isInFavorites ? 'photo-button-engaged' : ''}`} onClick={favoritesClick}>
                        {isInFavorites ? "Remove from" : "Add to"} Favorites
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PhotosTouchLayer;
