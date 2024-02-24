import React from 'react'
import { getChoresService, runServiceCommand } from "../../../devicesHelpers";
import { getDynformsServiceRecords } from '../../../dynformsHelpers';
import './chores.scss';

function Chores({ dynformsUserId }) {
    const service = getChoresService();
    if (!service) {
        console.warn("Chores Service not found.");
        return null;
    }

    function getChoresInfo(choresService, dynformsUserId) {
        const records = getDynformsServiceRecords(choresService.channel, 0, false);
        const choresInfo = choresService?.state?.settings.custom;

        if (!choresInfo || !dynformsUserId) {
            return [];
        }

        const { users, chores } = choresInfo;

        if (!users || !chores) {
            return [];
        }
        return {
            user: users.find((user) => user.id === dynformsUserId),
            chores: chores.filter((chore) => chore.user === dynformsUserId).sort((a, b) => a.label > b.label ? 1 : -1),
        }
    }

    const choresInfo = getChoresInfo(service, dynformsUserId);
    const { user, chores } = choresInfo;

    function doChore(chore) {
        runServiceCommand(service, "doChore", { chore, dynformsUsername: user.name });
    }

    const choresButtonsJsx = chores.map((chore, index) => {
        return (
            <div key={index} className="base-button chore-button" onClick={() => doChore(chore)}>
                {chore.label}
            </div>
        );
    });

    return (
        <div className="chores-container">
            <div className="chores-header">{user.name} Chores</div>
            <div className="chores-items-container">{choresButtonsJsx}</div>
        </div>
    );
}

export default Chores