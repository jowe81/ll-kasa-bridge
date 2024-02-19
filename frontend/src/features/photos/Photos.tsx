import PhotosTouchLayer from "./PhotosTouchLayer";
import PhotosIndicatorLayer from "./PhotosIndicatorLayer";
import { getFirstDynformsServiceRecordFromLastRequest } from "../../dynformsHelpers";
import { getPhotosService } from "../../devicesHelpers";
import "./photos.css";

function Photos({ screenMode, setScreenMode }) {
    const photosService = getPhotosService();
    const record = getFirstDynformsServiceRecordFromLastRequest(photosService?.channel);
    const fullWidth = ["panel", "full"].includes(screenMode);
    let containerClassNames= 'photo-container';

    switch (screenMode) {
        case "panel":
            containerClassNames += ` photo-container-panel-screen`;
            break;
        
        case "full":
            containerClassNames += ` photo-container-cover-screen`;
            break;

        case "controls":
            containerClassNames += ` photo-container-embedded`;
            break;
    }

    let url = record ? record.url : "/images/photos_no_picture.png";
    if (!record) {
        //return;
    }

    if (photosService?.state?.settings?.ui?.disabled) {
        return (
            <div className={`${containerClassNames} photos-disabled-container`}>
                <div className="photos-disabled">Photos are temporarily disabled</div>
            </div>
        );
    }

    const props = {
        photosService,
        record,
        fullWidth,
        screenMode,
        setScreenMode,
    };

    // Stretch/Cover only in fullscreen mode and for landscape formats.
    // Orientations 6 and 8 are CW/CCW rotations.
    const stretchToCover = screenMode === `full` && (record.aspect > 1 && ![6, 8].includes(record.orientation));

    return (
        <div className={containerClassNames}>
            {stretchToCover && (
                <>
                    <div className="photo-cover" style={{ backgroundImage: `url(${url})` }} />
                </>
            )}
            {!stretchToCover && (
                <>
                    <div className="background" style={{ backgroundImage: `url(${url})` }} />
                    <div className="photo" style={{ backgroundImage: `url(${url})` }} />
                </>
            )}
            <PhotosIndicatorLayer {...props} />
            <PhotosTouchLayer {...props} />
        </div>
    );
}


export default Photos;
