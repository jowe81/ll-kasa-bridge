import constants from "../../constants";
import { getDynformsServiceRecord } from "../../dynformsHelpers";
import { runChannelCommand } from "../../devicesHelpers";
import { getDeviceByChannel } from "../../devicesHelpers";
import "./photos.css";

function Photos(props: any) {
    const photosServiceChannel  = constants.photos?.photosServiceChannel;
    const photosService = getDeviceByChannel(photosServiceChannel);
    const record = getDynformsServiceRecord(photosServiceChannel);

    const { fullScreen } = props;

    const nextBtnClick = () => runPhotosServiceCommand('nextPicture', {});

    function runPhotosServiceCommand(commandId, body) {
        runChannelCommand(photosServiceChannel, commandId, body)
    }

    const containerClassNames = `photo-container ${
        fullScreen ? `photo-container-full-screen` : `photo-container-embedded`
    }`;
    if (!record) {
        return;
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
            <div
                className="background"
                style={{ backgroundImage: `url(${record.url})` }}
            />
            <div
                className="photo"
                style={{ backgroundImage: `url(${record.url})` }}
            />
            <div className="photo-meta">
                <div className="photo-button-next" onClick={nextBtnClick}>

                </div>
            </div>
        </div>
    );
}


export default Photos;
