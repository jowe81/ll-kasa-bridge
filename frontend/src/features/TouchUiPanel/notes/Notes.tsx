import './notes.scss'
import { getNotesService } from '../../../devicesHelpers';
import { getDynformsServiceRecords, getDynformsLibraryInfo } from "../../../dynformsHelpers";
function Notes() {

    const service = getNotesService();
    const records = getDynformsServiceRecords(service?.channel, undefined, true);
    const record = getMostRecentDisplayableRecord(records);
    if (!record) {
        return <div className="touch-ui-panel-item"><div className={`notes-container`}></div></div>
    }

    const libraryInfo = getDynformsLibraryInfo(service);
    const supportedColors = ["purple", "blue", "green", "yellow", "gray", "pink"];
    const createdAt = new Date(record.created_at);
    const colorClassName = mapRecordToColorClass(record, supportedColors, libraryInfo?.totalDocumentCount);

    const url = record.urlpath ? `http://jj-photos.wnet.wn:3021/db/imageFile?path=${record.urlpath}` : null;

    const message = record.message;

    if (message === '__NONE__') {
        return;
    }
    
    return (
        <div className="touch-ui-panel-item">
            <div className={`notes-container ${colorClassName}`}>
                POST-IT
                <span className="notes-date">
                    (from {record.__user?.name}, {createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })})
                </span>
                {url && <div className="notes-image-container">
                    <img src={url} />
                </div>}
                {!url && <div className={`notes-message`} style={getMessageDivStyle(message)}>{message}</div>}
            </div>
        </div>
    );
}

function getMessageDivStyle(message) {
    const length = message?.split(/\s+/).length;
    let fontSize = 14;

    if (length < 20) {
        fontSize = 20;
    }

    if (length > 40) {
        fontSize = 11;
    }

    return {
        fontSize,
    }
}
function getMostRecentDisplayableRecord(records) {
    return records.find(record => record.display && (record.urlpath || record.message));
}

function mapRecordToColorClass(record, supportedColors, runningNumber) {
    if (supportedColors.includes(record?.color)) {
        return `notes-${record.color}`;
    }

    const n = (runningNumber ?? 0) % 4;

    switch (n) {
        case 0:
            return "notes-yellow";

        case 1:
            return "notes-purple";

        case 2:
            return "notes-green";

        case 3:
            return "notes-blue";

        default:
            return "notes-gray";
    }
}


export default Notes