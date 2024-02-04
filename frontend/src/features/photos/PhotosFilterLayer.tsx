import TouchUIBooleanField from "./TouchUIBooleanField";
import TouchUIDateSelector from "./TouchUIDateSelector";
import { useState, useEffect } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import './../TouchUiMain/calendar/calendarHelpers';
import "./photosFilterLayer.scss";

function PhotosFilterLayer({ setPhotosServiceFilter, hideChangeFilterLayer, uiInfo, photosService }) {
    const libraryInfo = photosService?.state?.api?.libraryInfo;

    const clearedFilterState = {
        collections: [],
        tags: [],
        mode_collections: "$in",
        mode_tags: "$in",
        startDate: {
            // Default to the beginning of the current year
            year: (new Date()).getFullYear(),
            month: 1,
            date: 1,
            enabled: false,
        },
        endDate: {
            // Default to the current date
            enabled: false,
        },

        folders: [],
    };

    const initialFilterState = {
        ...clearedFilterState,
        ...uiInfo?.filter,
    };

    const [filter, _setFilter] = useState<any>(initialFilterState);

    const setFilter = (filter) => {
        _setFilter({ ...filter });
        setInputValue(filter.tags.join(' '));
        console.log(`new filter`, filter);
    };

    // Make sure to update the filter if a remote change comes in.
    useEffect(() => {
        setFilter({
            ...filter,
            ...uiInfo?.filter,
        })
        setInputValue(filter.tags.join(" "));
    }, [uiInfo.filter])

    // Clear the select tags text when opening the dialog.
    useEffect(() => {
        setInputValue(filter.tags.join(" "));
    }, []);
    const { showKeyboard, inputValue, setInputValue } = useScreenKeyboard();

    function resetFilterState() {
        setFilter({...clearedFilterState})
    }

    function addRemoveTagFromInput(tag) {
        let newInputValue = '';

        if (splitTags(inputValue).includes(tag)) {
            newInputValue = removeTagFromString(inputValue, tag);
            console.log(`Removing ${tag}`);
        } else {
            newInputValue = inputValue.trim() + ' ' + tag;
            console.log(`Adding ${tag}`);
        }

        setInputValue(newInputValue);
        setFilter({ ...filter, tags: splitTags(newInputValue)});
    }

    function addRemoveCollectionFromFilter(collectionName) {
        let newCollections;

        // If 'unsorted': 
        if (collectionName === 'unsorted') {
            newCollections = [];
        } else if (collectionName === 'trashed') {
            newCollections = ['trashed'];
        } else {
            if (filter.collections.includes('trashed')) {
                filter.collections = [];
            }

            if (filter.collections.includes(collectionName)) {
                newCollections = filter.collections.filter((collection) => collection !== collectionName);
            } else {
                newCollections = [...filter.collections, collectionName];
            }
        }

        setFilter({...filter, collections: newCollections});
    }

    function addRemoveFolderFromFilter(folderInfo: any) {
        let newFolders: string[] = [];
        
        if (filter.folders) {
            if (filter.folders.includes(folderInfo.item)) {
                newFolders = filter.folders.filter((item) => item != folderInfo.item);
            } else {
                newFolders = [...filter.folders, folderInfo.item];
            }            
        } else {
            newFolders = [folderInfo.item as string];
        }


        setFilter({...filter, folders: newFolders});
    }

    const keyboardConfigTags = {
        fieldLabel: "Tags to filter by:",
        instructions: "Use spaces to separate multiple tags.",
        value: filter.tags?.join(' '),
        onClose: (value) => setFilter({ ...filter, tags: splitTags(value) }),
    };

    let allCollections = libraryInfo?.collections?.map((info) => info.item).sort();

    let defaultCollections = allCollections && allCollections
        .filter((collectionName) => ["unsorted", "trashed", "favorites"].includes(collectionName))
        .sort((a, b) => a > b ? -1 : 1 );
        
    let customCollections = allCollections && allCollections
        .filter((collectionName) => !["unsorted", "trashed", "favorites"].includes(collectionName))
        .sort();

    if (!allCollections) {
        allCollections = [];
    }

    if (!defaultCollections) {
        defaultCollections = [];
    }

    if (!customCollections) {
        customCollections = [];
    }

    const collections = [...defaultCollections, ...customCollections];

    const collectionItemsJsx = collections.map((collection, index) => {
        const collectionInfo = libraryInfo?.collections?.find(info => info.item === collection);
        
        let className = "touch-item";

        if ((collection === 'unsorted' && !filter.collections.length) || (filter.collections?.includes(collection))) {
            className += " touch-item-selected";
        } 

        return (
            <div
                key={index}
                className={className}
                onClick={() => addRemoveCollectionFromFilter(collection)}
            >
                {collection[0].toUpperCase() + collection.substring(1)} <span className="touch-item-info">{collectionInfo?.count}</span>
            </div>
        );
    });

    const filterModeProps: any = {
        labelTrue: "All",
        labelFalse: "Any",
        valueTrue: "$all",
        valueFalse: "$in",
    }

    const collectionsModeProps: any = {
        ...filterModeProps,
        handleClick: (value) => {
            setFilter({ ...filter, mode_collections: value});
        },
        initialValue: uiInfo?.filter?.mode_collections,
    };

    const tagsModeProps = {
        ...filterModeProps,
        handleClick: (value) => {
            setFilter({ ...filter, mode_tags: value });
        },
        initialValue: uiInfo?.filter?.mode_tags,
    };

    const availableTags = getItemsInfoSelectedFirst('tags');
    const availableTagItemsJsx = availableTags?.map((tagInfo, index) => {
        const tag = tagInfo.item;
        return (
            <div
                key={index}
                className={`touch-item ${filter.tags?.includes(tag) ? "touch-item-selected" : ""}`}
                onClick={() => addRemoveTagFromInput(tag)}
            >
                {tag[0].toUpperCase() + tag.substring(1)} <span className="touch-item-info">{tagInfo.count}</span>
            </div>
        );
    });

    const folders = getItemsInfoSelectedFirst('folders');
    const folderItemsJsx = folders?.map((folderInfo, index) => {
        const label = folderInfo.label;        
        return (
            <div
                key={index}
                className={`touch-item ${filter.folders?.includes(folderInfo.item) ? "touch-item-selected" : ""}`}
                onClick={() => addRemoveFolderFromFilter(folderInfo)}
            >
                {label} <span className="touch-item-info">{folderInfo.count}</span>
            </div>
        );
    });
    
    /**
     * Sort the array of itemsInfos such that selected items show up first.
     * For tags, collections, folders.
     */
    function getItemsInfoSelectedFirst(arrayPropertyName) {
        const selectedItems = filter[arrayPropertyName] ?? [];
        const selectedItemsInfo = libraryInfo[arrayPropertyName].filter(info => selectedItems.includes(info.item));
        const otherItemsInfo = libraryInfo[arrayPropertyName].filter((info) => !selectedItems.includes(info.item));

        return [...selectedItemsInfo, ...otherItemsInfo];
    }

    function handleDateSelection(property, newDate) {
        console.log(`New ${property}:`, newDate);
        const newFilter = {
            ...filter,
            [property]: newDate,
        }
        setFilter(newFilter);
    }

    return (
        <div className="touch-layer-opaque photos-filter-layer">
            <div className="touch-layer-title">
                <div className="float-right">
                    <div className="action" onClick={resetFilterState}>
                        Clear All
                    </div>
                </div>
                <div className="header">Filtering Options</div>
            </div>
            <div className="options-groups-container">
                <div className="options-group">
                    <div className="options-group-header">Collections:</div>
                    <div className="options-side-by-side">
                        <div className="option-group">
                            <div className="touch-items-container">{collectionItemsJsx}</div>
                        </div>
                        <div className="option-group margin-left">
                            <div className="label">Filtering mode:</div>
                            <TouchUIBooleanField {...collectionsModeProps} />
                        </div>
                    </div>
                </div>
                <div className="options-group">
                    <div className="options-group-header">Tags:</div>
                    <div className="options-side-by-side">
                        <div className="option-group">
                            <div className="touch-items-container">{availableTagItemsJsx}</div>
                        </div>
                        <div className="option-group">
                            <div className="option-group margin-left">
                                <div className="option-group">
                                    <div className="label">Filtering mode:</div>
                                    <TouchUIBooleanField {...tagsModeProps} />
                                </div>
                                <div className="option-group">
                                    <div className="label">Selected Tags:</div>
                                    <div
                                        className="touch-items-container"
                                        style={{ maxHeight: "151px", color: "#AA7" }}
                                        onClick={() => showKeyboard(keyboardConfigTags)}
                                    >
                                        {inputValue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="options-group">
                    <div className="options-group-header">Dates:</div>
                    <div className="options-side-by-side-wrap">
                        <div className="option-group" style={{ display: "inline-block" }}>
                            <div className="label">Include Pictures After:</div>
                            <TouchUIDateSelector
                                onChange={(newDate) => handleDateSelection("startDate", newDate)}
                                initialValue={filter.startDate}
                            />
                        </div>
                        <div className="option-group" style={{ display: "inline-block" }}>
                            <div className="label">Include Pictures Before:</div>
                            <TouchUIDateSelector
                                onChange={(newDate) => handleDateSelection("endDate", newDate)}
                                initialValue={filter.endDate}
                            />
                        </div>
                    </div>
                </div>
                <div className="options-group">
                    <div className="options-group-header">Folders:</div>
                    <div className="options-side-by-side">
                        <div className="option-group">
                            <div className="touch-items-container" style={{ maxHeight: "605px" }}>
                                {folderItemsJsx}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="actions-container">
                <div className="flex-spacer"></div>
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

function removeTagFromString(inputString, wordToRemove) {
    // Escape special characters in the word to make it safe for regular expression
    const escapedWord = wordToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create a regular expression with word boundary anchors
    const regex = new RegExp(`\\b${escapedWord}\\b`, "g");

    // Replace the matched word in the input string
    return inputString.replace(regex, "");
}


export default PhotosFilterLayer;
