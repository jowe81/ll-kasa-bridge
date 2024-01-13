import constants from "../../constants";
import { getDynformsServiceRecord } from "../../dynformsHelpers";
import { runChannelCommand } from "../../devicesHelpers";
import "./photos.css";

function Photos(props: any) {
    const photosServiceChannel  = constants.photos?.photosServiceChannel;
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

    const iUrl = constants.photos.url + "/" + record.fullname;
    return (
        <div className={containerClassNames}>
            <div
                className="background"
                style={{ backgroundImage: `url(${iUrl})` }}
            />
            <div
                className="photo"
                style={{ backgroundImage: `url(${iUrl})` }}
            />
            <div className="photo-meta">
                <div className="photo-button-next" onClick={nextBtnClick}>

                </div>
            </div>
        </div>
    );
}


export default Photos;
