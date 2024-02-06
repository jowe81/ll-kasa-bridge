import PhotosTouchLayer from "./PhotosTouchLayer";
import { getFirstDynformsServiceRecord } from "../../dynformsHelpers";
import { getPhotosService } from "../../devicesHelpers";
import "./photos.css";

function Photos(props: any) {
    const photosService = getPhotosService();
    const record = getFirstDynformsServiceRecord(photosService?.channel);

    const { fullScreen } = props;

    const containerClassNames = `photo-container ${
        fullScreen ? `photo-container-full-screen` : `photo-container-embedded`
    }`;

    let url = record ? record.url : '/images/photos_no_picture.png';
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


    return (
        <div className={containerClassNames}>
            <div className="background" style={{ backgroundImage: `url(${url})` }} />
            <div className="photo" style={{ backgroundImage: `url(${url})` }} />
            <div className="photo-meta">                
            </div>
            <PhotosTouchLayer fullScreen={fullScreen}/>
        </div>
    );
}


export default Photos;
