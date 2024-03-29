import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import dataSliceReducer from '../features/TouchUiMain/devices/dataSlice';
import configSliceReducer from '../features/TouchUiMain/devices/configSlice';
import localStateSliceReducer from '../features/localState/localStateSlice';

import { apiSlice } from '../features/TouchUiMain/devices/jjautoApiSlice';

export const store = configureStore({
    //calls combineReducers
    reducer: { 
        data: dataSliceReducer,
        config: configSliceReducer,
        localState: localStateSliceReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().concat(apiSlice.middleware);
    } 

});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;