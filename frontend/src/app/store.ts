import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import localStateReducer from '../features/localState/localStateSlice';
import { apiSlice } from '../features/devices/jjautoApiSlice';

export const store = configureStore({
    //calls combineReducers
    reducer: { 
        localState: localStateReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware().concat(apiSlice.middleware);
    } 

});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;