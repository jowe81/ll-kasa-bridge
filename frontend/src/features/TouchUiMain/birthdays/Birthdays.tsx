import "./birthdays.scss";
import { getRecords, getJsx } from "./birthdayHelpers.tsx";

function Birthdays() {
    const fullSize = true;
    let records = getRecords();
    const birthdaysJsx = records.length ? (
        records.map((record, index) => getJsx(record, index, fullSize))
    ) : (
        <div className=""></div>
    );


    return (
        <div className="birthdays-container">
            <div className="touch-ui-sub-panel-header">Birthdays</div>
            <div className="birthdays-items-container">
                {birthdaysJsx}
            </div>
        </div>
    );
}

export default Birthdays;
