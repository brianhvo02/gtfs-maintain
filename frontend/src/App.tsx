import { useCookies } from 'react-cookie';
import './App.scss';
import MapComponent from './components/MapComponent';
import InitialForm from './components/InitialForm';
import { useEffect, useState } from 'react';
import { customFetch } from './utils';
import type { Feature, FeatureCollection } from 'geojson';
import NewFeedForm from './components/NewFeedForm';
import { Feed } from '../../shared';
import ChooseFeed from './components/ChooseFeed';
import Sidebar from './components/Sidebar';

const flattenFeatureCollections = (collections: FeatureCollection[]) => 
	collections.map((c: FeatureCollection) => c.features).flat();

const App = () => {
    const [cookies] = useCookies();
	const [feeds, setFeeds] = useState<Feed[]>();
	const [currentFeed, setCurrentFeed] = useState<Feed>();
	const [mapData, setMapData] = useState<Feature[]>();

	useEffect(() => {
		if (cookies.mdbUri) {
			return customFetch(
				'/feeds', 
				{
					method: 'GET'
				}, 
				res => res.json()
					.then(setFeeds),
				console.error
			);
		}
	}, [cookies.mdbUri]);

	useEffect(() => {
		if (currentFeed && !['ADD_FEED', 'UPDATE_FEED'].includes(currentFeed.id)) {
			return customFetch(
				`/feeds/${currentFeed.id}/routes`, 
				{
					method: 'GET'
				}, 
				res => res.json()
					.then(flattenFeatureCollections)
					.then(setMapData),
				console.error
			);
		}
	}, [currentFeed]);

    return (
		<div>
			{
				!cookies.mdbUri &&
				<InitialForm />
			}
			{
				(
					(!currentFeed && feeds && !feeds.length)
						||
					(currentFeed && ['ADD_FEED', 'UPDATE_FEED'].includes(currentFeed.id))
				) &&
				<NewFeedForm currentFeed={currentFeed} setCurrentFeed={setCurrentFeed} setFeeds={setFeeds} />
			}
			{
				feeds && !!feeds.length && !currentFeed &&
				<ChooseFeed feeds={feeds} setCurrentFeed={setCurrentFeed} />
			}
			<Sidebar currentFeed={currentFeed} setCurrentFeed={setCurrentFeed} setFeeds={setFeeds} />
			<MapComponent mapData={mapData} />
		</div>
	);
}

export default App;
