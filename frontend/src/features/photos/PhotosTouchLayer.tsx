import { useState } from "react";
import { getPhotosService, runChannelCommand } from "../../devicesHelpers";


function PhotosTouchLayer() {
    const [showLayer, setShowLayer] = useState(false);
    const photosService = getPhotosService();

    function runPhotosServiceCommand(commandId, body) {
        runChannelCommand(photosService?.channel, commandId, body);
    }

    // Touch Button Handlers
    const showUiBtnClick = () => setShowLayer(!showLayer);

    const prevBtnClick = () => runPhotosServiceCommand("previousPicture", {});
    const nextBtnClick = () => runPhotosServiceCommand("nextPicture", {});
    const rateBtnClick = (rating: number) => runPhotosServiceCommand("ratePicture", { rating });

    const setFilterBtnClick = () => {

    }

    const photoButtonHidden = showLayer ? "" : "photo-button-hidden";

    return (
        <div className="photo-touch-layer">
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={prevBtnClick}>
                Previous Picture
            </div>
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={setFilterBtnClick}>
                Set A Filter
            </div>
            <div className={`photo-button photo-button-top-row ${photoButtonHidden}`} onClick={nextBtnClick}>
                Next Picture
            </div>
            <div className={`photo-button photo-button-show-ui ${photoButtonHidden}`} onClick={showUiBtnClick}>
                Close
            </div>
            <div className={`photo-rating-outer-container ${photoButtonHidden}`}>
                <div className="photo-rating-header-container">Rating Options</div>
                <div className="photo-rating-buttons-container">
                    <div className={`photo-button photo-button-rating ${photoButtonHidden}`} onClick={() => rateBtnClick(0)}>
                        <p>Don't show<br/>this again</p>                    
                    </div>
                    <div className={`photo-button photo-button-rating ${photoButtonHidden}`} onClick={() => rateBtnClick(0)}>
                        Show seldom
                    </div>
                    <div className={`photo-button photo-button-rating ${photoButtonHidden}`} onClick={() => rateBtnClick(0)}>
                        Show normal
                    </div>
                    <div className={`photo-button photo-button-rating ${photoButtonHidden}`} onClick={() => rateBtnClick(0)}>
                        Show more often
                    </div>
                </div>
            </div>

        </div>
    );
}

export default PhotosTouchLayer;
