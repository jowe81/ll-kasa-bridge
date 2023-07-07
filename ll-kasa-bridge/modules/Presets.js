import { log } from "../helpers/jUtils.js";
import { presets } from "../configuration.js";

const getPreset = presetId => presets.find(item => presetId === item.id);

export { 
  getPreset,
};