import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import devicesSliceReducer from '../features/devices/devicesSlice';
import configSliceReducer from '../features/devices/configSlice';
import { apiSlice } from '../features/devices/jjautoApiSlice';

export const store = configureStore({
    //calls combineReducers
    reducer: { 
        devices: devicesSliceReducer,
        config: configSliceReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().concat(apiSlice.middleware);
    } 

});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;