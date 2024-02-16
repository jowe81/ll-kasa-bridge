import "./photosIndicatorLayer.scss";

function PhotosIndicatorLayer({ photosService, record }) {
    if (!record) {
        return;
    }

    const libraryInfo = photosService?.state?.api?.libraryInfo;

    function isUnsorted() {        
        return !record?.collections?.length;
    }

    function isInCollection(collectionName) {
        if (!record?.collections?.length) {
            return false;
        }

        return record.collections.includes(collectionName);
    }
    
    function isTrashed() {
        return isInCollection('trashed');
    }


    function getTagsText() {
        return record?.tags?.length ? record.tags.join(", ") : <span className="placeholder-text">No Tags</span>;
    }

    function getCollectionsText() {
        return record?.collections?.length ? (
            record.collections.join(", ")
        ) : (
            <span className="placeholder-text">No Collections</span>
        );
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

    function getFolderText() {
        const folderInfo = libraryInfo.folders?.find((info) => record.dirname === info.item);
        return folderInfo.label;
    }

    function getFilterSizeText() {
        return <div>{libraryInfo.filterSize} images</div>;
    }

    function getSpacer() {
        return <div className="flex-spacer invisible"></div>;
    }

    function getIconJsx(className) {
        return <div className='icon'>
            <div className={className}>
                <img src={`/big-icons/${className}.png`}/>
            </div>
        </div>;
    }

    let additionalContainerClasses = "";
    let iconJsx;

    if (isTrashed()) {
        additionalContainerClasses = 'border-red';
        // iconJsx = getIconJsx('icon-bg-trashed');
    }

    if (isUnsorted()) {
        additionalContainerClasses = 'border-orange';
        // iconJsx = getIconJsx('icon-bg-unsorted');
    }

    //console.log(photosService?.state);
    
    return (
        <div className={`touch-layer photos-indicator-layer ${additionalContainerClasses}`}>
            <div className="horizontal-row-top">{iconJsx}</div>
            <div className="horizontal-row-remaining-space">
            </div>
            <div className="horizontal-row"></div>
        </div>
    );
}

export default PhotosIndicatorLayer;
