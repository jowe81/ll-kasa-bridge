import './photosInfoLayer.scss';
import { getLatestOps } from './photosHelpers';

function PhotosInfoLayer({ photosService, hideLayer, record, screenMode }) {
    if (!record) {
        return null;
    }

    const fullWidth = ["panel", "full"].includes(screenMode);

    const libraryInfo = photosService?.state?.api?.libraryInfo;
    const latestOps = getLatestOps(photosService);

    function getTagsText() {
        return record?.tags?.length ?
            record.tags.join(', ') :
            <span className="placeholder-text">No Tags</span>        
    }

    function getCollectionsText() {
        const displayCollections = (record?.collections ?? []).filter(collectionName => !['general', 'trashed'].includes(collectionName)).sort();

        return displayCollections.length ?
            displayCollections.join(', ') :
            <span className="placeholder-text">No Collections</span>        

    }

    function getDateText() {
        if (record?.date) {
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

        if (Array.isArray(record.device?.model)) {
            if (record.device.model.length) {
                text = record.device.model[0];
            }
        } else if (record.device?.model) {
            text = record.device.model;
        } else if (Array.isArray(record.device?.make)) {
            if (record.device.make.length) {
                text = record.device.make[0];
            }
        } else {
            text = record.device?.make;
        }

        return text;
    }

    function getResolutionText() {        
        return `${record.width} x ${record.height}`;
    }

    function getAspectText() {
        let text;
        const aspectFixed = (record.width / record.height).toFixed(2);        
        if (aspectFixed == '1.50') {
            text = '3:2';
        } else if (aspectFixed == "1.33") {
            text = '4:3';
        } else if (aspectFixed == "1.78") {
            text = '16:9';
        } else if (aspectFixed == "2.33") {
            text = '21:9';
        } else {
            text = aspectFixed;
        }

        return text;
    }

    function getFolderText() {
        const folderInfo = libraryInfo.folders?.find((info) => record.dirname === info.item);
        return folderInfo?.label;
    }

    function getFilterSizeText() {
        if (typeof latestOps.cursorIndex === 'number') {
            return (
                <div>
                    #{latestOps.cursorIndex} of {latestOps.filterSize} images
                </div>
            );
        } else {
            return <div>{latestOps.filterSize} images</div>;
        }        
    }

    function getSpacer() {
        return <div className="flex-spacer invisible"></div>
    }
    
    const dateText = getDateText();
    const tagsText = getTagsText();
    const collectionsText = getCollectionsText();
    const folderText = getFolderText();
    const deviceText = getDeviceText();
    const resulutionText = getResolutionText();
    const aspectText = getAspectText();

    return (
        <div className={`touch-layer photos-info-layer ${fullWidth ? `` : `window-mode`}`}>
            <div className="horizontal-row-top">{!fullWidth && getFilterSizeText()}</div>
            <div className="horizontal-row-remaining-space">
                <div className="hide-button" onClick={hideLayer}></div>
            </div>
            <div className="horizontal-row">
                {dateText && <div>{dateText}</div>}
                {tagsText && <div>{tagsText}</div>}
                {collectionsText && <div>{collectionsText}</div>}
                {folderText && <div>{folderText}</div>}
                {deviceText && <div>{deviceText}</div>}
                {resulutionText && <div>{resulutionText}</div>}
                {aspectText && <div>{aspectText}</div>}
                {fullWidth && <>{getSpacer()} {getFilterSizeText()}</>}
            </div>
        </div>
    );
}

export default PhotosInfoLayer;
