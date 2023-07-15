import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4000';

// Specify websocket transport only (no polling; doesn't work with react)
console.log(io);
export const socket = io('http://johannes-mb.wnet.wn:4000', { transports: ['websocket'] });

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});