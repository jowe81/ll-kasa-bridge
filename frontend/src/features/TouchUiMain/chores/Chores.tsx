import { useState } from "react";
import { getChoresService, runServiceCommand } from "../../../devicesHelpers";
import { isToday } from '../calendar/calendarHelpers';
import Graph from "./Graph";
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
        const rightQuarter = rect.left + rect.width / 4 * 3;
        if (chore.id !== "__weight" && event.clientX < rightQuarter) {
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
                className={`base-button chore-button ${classDone} ${chore.id === "__weight" ? "chore-readonly" : ""}`}
                onClick={(event) => handleChoreButtonClick(event, chore)}
            >
                {chore.label}
            </div>
        );
    });

    const usersGraphData = prepareStatsForGraph(service, [user]);
    addInWeightGraphData(usersGraphData, service, user);

    let dataset
    let limitYRange = selectedChore?.id === "__weight" ? true : false;

    if (selectedChore) {
        dataset = usersGraphData ? usersGraphData[user.id][selectedChore?.id] : null;                
    }
    

    return (
        <div className="chores-container">
            <div className="chores-header">{user.name} Chores</div>
            {!selectedChore && <div className="chores-items-container">{choresButtonsJsx}</div>}
            {selectedChore && (
                <div className="chores-selected-chore-container">
                    <div className="chores-selected-top-container">
                        <div
                            className={
                                "chores-selected-info-container " +
                                (choreDoneToday(user, selectedChore, records) ? `chore-button-done` : ``)
                            }
                            onClick={() => toggleChore(selectedChore)}
                        >
                            <div
                                className={
                                    selectedChore.description ? "chores-selected-label" : "chores-selected-label-big"
                                }
                            >
                                {selectedChore.label}
                            </div>
                            <div className="chores-selected-description">{selectedChore.description}</div>
                        </div>
                        <div className="chores-selected-back-button" onClick={() => setSelectedChore(null)}>
                            back
                        </div>
                    </div>
                    <div className="chores-selected-main-container">
                        <Graph dataset={dataset} limitYRange={limitYRange}/>
                    </div>
                </div>
            )}
        </div>
    );
}


function getChoresInfo(choresService, dynformsUserId) {
    const choresInfo = choresService?.state?.settings?.custom;

    if (!choresInfo || !dynformsUserId) {
        return [];
    }

    let { users, chores } = choresInfo;

    if (!users || !chores) {
        return [];
    }

    chores = chores.filter((chore) => chore.user === dynformsUserId).sort((a, b) => (a.label > b.label ? 1 : -1));
    chores.push({
        "id": "__weight",
        "label": "weight tracking",
        "description": "weight tracking",
        "user": dynformsUserId,
    });

    return {
        user: users.find((user) => user.id === dynformsUserId),
        chores,
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

function addInWeightGraphData(usersGraphData, service, user) {
    const usersRawData = {
        johannes: service.state?.requests ? service.state.requests[4] : null,
        jess: service.state?.requests ? service.state.requests[5] : null,
    };

    if (!Array.isArray(usersRawData[user.id])) {
        return;
    }
    const records = usersRawData[user.id];

    const graphData = [];

    records.forEach((record) => {
        graphData.push({
            label: record._id.week,
            x: record._id.week,
            y: record.lbs,
            order: `${record._id.year}-${record._id.week.toString().padStart(2, "0")}`,
        });
    });

    usersGraphData[user.id]['__weight'] = graphData;    
}

function prepareStatsForGraph(service, users) {
    const data = service.state?.requests ? service.state.requests[3] : null;
    if (!data) {
        return null;
    }

    const aggregationRecords = data.data;

    if (!Array.isArray(aggregationRecords) && aggregationRecords.length) {
        return null;
    }

    const usersGraphData = {};
    Object.keys(users).forEach((userKey) => {
        const user = users[userKey];
        const records = aggregationRecords
            .filter((record) => record._id.user === user.id)
            .sort((a, b) => {
                // Order chronologically
                if (a._id.year !== b._id.year) {
                    return a._id.year > b._id.year ? 1 : -1;
                }
                return a._id.week > b._id.week ? 1 : -1;
            });

        const graphData = {};
        records.forEach((record) => {
            const chore = record._id.id;
            if (!graphData[chore]) {
                graphData[chore] = [];
            }

            graphData[chore].push({
                label: record._id.week,
                x: record._id.week,
                y: record.count,
                order: `${record._id.year}-${record._id.week.toString().padStart(2, "0")}`,
            });
        });

        usersGraphData[user.id] = graphData;
    });

    return usersGraphData;
}

export default Chores