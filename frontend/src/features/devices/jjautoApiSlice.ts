import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://johannes-mb.wnet.wn:3000/auto',
    }),
    endpoints(builder) {
        return {
            fetchDevices: builder.query<any[], number|void> ({ 
                query() {
                    return `/devices`;
                }
            }),
        }
    },
})

export const { useFetchDevicesQuery } = apiSlice;