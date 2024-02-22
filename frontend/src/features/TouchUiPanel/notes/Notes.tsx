import './notes.scss'
import { getNotesService } from '../../../devicesHelpers';
import { getFirstDynformsServiceRecord } from '../../../dynformsHelpers';
function Notes() {

    const service = getNotesService();
    const record = getFirstDynformsServiceRecord(service?.channel, 0);
    console.log(service?.state)
    const createdAt = new Date(record?.created_at);

    function mapDateToColorClass(date) {
        const n = date.getDate() % 4;
        
        switch(n) {
            case 0:
                return 'notes-purple';
            
            case 1:
                return 'notes-blue';

            case 2:
                return 'notes-green';

            case 3:
                return 'notes-yellow';
        }
    }

    const colorClassName = mapDateToColorClass(createdAt)

    const url = `http://jj-photos.wnet.wn:3021/db/imageFile?path=${record?.urlpath}`
    return (
        <div className="touch-ui-panel-item">
            <div className={`notes-container ${colorClassName}`}>
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