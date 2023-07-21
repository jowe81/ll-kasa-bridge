import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Group {
  id: string;
  name: string;
  channels: number[];
  class: string | string[];
  displayLabel?: string;
  display?: boolean;
  filters: object[];
  linkedDevices: object[];
}

export interface Location {
  id: string;
  name: string;
}

export interface Config {
  groups: Group[];
  locations: Location[];
}

const initialState: Config = {
  groups: [],
  locations: [],
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {      
    // Add an array of devices.
    groupsAdded(config, action: PayloadAction<Group[]>) {
      console.log('received groups', action.payload);
      action.payload.forEach(group => addGroup(config.groups, group));
    },
    // Add an array of locations.
    locationsAdded(config, action: PayloadAction<Location[]>) {
      console.log('received locations', action.payload);
      action.payload.forEach(location => addLocation(config.locations, location));
    },
  }
});

const addGroup = (groups: Group[], addedGroup: Group) => {
  const groupKey = getGroupKeyById(groups, addedGroup.id);

  if (groupKey !== null) {
    // Group exists, overwrite.
    groups[groupKey] = addedGroup;
  } else {
    // Group is not in the list; add it.
    groups.push(addedGroup);
  }
}

const getGroupKeyById = ((groups: Group[], id: string): number | null => {
  let groupKey: number | null = null;

  Object.keys(groups).every((group, key) => {
    if (groups[key].id !== id) {
      return true;
    }

    groupKey = key;
    return false;
  })

  return groupKey;
})

const addLocation = (locations: Location[], addedLocation: Location) => {
  const locationKey = getItemKeyById(locations, addedLocation.id);

  if (locationKey !== null) {
    // Location exists, overwrite.
    locations[locationKey] = addedLocation;
  } else {
    // Location is not in the list; add it.
    locations.push(addedLocation);
  }
}

const getItemKeyById = ((items: Group[] | Location[], id: string): number | null => {
  let itemKey: number | null = null;

  Object.keys(items).every((item, key) => {
    if (items[key].id !== id) {
      return true;
    }

    itemKey = key;
    return false;
  })

  return itemKey;
})


export const { 
  groupsAdded,
  locationsAdded,
} = configSlice.actions;

export default configSlice.reducer;