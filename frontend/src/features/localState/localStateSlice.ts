import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PowerState {
    value: boolean | null | undefined;
}

const initialState: PowerState = { value: null };

const localStateSlice = createSlice({
    name: 'localState',
    initialState,
    reducers: {
        toggled(state) {
            // Redux toolkit (immer) makes it ok to do this
            if (true || typeof state.value === 'boolean') {
                state.value = !state.value;
            }
        },
    }
})

export const { toggled } = localStateSlice.actions;
export default localStateSlice.reducer;