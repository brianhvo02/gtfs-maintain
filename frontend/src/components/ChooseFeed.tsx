import { Dispatch, SetStateAction } from 'react';
import { Feed } from '../../../shared';
import './ChooseFeed.scss';

const ChooseFeed = ({ feeds, setCurrentFeed }: { 
    feeds: Feed[]; 
    setCurrentFeed: Dispatch<SetStateAction<Feed | undefined>>
}) => {

    return (
        <div className='choose-feed' >
            <select defaultValue='SELECT' onChange={e => {
                if (e.target.value === 'ADD_FEED') {
                    setCurrentFeed({ id: 'ADD_FEED', name: '', url: '' });
                } else {
                    setCurrentFeed(feeds.find(f => f.id === e.target.value));
                }
            }}>
                <option value='SELECT' disabled>Select feed</option>
                {
                    feeds.map(feed => (
                        <option key={feed.id} value={feed.id}>{feed.name}</option>
                    ))
                }
                <option value='ADD_FEED'>Add new feed</option>
            </select>
        </div>
    );
}

export default ChooseFeed;