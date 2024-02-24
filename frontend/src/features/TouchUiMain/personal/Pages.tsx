import { useState, useEffect } from 'react'
import Medical from '../Medical/Medical';
import Chores from '../chores/Chores';
import './pages.scss';

function Pages({}) {
    const [page, setPage] = useState(0);

    function turnPage() {
        setPage(page < pages.length - 1 ? page + 1 : 0);
    }

    const pages = [
        // {
        //     title: "Jess",
        //     content: <Chores dynformsUsername={`Jess`} />,
        // },
        // { 
        //     title: "Johannes",
        //     content: <Chores dynformsUsername={`Johannes`} />,
        // },
        {
            title: "Johannes",
            content: <Medical />
        }
    ];
    return (
        <div className="pages-container">
            {pages.length > 1 && (
                <div className="pages-advance-container" onClick={turnPage}>
                    <div>&gt;</div>
                </div>
            )}
            {pages?.length > 0 && pages[page].content}
        </div>
    );
}

export default Pages