import _ from 'lodash';
import constants from '../constants.js';

const resolveDeviceDependencies = (deviceWrapper) => {
  const { globalConfig } = deviceWrapper.devicePool;

  switch (deviceWrapper.type) {
    case constants.SUBTYPE_THERMOMETER:
      break;

    // Kasa
    default:
      deviceWrapper.filters = resolveDeviceFilters(deviceWrapper, globalConfig);
      break;

  }

  deviceWrapper.groups = resolveDeviceGroups(deviceWrapper, globalConfig);
  deviceWrapper.classes = resolveDeviceClasses(deviceWrapper, globalConfig);
  
  const locationObject = resolveDeviceLocation(deviceWrapper, globalConfig);
  deviceWrapper.locationId = locationObject.id;
  deviceWrapper.location = locationObject.name;

  return deviceWrapper;
}

const resolveDeviceFilters = (deviceWrapper, globalConfig) => {
  const resolvedDeviceFilters = [];

  if (Array.isArray(deviceWrapper.filters)) {
    deviceWrapper.filters.forEach(deviceFilterObject => {
      const thisResolvedFilter = resolveDeviceFilterObject(deviceFilterObject, deviceWrapper, globalConfig);

      if (thisResolvedFilter !== null) {
        resolvedDeviceFilters.push(thisResolvedFilter);
      }
    })
  }

  return resolvedDeviceFilters;
}

/**
* Take a filter definition from a device and, if it references a globally defined filter,
* resolve the reference and return the full definition.
*/
const resolveDeviceFilterObject = (deviceFilterObject, deviceWrapper, globalConfig) => {

  // If there is no refId, return the object as is.
  if (!deviceFilterObject.refId) {
    return deviceFilterObject;
  }

  // Resolve the reference
  const referencedFilter = globalConfig.filters.find(filter => filter.id === deviceFilterObject.refId);

  // Did it resolve?
  if (!referencedFilter) {
    log(`Failed to resolve filter reference: ${JSON.stringify(deviceFilterObject)}`, deviceWrapper, 'red');
    return null;
  }

  // Apply any overwrites from the device definition.
  const resolvedFilter = _.cloneDeep(referencedFilter);

  const mergedResolvedFilter = _.merge(
    resolvedFilter, 
    deviceFilterObject,
  );

  if (!mergedResolvedFilter.pluginName) {
    log(`Filter configuration is incomplete: ${JSON.stringify(deviceFilterObject)}. Must specify a valid pluginName.`, deviceWrapper, 'red');
    return null;
  }

  if (!mergedResolvedFilter.globalLabel) {
    mergedResolvedFilter.globalLabel = mergedResolvedFilter.pluginName;
  }

  if (!resolvedFilter.label) {
    mergedResolvedFilter.label = mergedResolvedFilter.globalLabel;
  }

  return mergedResolvedFilter;
};


/**
 * Return an array of group ids that this channel belongs to
 */
const resolveDeviceGroups = (deviceWrapper, globalConfig) => {
  const channel = deviceWrapper.channel;
  const groupDefinitions = globalConfig.groups;

  if (!Array.isArray(groupDefinitions)) {
    return [];
  }

  const groups = groupDefinitions
    .map(groupDefinition => {
      if (Array.isArray(groupDefinition.channels)) {
        if (groupDefinition.channels.includes(channel)) {
          return groupDefinition.id;
        };
      }

      return null;
    }).filter(item => item);

  return groups;
}

/**
 * Return an array of class identifiers.
 */
const resolveDeviceClasses = (deviceWrapper, globalConfig) => {
  // Start with the class field on the deviceWrapper.
  let resolvedDeviceClasses = resolveClassValue(deviceWrapper.class, globalConfig.classTree ?? {});

  // Add class(es) defined on groups that this device belongs to.
  deviceWrapper.groups.forEach(groupId => {
    const group = globalConfig.groups.find(item => item.id === groupId);
    const classesOnGroup = resolveClassValue(group.class, globalConfig.classTree ?? {});

    resolvedDeviceClasses = [
      ...resolvedDeviceClasses,
      ...classesOnGroup,
    ]
  });

  return resolvedDeviceClasses;  
}

/**
 * Class may be specified as a string (single) or an array (multiple)
 * on a device configuration.
*/
const resolveClassValue = (value, classTree) => {

  if (!(typeof value === 'string' || Array.isArray(value))) {
    return [];
  }

  let classNames = [];  
  let classNamesDirect = [];

  if (typeof value === 'string') {
    classNamesDirect = [ value ];
  }

  if (Array.isArray(value)) {
    classNamesDirect = [ ...value ];
  }
  
  classNamesDirect.forEach(className => {
    const searchData = {
      ancestors: [],
      found: false,
    }

    getParentClassNames(className, classTree, searchData);

    if (searchData.found) {
      classNames = [
        ...classNames,
        ...searchData.ancestors, 
        className,          
      ];    
    }
  });

  return classNames;
}

/**
 * Get a list of parent classes of className.
 * (Recursion & backtracking.)
 */
const getParentClassNames = (className, classTree, searchData) => {
  if (searchData.found) {
    return;
  }
  
  const children = Object.keys(classTree);
  if (!children.length) {
    // No descendants - step back
    searchData.ancestors.pop();    
    return;
  }
  
  // Iterate over the children
  children.every(key => {
    if (key === className) {            
      // Found the search name      
      searchData.found = true;      
      return false;
    }

    // This key doesn't match the class name, store the path and descend.
    searchData.ancestors.push(key);    
    getParentClassNames(className, classTree[key], searchData)
    
    return !searchData.found; // Continue the loop if not found
  })

  if (!searchData.found) {
    // Path exhausted - step back.
    searchData.ancestors.pop();
  }
}

const resolveDeviceLocation = (deviceWrapper, globalConfig) => {
  let locationId = deviceWrapper.locationId ?? constants.DEVICE_DEFAULT_LOCATION_ID;

  if (!findLocation(globalConfig.locations, locationId)) {
    // A location id was configured but it's invalid (no matching entry in config)
    locationId = constants.DEVICE_DEFAULT_LOCATION_ID;
  }

  const locationObject = findLocation(globalConfig.locations, locationId);

  return locationObject;
}

const findLocation = (locations, locationId) => {
  const locationObject = locations.find(item => item.id === locationId);
  return locationObject;
}

export { 
  resolveDeviceDependencies 
}