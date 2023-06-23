import _ from 'lodash';

const resolveDeviceDependencies = (deviceWrapper) => {
  const { globalConfig } = deviceWrapper.devicePool;
  deviceWrapper.filters = resolveDeviceFilters(deviceWrapper, globalConfig);
  deviceWrapper.groups = resolveDeviceGroups(deviceWrapper, globalConfig);
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

export { 
  resolveDeviceDependencies 
}