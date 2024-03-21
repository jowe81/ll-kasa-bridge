import { getChoresService, runServiceCommand } from "../../../devicesHelpers";
import { isToday } from '../calendar/calendarHelpers';
import "./chores.scss";

function Chores({ dynformsUserId }) {
    const service = getChoresService();
    if (!service) {
        console.warn("Chores Service not found.");
        return null;
    }

    const choresInfo = getChoresInfo(service, dynformsUserId);
    const { user, chores } = choresInfo;
    const records = getRecords(service, user);

    function toggleChore(chore) {
        runServiceCommand(service, "toggleChore", { choreId: chore.id, dynformsUserId: user.id });
    }

    const choresButtonsJsx = chores.map((chore, index) => {
        const classDone = choreDoneToday(user, chore, records) ? `chore-button-done` : ``
        return (
            <div key={index} className={`base-button chore-button ${classDone}`} onClick={() => toggleChore(chore)}>
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


function getChoresInfo(choresService, dynformsUserId) {
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
        chores: chores
            .filter((chore) => chore.user === dynformsUserId)
            .sort((a, b) => (a.label > b.label ? 1 : -1)),
    };
}

function getRecords(choresService, user) {
    let records = [];    
    if (choresService.state?.requests && choresService.state.requests[0]) {
        if (choresService.state.requests[0][user.id]) {
            records = choresService.state.requests[0][user.id].records;
        }
    }
    return records;
}

function choreDoneToday(user, chore, records) {
    if (!user || !chore || !records) {
        return null;
    }

    return records.find(record => isToday(new Date(record.created_at)) && record.chore?.id === chore.id && record.__user.id === user.id);
}

export default Chores