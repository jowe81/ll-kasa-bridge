import axios from "axios";
import constants from "../../constants.js";
import { log } from "../Log.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_WOODSTOVE];

class WoodstoveHandler {
    constructor(devicePool, device, cache) {
        this.devicePool = devicePool;
        this.device = device;
        this.cache = cache;
        this.initialized = false;
        this.refuelAlertAt = null;
        this.init();
    }

    init() {
        const url = this.device.settings?.url;
        if (!url) {
            log(`Woodstove has no url.`, this.device, "red");
            return;
        }

        const interval = this.device.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;
        log(`Polling woodstove at ${url} every ${Math.round(interval / constants.MINUTE)} minute(s).`, this.device);

        this._checkingIntervalHandler = setInterval(() => this.poll(), interval);
        this.initialized = true;
        this.poll();
    }

    async poll() {
        if (!this.initialized) {
            return;
        }

        const url = this.device.settings.url;
        const stateKey = this.device.settings.stateKey ?? "woodstoveState";
        const alertState = this.device.settings.alertState ?? localConstants.ALERT_STATE;

        try {
            const response = await axios.get(url);
            const woodstoveState = response.data?.[stateKey];

            if (typeof woodstoveState !== "string") {
                log(`Woodstove response has no string field "${stateKey}".`, this.device, "red");
                return;
            }

            this.device._updateState({
                ...this.device.state,
                woodstoveState,
                tempC: response.data?.tempC,
            });

            log(`Woodstove state: ${woodstoveState}`, this.device);

            if (woodstoveState === alertState) {
                const repeatAfter = this.device.settings.repeatAfter ?? localConstants.REPEAT_AFTER;
                const elapsed = this.refuelAlertAt == null ? null : Date.now() - this.refuelAlertAt;

                if (elapsed == null || elapsed >= repeatAfter) {
                    const audioFile = this.device.settings.audioFile ?? localConstants.AUDIO_FILE;
                    const reason = elapsed == null
                        ? `switched to "${alertState}"`
                        : `still "${alertState}" after ${Math.round(elapsed / constants.MINUTE)} minutes`;
                    log(`Woodstove ${reason}. Playing ${audioFile}.`, this.device, "yellow");
                    this.devicePool.playAudio(audioFile, `Woodstove "${alertState}" alert finished.`);
                    this.refuelAlertAt = Date.now();
                }
            } else {
                this.refuelAlertAt = null;
            }
        } catch (err) {
            log(`Woodstove poll failed: ${err.message}`, this.device, "red");
        }
    }
}

function woodstoveHandler(devicePool, device, cache) {
    return new WoodstoveHandler(devicePool, device, cache);
}

export default woodstoveHandler;
