import { getFirstDynformsServiceRecordFromLastRequest } from "../../dynformsHelpers";


function getRecord(photosService) {
    return getFirstDynformsServiceRecordFromLastRequest(photosService?.channel);
}

function colorToButtonClass(color, baseName = "photo-button", active = true) {
    if (!color) {
        color = "gray";
    }

    return `${baseName}-${color}-${active ? `active` : `inactive`}`;
}

function getLibraryInfo(photosService) {
    return photosService?.state?.api?.libraryInfo;
}

function getDefaultCollectionLabels(photosService, includeUnsorted = false, includeGeneral = false, includeTrash = true) {
    const defaultCollections = getDefaultCollectionsObjects(photosService, includeUnsorted, includeGeneral, includeTrash);
    if (!defaultCollections) {
        return [];
    }

    return defaultCollections.map((collection) => collection.label);
}

function getDefaultCollectionsObjects(photosService, includeUnsorted = false, includeGeneral = false, includeTrash = true) {
    let result = photosService?.state?.settings?.defaultCollections ?? [];

    if (!includeUnsorted) {
        result = result.filter((collection) => collection.label !== "unsorted");
    }

    if (!includeGeneral) {
        result = result.filter((collection) => collection.label !== "general");
    }

    if (!includeTrash) {
        result = result.filter((collection) => collection.label !== "trashed");
    }

    return result;
}

function getCustomCollectionLabels(photosService) {
    const libraryInfo = getLibraryInfo(photosService);
    const allCollectionLabels = libraryInfo?.collections?.map((info) => info.item).sort() ?? [];

    const defaultCollectionLabels = getDefaultCollectionLabels(
        photosService,
        true, // Include unsorted (so that it gets filtered below)
        true, // Include the general collection here (so that it gets filtered below)
    );

    return allCollectionLabels
        .filter((collectionName) => !defaultCollectionLabels.includes(collectionName))
        .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
}

function getDefaultCollectionsJsx(
    photosService,
    currentSetOfLabels,
    onClick,
    includeUnsorted = false,
    includeGeneral = false,
    includeTrash = true,
) {
    if (!Array.isArray(currentSetOfLabels)) {
        return null;
    }

    const libraryInfo = getLibraryInfo(photosService);
    return getDefaultCollectionsObjects(photosService, includeUnsorted, includeGeneral, includeTrash).map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find((info) => info.item === collection.label);

        let classNames = "touch-item";

        if (
            (collection.label === "unsorted" && !currentSetOfLabels.length) ||
            currentSetOfLabels.includes(collection.label)
        ) {
            classNames += ` ${colorToButtonClass(collection.color, "photo-button", true)}`;
        } else {
            classNames += ` ${colorToButtonClass(collection.color, "photo-button", false)}`;
        }

        return (
            <div
                key={index}
                className={`collection-button ${classNames} ${collection.className}`}
                onClick={() => onClick(collection.label)}
            >
                {collection.label !== "trashed" && (
                    <>
                        <div className="touch-item-label">
                            {collection.label[0].toUpperCase() + collection.label.substring(1)}{" "}
                        </div>
                        <div className="touch-item-info">
                            {collectionInfo?.count ?? 0} picture{collectionInfo?.count === 1 ? `` : `s`}
                        </div>
                    </>
                )}
                <div className={`img-container ${collection.label === "trashed" ? "opacity-25" : ""}`}>
                    <img src={collection.imgSrc} />
                </div>
            </div>
        );
    });
}

function getCustomCollectionsJsx(
    photosService,
    currentSetOfLabels,
    onClick,
) {
    if (!Array.isArray(currentSetOfLabels)) {
        return null;
    }

    const libraryInfo = getLibraryInfo(photosService);
    const customCollections = getCustomCollectionLabels(photosService);
    const record = getRecord(photosService);

    return customCollections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find((info) => info.item === collection);

        let className = "touch-item";
        if (currentSetOfLabels.includes(collection)) {
            className += " touch-item-selected";
        }

        return (
            <div key={index} className={className} onClick={() => onClick(collection)}>
                <div className="touch-item-label">{collection[0].toUpperCase() + collection.substring(1)}</div>
                <div className="touch-item-info">
                    {collectionInfo?.count} picture{collectionInfo?.count === 1 ? `` : `s`}
                </div>
            </div>
        );
    });
}

function getCollectionLabelsForRecord(photosService, excludeCollections = [ 'general', 'trashed' ]) {
    const record = getRecord(photosService);
    if (!record) {
        return []
    }
    return record.collections.filter((collection) => !excludeCollections.includes(collection));
}

export {
    colorToButtonClass,
    getCollectionLabelsForRecord,
    getCustomCollectionLabels,
    getCustomCollectionsJsx,
    getDefaultCollectionsObjects,
    getDefaultCollectionLabels,
    getDefaultCollectionsJsx,
    getLibraryInfo,
    getRecord,
};
