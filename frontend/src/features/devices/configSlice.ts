import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Group {
  id: string;
  name: string;
  channels: number[];
  class: string | string[];
  filters: object[];
  linkedDevices: object[];
}

export interface Config {
  groups: Group[];      
}

const initialState: Config = {
  groups: []
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {      
    // Add an array of devices.
    groupsAdded(config, action: PayloadAction<Group[]>) {
      console.log('action is runnin');
      action.payload.forEach(group => addGroup(config.groups, group));
    },
  }
});

const addGroup = (groups: Group[], addedGroup: Group) => {
  const groupKey = getGroupKeyById(groups, addedGroup.id);

  if (groupKey !== null) {
    // Group exists, overwrite.
    groups[groupKey] = addedGroup;
  } else {
    // Device is not in the list; add it.
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

export const { 
  groupsAdded,  
} = configSlice.actions;

export default configSlice.reducer;