import { useState } from "react";
import { getChoresService, runServiceCommand } from "../../../devicesHelpers";
import { isToday } from '../calendar/calendarHelpers';

import "./chores.scss";

function Chores({ dynformsUserId }) {
    const [selectedChore, setSelectedChore] = useState(null);

    const service = getChoresService();
    if (!service) {
        console.warn("Chores Service not found.");
        return null;
    }

    const choresInfo = getChoresInfo(service, dynformsUserId);
    const { user, chores } = choresInfo;
    const records = getRecords(service, user);

    if (selectedChore && selectedChore.user !== user.id) {
        setSelectedChore(null)
    }

    function toggleChore(chore) {
        runServiceCommand(service, "toggleChore", { choreId: chore.id, dynformsUserId: user.id });
    }

    function handleChoreButtonClick(event, chore) {
        const rect = event.target.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        if (event.clientX < center) {
            // Tap on left side of button
            toggleChore(chore);
        } else {
            // Tap on right side of button
            setSelectedChore(chore);
        }
    };

    const choresButtonsJsx = chores.map((chore, index) => {
        const classDone = choreDoneToday(user, chore, records) ? `chore-button-done` : ``
        return (
            <div
                key={index}
                className={`base-button chore-button ${classDone}`}
                onClick={(event) => handleChoreButtonClick(event, chore)}
            >
                {chore.label}
            </div>
        );
    });

    return (
        <div className="chores-container">
            <div className="chores-header">{user.name} Chores</div>
            {!selectedChore && <div className="chores-items-container">{choresButtonsJsx}</div>}
            {selectedChore && (
                <div className="chores-selected-chore-container">
                    <div className="chores-selected-top-container">
                        <div className={"chores-selected-info-container " + (choreDoneToday(user, selectedChore, records) ? `chore-button-done` : ``)} onClick={() => toggleChore(selectedChore)}>
                            <div className={selectedChore.description ? "chores-selected-label" : "chores-selected-label-big"}>{selectedChore.label}</div>
                            <div className="chores-selected-description">{selectedChore.description}</div>
                        </div>
                        <div className="chores-selected-back-button" onClick={() => setSelectedChore(null)}>
                            back
                        </div>
                    </div>
                    <div className="chores-selected-main-container"></div>
                </div>
            )}
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