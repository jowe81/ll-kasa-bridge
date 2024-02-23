import {
    getCustomCollectionLabels,
    getDefaultCollectionsJsx,
    getCustomCollectionsJsx,
    getLibraryInfo,
    getLatestOps,
} from "./photosHelpers.tsx";
import TouchUIBooleanField from "./TouchUIBooleanField";
import TouchUIDateSelector from "./TouchUIDateSelector";
import { useEffect } from "react";
import { useScreenKeyboard } from "../../contexts/ScreenKeyboardContext";
import { useAppSelector, useAppDispatch } from "./../../app/hooks.ts";
import { photosFilterLayerStateChanged, initialState } from "../localState/localStateSlice";

import "./../TouchUiMain/calendar/calendarHelpers";
import "./photosFilterLayer.scss";

function PhotosFilterLayer({ setPhotosServiceFilter, hideChangeFilterLayer, uiInfo, photosService }) {
    // State management
    const dispatch = useAppDispatch();
    const photosFilterLayerState = useAppSelector((state) => state.localState.photosFilterLayer);
    const { filter } = photosFilterLayerState;
    const updateState = (path, payload) =>
        dispatch(photosFilterLayerStateChanged({ ...photosFilterLayerState, [path]: payload }));
    const _setFilter = (payload) => updateState("filter", payload);
    const setFilter = (filter) => {
        _setFilter({ ...filter });
        setInputValue(filter.tags.join(" "));
    };

    const clearedFilterState = initialState.photosFilterLayer.filter;
    function resetFilterState() {
        setFilter({ ...clearedFilterState });
    }

    const libraryInfo = getLibraryInfo(photosService);
    const latestOps = getLatestOps(photosService);
    const defaultFilter = initialState.photosFilterLayer.filter;

    // Make sure to update the filter if a remote change comes in.
    useEffect(() => {
        console.log("Currenet filter", latestOps);
        setFilter({
            ...filter,
            ...uiInfo?.filter,
        });
        setInputValue(filter.tags.join(" "));
    }, [uiInfo?.filter]);

    // Clear the select tags text when opening the dialog.
    useEffect(() => {
        setInputValue(filter.tags.join(" "));
    }, []);
    const { showKeyboard, inputValue, setInputValue } = useScreenKeyboard();

    function addRemoveTagFromInput(tag) {
        let newInputValue = "";

        if (splitTags(inputValue).includes(tag)) {
            newInputValue = removeTagFromString(inputValue, tag);
            console.log(`Removing ${tag}`);
        } else {
            newInputValue = inputValue.trim() + " " + tag;
            console.log(`Adding ${tag}`);
        }

        setInputValue(newInputValue);
        setFilter({ ...filter, tags: splitTags(newInputValue), folders: [] });
    }

    function addRemoveCollectionFromFilter(collectionName) {
        let newCollections;

        // If 'unsorted':
        if (collectionName === "unsorted") {
            newCollections = ['unsorted'];
        } else if (collectionName === "trashed") {
            newCollections = ["trashed"];
        } else if (collectionName === "general") {
            newCollections = ["general"];
        } else {            
            newCollections = filter.collections.includes("trashed") ? [] : [...filter.collections];

            if (newCollections.includes('general')) {
                // Were on general but clicked something else; remove general from the filter
                newCollections = newCollections.filter(collection => collection !== 'general');
            }

            if (filter.collections.includes(collectionName)) {
                newCollections = newCollections.filter((collection) => collection !== collectionName);
            } else {
                newCollections.push(collectionName);
            }

            if (!newCollections.length) {
                // Nothing left - default to general.
                newCollections = ['general'];
            }
        }

        setFilter({ ...filter, collections: newCollections, folders: [] });
    }

    function addRemoveFolderFromFilter(folderInfo: any) {
        let newFolders: string[] = [];
        if (filter.folders) {
            if (filter.folders.includes(folderInfo.item)) {
                newFolders = filter.folders.filter((item) => item != folderInfo.item);
            } else {
                // Add this folder.
                newFolders = [...filter.folders, folderInfo.item];
            }
        } else {
            newFolders = [folderInfo.item as string];
        }

        if (newFolders.length) {
            setFilter({ ...defaultFilter, collections:['general', 'unsorted'], folders: newFolders });        
        } else {
            setFilter({ ...filter, folders: newFolders });
        }
    }

    const keyboardConfigTags = {
        fieldLabel: "Tags to filter by:",
        instructions: "Use spaces to separate multiple tags.",
        value: filter.tags?.join(" "),
        onClose: (value) => setFilter({ ...filter, tags: splitTags(value) }),
    };

    const defaultCollectionsJsx = getDefaultCollectionsJsx(
        photosService,
        filter.collections,
        addRemoveCollectionFromFilter,
        true, // Include unsorted
        true, // Include general
    );

    const collectionItemsJsx = getCustomCollectionsJsx(
        photosService,
        filter.collections,
        addRemoveCollectionFromFilter,
    );

    const filterModeProps: any = {
        labelTrue: "All",
        labelFalse: "Any",
        valueTrue: "$all",
        valueFalse: "$in",
    };

    const collectionsModeProps: any = {
        ...filterModeProps,
        handleClick: (value) => {
            setFilter({ ...filter, mode_collections: value });
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

    const availableTags = getItemsInfoSelectedFirst("tags");
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

    const folders = getItemsInfoSelectedFirst("folders");
    const folderItemsJsx = folders?.map((folderInfo, index) => {
        const label = folderInfo.label;
        return (
            <div
                key={index}
                className={`touch-item align-left ${filter.folders?.includes(folderInfo.item) ? "touch-item-selected" : ""}`}
                onClick={() => addRemoveFolderFromFilter(folderInfo)}
            >
                {label} <span className="touch-item-info">{folderInfo.count}</span>
                <div className="tiny text-gray">{folderInfo.long}</div>
            </div>
        );
    });

    /**
     * Sort the array of itemsInfos such that selected items show up first.
     * For tags, collections, folders.
     */
    function getItemsInfoSelectedFirst(arrayPropertyName) {
        const selectedItems = filter[arrayPropertyName] ?? [];
        const selectedItemsInfo = libraryInfo[arrayPropertyName].filter((info) => selectedItems.includes(info.item));
        const otherItemsInfo = libraryInfo[arrayPropertyName].filter((info) => !selectedItems.includes(info.item));

        return [...selectedItemsInfo, ...otherItemsInfo];
    }

    function handleDateSelection(property, newDate) {
        console.log(`New ${property}:`, newDate);
        const newFilter = {
            ...filter,
            [property]: newDate,
            folders: [],
        };
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
                            <div className="touch-items-container">{defaultCollectionsJsx}</div>
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
                <div
                    className="action"
                    onClick={() => {
                        setPhotosServiceFilter(filter);
                        hideChangeFilterLayer();
                    }}
                >
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
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((tag) => tag);

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
