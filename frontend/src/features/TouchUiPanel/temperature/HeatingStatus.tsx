import "./temperature.css";
import constants from "../../../constants.ts";
import { useAppSelector } from "../../../app/hooks.ts";
import { Device } from "../../TouchUiMain/devices/dataSlice.ts";

const WOODSTOVE_COLORS: Record<string, string> = {
    off: "#777777",
    warmup: "#FFAA66",
    running: "#99FF99",
    refuel: "#FFAA33",
    cooldown: "#9999FF",
};

function HeatingStatus() {
    const devices = useAppSelector((state) => state.data.devices);
    const woodstove = devices.find((device) => device.channel === constants.touchPanel.woodstoveChannel);
    const furnace = devices.find((device) => device.channel === constants.touchPanel.furnaceChannel);

    return (
        <div className="touch-ui-panel-item">
            <div className="fullscreen-panel-temperature">
                <StatusSlot label="Woodstove" value={formatWoodstoveState(woodstove)} color={woodstoveColor(woodstove)} />
                <StatusSlot label="Furnace" value={formatFurnaceState(furnace)} color={furnaceColor(furnace)} />
            </div>
        </div>
    );
}

function StatusSlot({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="temperature-subpanel heating-status-subpanel">
            <div className="thermometer-extradata-container">
                <div className="thermometer-label">{label}</div>
            </div>
            <div className="thermometer-temp-container">
                <div className="heating-status-value" style={{ color }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function formatWoodstoveState(device: Device | undefined) {
    const state = device?.state?.woodstoveState;
    if (typeof state !== "string" || !state) {
        return "N/A";
    }
    return state.charAt(0).toUpperCase() + state.slice(1);
}

function woodstoveColor(device: Device | undefined) {
    const state = device?.state?.woodstoveState;
    return WOODSTOVE_COLORS[state] ?? "#999999";
}

function formatFurnaceState(device: Device | undefined) {
    if (typeof device?.state?.isOn !== "boolean") {
        return "N/A";
    }
    return device.state.isOn ? "On" : "Off";
}

function furnaceColor(device: Device | undefined) {
    if (device?.state?.isOn === true) {
        return "#99FF99";
    }
    if (device?.state?.isOn === false) {
        return "#777777";
    }
    return "#999999";
}

export default HeatingStatus;
