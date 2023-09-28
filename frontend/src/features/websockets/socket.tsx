import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://johannes-mb.wnet.wn:4000';

// Specify websocket transport only (no polling; doesn't work with react)
export const socket = io('http://johannes-mb.wnet.wn:4000', { transports: ['websocket'] });

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});