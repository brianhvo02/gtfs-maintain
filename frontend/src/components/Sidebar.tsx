import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Sidebar.scss';
import { faBars, faBus } from '@fortawesome/free-solid-svg-icons';
import { Dispatch, SetStateAction, useState } from 'react';
import { Feed } from '../../../shared';
import { useCookies } from 'react-cookie';

const Sidebar = ({ currentFeed, setCurrentFeed, setFeeds }: { 
    currentFeed?: Feed,
    setCurrentFeed: Dispatch<SetStateAction<Feed | undefined>>
    setFeeds: Dispatch<SetStateAction<Feed[] | undefined>>
}) => {
    const [toggled, setToggled] = useState(false);
    const [,, removeCookie] = useCookies();

    return (
        <div className='sidebar' style={{
            transform: toggled ? '' : 'translateX(calc(-100% + 4.5rem))'
        }}>
            <ul>
                <div>
                    <h1>GTFS Visualizer</h1>
                    <FontAwesomeIcon icon={faBus} />
                </div>
                <li onClick={() => {
                    setToggled(prev => !prev);
                    setCurrentFeed(undefined);
                    setFeeds(undefined);
                    removeCookie('mdbUri');
                }}>Switch Database</li>
                <li onClick={() => {
                    setToggled(prev => !prev);
                    setCurrentFeed(undefined);
                }}>Switch Feed</li>
                {
                    currentFeed &&
                    <li onClick={() => {
                        
                    }}>Update Feed</li>
                }
            </ul>
            <FontAwesomeIcon 
                className='sidebar-icon'
                icon={faBars} 
                onClick={() => setToggled(prev => !prev)} 
            />
        </div>
    )
}

export default Sidebar;