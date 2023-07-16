import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import jjAutoSliceReducer from '../features/devices/jjAutoSlice';
import { apiSlice } from '../features/devices/jjautoApiSlice';

export const store = configureStore({
    //calls combineReducers
    reducer: { 
        jjAuto: jjAutoSliceReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().concat(apiSlice.middleware);
    } 

});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;