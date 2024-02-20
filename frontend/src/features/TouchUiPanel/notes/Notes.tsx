import './notes.scss'
import { getNotesService } from '../../../devicesHelpers';
import { getFirstDynformsServiceRecord } from '../../../dynformsHelpers';
function Notes() {

    const service = getNotesService();
    const record = getFirstDynformsServiceRecord(service?.channel, 0);
    const createdAt = new Date(record.created_at);

    const url = `http://jj-photos.wnet.wn:3021/db/imageFile?path=${record?.urlpath}`
    return (
        <div className="touch-ui-panel-item">
            <div className={`notes-container`}>
                POST-IT
                <span className="notes-date">
                    (from {createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })})
                </span>
                <div className="notes-image-container">
                    <img src={url} />
                </div>
            </div>
        </div>
    );
}

export default Notes