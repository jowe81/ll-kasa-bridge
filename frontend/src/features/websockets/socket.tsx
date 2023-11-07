import constants from '../../constants';

import { io } from 'socket.io-client';

const backendSocketServerUrl = `${constants.services.JJ_AUTO_BACKEND_HOST}:${constants.services.JJ_AUTO_BACKEND_PORT}`;
// Specify websocket transport only (no polling; doesn't work with react)
export const socket = io(backendSocketServerUrl, { transports: ['websocket'] });

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});