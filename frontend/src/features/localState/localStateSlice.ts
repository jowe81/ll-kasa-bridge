import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocalState {
    photosTouchLayer: any;
    photosFilterLayer: any;
}

const initialState: LocalState = {
    photosTouchLayer: {},
    photosFilterLayer: {
        filter: {
            collections: [],
            tags: [],
            mode_collections: "$in",
            mode_tags: "$in",
            startDate: {
                // Default to the beginning of the current year
                year: new Date().getFullYear(),
                month: 1,
                date: 1,
                enabled: false,
            },
            endDate: {
                // Default to the current date
                enabled: false,
            },

            folders: [],
        },
    },
};

const localStateSlice = createSlice({
    name: "localState",
    initialState,
    reducers: {
        photosTouchLayerStateChanged(localState, action: PayloadAction<any>) {
            localState.photosTouchLayer = action.payload;
        },
        photosFilterLayerStateChanged(localState, action: PayloadAction<any>) {
            localState.photosFilterLayer = action.payload;
        },
    },
});

export const { photosTouchLayerStateChanged, photosFilterLayerStateChanged } = localStateSlice.actions;
export { initialState };
export default localStateSlice.reducer;