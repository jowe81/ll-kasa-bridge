import { useState } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import "./photosFilterLayer.scss";

function PhotosFilterLayer({ setPhotosServiceFilter, hideChangeFilterLayer, uiInfo, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const initialFilterState = {
        collection: null,
        tags: [],
        ...uiInfo?.filter,
    };

    if (!initialFilterState.collection) {
        initialFilterState.collection = "general";
    }

    const [filter, setFilter] = useState<any>(initialFilterState);

    const { showKeyboard } = useScreenKeyboard();

    const keyboardConfigTags = {
        fieldLabel: "Tags to filter by:",
        instructions: "Use commas or spaces to separate multiple tags.",
        value: filter.tags?.join(' '),
        onClose: (value) => setFilter({ ...filter, tags: splitTags(value) }),
    };

    const collections = libraryInfo?.collections?.map((info) => info.collectionName);

    const collectionItemsJsx = collections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find(info => info.collectionName === collection);
        
        if (collectionInfo) {

        }

        return (
            <div
                key={index}
                className={`touch-item ${filter.collection === collection ? "touch-item-selected" : ""}`}
                onClick={() => setFilter({ ...filter, collection })}
            >
                {collection[0].toUpperCase() + collection.substring(1)}
                <div className="touch-item-info">{collectionInfo?.count} pictures</div>
            </div>
        );
    });

    
    function handleTagClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const tag = event.target.dataset.value;
        console.log(`Removing ${tag}`);
        setFilter({ ...filter, tags: filter.tags.filter((item) => item !== tag) });
    }

    const tagsJsx = filter.tags?.map((tag, index) => (
        <div
            key={index}
            className={`touch-item`}
            data-value={tag}
            onClick={handleTagClick}
        >
            {tag}
        </div>
    ));


    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="options-groups-container">
                <div className="header">Filtering Options</div>
                <div className="options-group">
                    <div className="label">Collection:</div>
                    <div className="touch-items-container">{collectionItemsJsx}</div>
                </div>
                <div className="options-group" onClick={() => showKeyboard(keyboardConfigTags)}>
                    <div className="label">
                        Tags:
                        <div className="touch-items-container">{tagsJsx}</div>
                    </div>
                </div>
            </div>
            <div className="actions-container">
                <div className="action" onClick={hideChangeFilterLayer}>
                    Cancel
                </div>
                <div className="action" onClick={() => setPhotosServiceFilter(filter)}>
                    Set New Filter
                </div>
            </div>
        </div>
    );
}

// Remove all non-alpha characters and extract words in lowercase.
function splitTags(tagsString) {
    const tags = tagsString
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(tag => tag);

    return tags;
}

export default PhotosFilterLayer;
