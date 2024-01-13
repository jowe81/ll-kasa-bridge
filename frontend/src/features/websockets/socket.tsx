import constants from "../../constants";

import { io } from "socket.io-client";

const backendSocketServerUrl = `${constants.services.JJ_AUTO_BACKEND_HOST}:${constants.services.JJ_AUTO_BACKEND_PORT}`;
// Specify websocket transport only (no polling; doesn't work with react)
export const socket = io(backendSocketServerUrl, { transports: ["websocket"] });

socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
});

function toggleChannel(channel) {
    if (channel) {
        socket.emit("auto/command/macro", {
            targetType: "channel",
            targetId: parseInt(channel),
            macroName: "toggleChannel",
        });
    }
}

function toggleGroup(groupId) {
    if (groupId) {
        socket.emit("auto/command/macro", {
            targetType: "group",
            targetId: groupId,
            macroName: "toggleGroup",
        });
    }
};

function setTimer(timer) {
    console.log("Scheduling timer:", timer);
    socket.emit("auto/command/setTimer", timer);    
}

function cancelTimer(liveTimerId) {
    console.log("Cancelling timer:", liveTimerId);
    socket.emit("auto/command/cancelTimer", liveTimerId);
}

function setTimerFor(ms) {
    socket.emit("auto/command/setTimerFor", ms);    
}

function nudgeLiveTimer(liveTimerId, step) {
    console.log(`Nudging ${liveTimerId} by ${step}`);
    socket.emit("auto/command/nudgeTimer", { liveTimerId, step });
}

export {
    toggleChannel,
    toggleGroup,
    setTimer,
    setTimerFor,
    cancelTimer,
    nudgeLiveTimer,
}