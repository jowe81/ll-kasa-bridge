import axios from "axios";
import constants from "../../constants.js";
import { log } from "../Log.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_FURNACE];

class FurnaceHandler {
    constructor(devicePool, device, cache) {
        this.devicePool = devicePool;
        this.device = device;
        this.cache = cache;
        this.initialized = false;
        this.lastIsOn = undefined;
        this.init();
    }

    init() {
        const url = this.device.settings?.url;
        if (!url) {
            log(`Furnace has no url.`, this.device, "red");
            return;
        }

        const interval = this.device.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;
        log(`Polling furnace at ${url} every ${Math.round(interval / constants.SECOND)} seconds.`, this.device);

        this._checkingIntervalHandler = setInterval(() => this.poll(), interval);
        this.initialized = true;
        this.poll();
    }

    async poll() {
        if (!this.initialized) {
            return;
        }

        try {
            const response = await axios.get(this.device.settings.url);
            const isOn = response.data?.isOn;

            if (typeof isOn !== "boolean") {
                log(`Furnace response has no boolean isOn.`, this.device, "red");
                return;
            }

            if (this.lastIsOn !== isOn) {
                log(`Furnace is ${isOn ? "on" : "off"}.`, this.device);
                this.lastIsOn = isOn;
            }

            this.device._updateState({
                ...this.device.state,
                isOn,
            });
        } catch (err) {
            log(`Furnace poll failed: ${err.message}`, this.device, "red");
        }
    }
}

function furnaceHandler(devicePool, device, cache) {
    return new FurnaceHandler(devicePool, device, cache);
}

export default furnaceHandler;
