import './photosInfoLayer.scss';

function PhotosInfoLayer({ photosService, hideLayer, record }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    function getTagsText() {
        return record?.tags?.length ?
            record.tags.join(', ') :
            <span className="placeholder-text">No Tags Assigned</span>        
    }

    function getCollectionsText() {
        return record?.collections?.length ?
            record.collections.join(', ') :
            <span className="placeholder-text">No Collections Assigned</span>        

    }

    function getDateText() {
        if (record.date) {
            const date = new Date(record.date);
            const dateFormatOptions: Intl.DateTimeFormatOptions = {
                month: "short", // Short month name (e.g., 'Apr')
                day: "numeric", // Numeric day of the month
                year: "numeric",
            };

            return date.toLocaleDateString(undefined, dateFormatOptions);
        }
    }

    function getDeviceText() {
        let text;

        if (Array.isArray(record.device.model)) {
            if (record.device.model.length) {
                text = record.device.model[0];
            }
        } else if (record.device.model) {
            text = record.device.model;
        } else if (Array.isArray(record.device.make)) {
            if (record.device.make.length) {
                text = record.device.make[0];
            }
        } else {
            text = record.device.make;
        }

        return text;
    }

    function getResolutionText() {        
        return `${record.width} x ${record.height}`;
    }

    function getFolderText() {
        const folderInfo = libraryInfo.folders?.find((info) => record.dirname === info.item);
        return folderInfo.label;
    }

    return (
        <div className="touch-layer photos-info-layer">
            <div className="horizontal-row"></div>
            <div className="horizontal-row-remaining-space">
                <div className="hide-button" onClick={hideLayer}></div>
            </div>
            <div className="horizontal-row">
                <div>{getDateText()}</div>
                <div>{getTagsText()}</div>
                <div>{getCollectionsText()}</div>
                <div>{getFolderText()}</div>
                <div>{getDeviceText()}</div>
                <div>{getResolutionText()}</div>
            </div>
        </div>
    );
}

export default PhotosInfoLayer;
