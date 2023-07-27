import { useState, useEffect } from 'react';
import { Group } from './dataSlice.ts';

const TouchButtonGroup = (props) => {

  const group: Group = props.group;
  const onClick: Function = props.onClick;

  const [isPending, setIsPending] = useState(false);
  const [powerState, setPowerState] = useState<boolean | null | undefined>(null);


  const bgIconClass = `icon-${group.displayType ?? 'none'}`;

  const groupPowerState = getPowerStateForLiveGroup(group);
  const powerStateClass = getPowerStateClassForLiveGroup(group);

  const handleClick = (e) => {
    setIsPending(true);    
    onClick(e);
  }

  useEffect(() => {
    setPowerState(groupPowerState);

    if ((typeof powerState === 'boolean') && (powerState !== groupPowerState)) {
      setIsPending(false);
    }  
  }, [group])

  if (group.id === 'group-bedroomDeskLights') console.log(`Rendering group ${group.name}`, powerState, groupPowerState, powerStateClass);

  let html = <></>;

  if (isPending) {
    html = <div className='device-meta'>Pending...</div>;
  } else {
    html = (
      <>
        <div className='device-meta'>
          { group.liveState?.notDiscoveredCount }/{ group.liveState?.onlineCount }/{ group.liveState?.discoveredCount }
          <div className='device-online-state'>
          { group.displayLabel ?? group.name }
          </div>
        </div>
        <div className='device-alias'>
        </div>                                                  
      </>
    );
  }

  return (
    <div 
      className={`group-button ${bgIconClass} powerstate-toggle-button powerstate-toggle-button-small ${!isPending && powerStateClass }`}
      data-device-group-id={group.id} 
      onClick={handleClick}
    >
      {html}                            
    </div> 
  )
}

const getPowerStateDataForLiveGroup = (group: Group): { state: boolean | null | undefined ; class: string; } => {
  const { liveState } = group;

  if (liveState) {
    if (liveState.discoveredCount > 0) {
      // Have data for one or more devices

      if (liveState.powerOnCount === liveState.discoveredCount) {
        // All powered on
        return { state: true, class: 'power-on' };
      }
  
      if (liveState.powerOnCount === 0) {
        // All powered off
        return { state: false, class: 'power-off' };
      }
  
      // Some powered on, some powered off
      return { state: undefined, class: 'power-mixed' };

    } else {
      // None of the devices were discovered
      return { state: null, class: 'power-not-available' };
    }
  }

  return { state: null, class: 'power-not-available' };
}

const getPowerStateClassForLiveGroup = (group: Group): string => {
  const data = getPowerStateDataForLiveGroup(group);
  return data.class;
}

const getPowerStateForLiveGroup = (group: Group): boolean | null | undefined => {
  const data = getPowerStateDataForLiveGroup(group);
  return data.state;
}

export default TouchButtonGroup;