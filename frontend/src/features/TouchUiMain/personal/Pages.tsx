import { useState, useEffect } from 'react'
import Medical from '../Medical/Medical';
import Chores from '../chores/Chores';
import './pages.scss';

function Pages({}) {
    const [page, setPage] = useState(0);

    const pages = [
        'Jess', 'Johannes', 'Johannes'
    ];

    function turnPage() {
        setPage(page < pages.length - 1 ? page + 1 : 0);
    }

    return (
        <div className="pages-container">
            <div className="pages-advance-container" onClick={turnPage}>
                <div>&gt;</div>
            </div>
            {/* {page === 0 && <Chores dynformsUsername={`Jess`} />}
            {page === 1 && <Chores dynformsUsername={`Johannes`} />}
            {page === 2 && <Medical />} */}
            <Medical />
        </div>
    );
}

export default Pages