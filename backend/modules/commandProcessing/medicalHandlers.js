/**
 * These are handlers used by the medical service
 */
import _ from "lodash";
import { log } from "../../modules/Log.js";
import { createAlert } from "../../helpers/dynformsData.js";

function _getAlerts(deviceWrapper, displayData, requestIndex) {
    const currentAlerts = deviceWrapper.state.alerts ?? [];

    const alerts = [];
    const latestRecord = getLatestRecord(displayData?.data?.records);
    if (!latestRecord) {
        alerts.push(createAlert("Medical Data unavailable.", "critical", deviceWrapper));
    }

    const { warnAfter, alertAfter } = deviceWrapper.settings.ui;

    const createdAt = new Date(latestRecord.created_at);
    if (isNaN(createdAt.getTime())) {
        alerts.push(createAlert("Last record appears corrupt.", "critical", deviceWrapper));
    } else {
        const tsNow = new Date().getTime();
        const tsLastSample = createdAt.getTime();
        if (tsNow - tsLastSample > alertAfter) {
            alerts.push(createAlert("Blood pressure sample overdue!", "alert", deviceWrapper));
        } else if (tsNow - tsLastSample > warnAfter) {
            alerts.push(createAlert("Blood pressure sample is due!", "warn", deviceWrapper));
        }
    }

    return alerts;
}

function _processApiResponse(deviceWrapper, displayData, requestIndex) {
    const cache = deviceWrapper.getCache();
    return displayData;
}

function getLatestRecord(records) {    
    // These are sorted by created_at, the last one in the array will be the latest one.
    if (!Array.isArray(records)) {
        return null;
    }

    if (records.length) {
        return records[records.length - 1];
    }
    return null;
}

const handlers = {
    _processApiResponse, // Not for frontend use!
    _getAlerts,
};

export default handlers;
