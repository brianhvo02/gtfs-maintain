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
    const [cookies,, removeCookie] = useCookies();

    return (
        <div className='sidebar'>
            <ul style={{
                transform: toggled ? '' : 'translateX(-100%)'
            }}>
                <div>
                    <h1>GTFS Visualizer</h1>
                    <FontAwesomeIcon icon={faBus} />
                </div>
                {
                    cookies.mdbUri &&
                    <>
                        <li onClick={() => {
                            setToggled(prev => !prev);
                            setCurrentFeed(undefined);
                            setFeeds(undefined);
                            removeCookie('mdbUri');
                        }}>Switch Database</li>
                        <li onClick={() => {
                            setToggled(prev => !prev);
                            setCurrentFeed(prev => ({
                                id: 'SWITCH_FEED',
                                name: prev?.name ?? '',
                                url: prev?.id ?? ''
                            }));
                        }}>Switch Feed</li>
                        {
                            currentFeed && !['ADD_FEED', 'UPDATE_FEED'].includes(currentFeed.id) &&
                            <li onClick={() => {
                                setToggled(prev => !prev);
                                setCurrentFeed(prev => ({
                                    id: 'UPDATE_FEED',
                                    name: prev?.id ?? '',
                                    url: prev?.url ?? ''
                                }));
                            }}>Update Feed</li>
                        }
                    </>
                }
            </ul>
            <div className='sidebar-header'>
                <FontAwesomeIcon 
                    className='sidebar-icon'
                    icon={faBars} 
                    onClick={() => setToggled(prev => !prev)} 
                />
                <h2>{currentFeed?.name}</h2>
            </div>
        </div>
    )
}

export default Sidebar;