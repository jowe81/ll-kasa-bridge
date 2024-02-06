import React from 'react'
import { getChoresService, runServiceCommand } from "../../../devicesHelpers";
import { getDynformsServiceRecords } from '../../../dynformsHelpers';
import './chores.scss';

function Chores({dynformsUsername, chores}) {

    const service = getChoresService();
    if (!service) {
        console.warn('Chores Service not found.');
        return null;
    }

    const records = getDynformsServiceRecords(service.channel);

    if (!chores) {
        chores = ["vitamins", "weights", "cardio"];
    } 

    function doChore(chore) {
        runServiceCommand(service, "doChore", { chore, dynformsUsername });
    }

    const choresButtonsJsx = chores.map((chore, index) => {
        return (
            <div key={index} className="base-button chore-button" onClick={() => doChore(chore)}>{chore}</div>
        );
    });

    return (
        <div className="chores-container">
            <div className="chores-header">{dynformsUsername} Chores</div>
            <div className="chores-items-container">{choresButtonsJsx}</div>
        </div>
    );        
}

export default Chores