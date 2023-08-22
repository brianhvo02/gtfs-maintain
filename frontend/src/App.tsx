import { useCookies } from 'react-cookie';
import './App.scss';
import MapComponent from './components/MapComponent';
import InitialForm from './components/InitialForm';
import { useEffect, useMemo, useState } from 'react';
import { MapDatum, checkRouteFeature, customFetch } from './utils';
import NewFeedForm from './components/NewFeedForm';
import { Feed } from '../../shared';
import ChooseFeed from './components/ChooseFeed';
import Sidebar from './components/Sidebar';
import InfoPanel from './components/InfoPanel';
import { Route } from 'gtfs-types';

const App = () => {
    const [cookies] = useCookies();
	const [feeds, setFeeds] = useState<Feed[]>();
	const [currentFeed, setCurrentFeed] = useState<Feed>();
	const [mapData, setMapData] = useState<MapDatum[]>();
	const [routes, setRoutes] = useState<Route[]>();
	const [hoveredRoute, setHoveredRoute] = useState<Route>();
	const [selectedRoute, setSelectedRoute] = useState<Route>();
	const mapDatum = useMemo(() => mapData && selectedRoute &&
        mapData.find(datum => datum.features.find(feature => checkRouteFeature(feature) && feature.properties.route_id === selectedRoute.route_id)), [mapData, selectedRoute]);

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
		if (currentFeed && !['ADD_FEED', 'UPDATE_FEED', 'SWITCH_FEED'].includes(currentFeed.id)) {
			setSelectedRoute(undefined);
			setHoveredRoute(undefined);

			const abortFetch1 = customFetch(
				`/feeds/${currentFeed.id}/routes`, 
				{
					method: 'GET',
					headers: {
						'Accept': 'application/geo+json'
					}
				}, 
				res => res.json()
					.then(setMapData),
				console.error
			);

			const abortFetch2 = customFetch(
				`/feeds/${currentFeed.id}/routes`, 
				{
					method: 'GET'
				}, 
				res => res.json()
					.then(setRoutes),
				console.error
			);

			return () => {
				abortFetch1();
				abortFetch2();
			}
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
				feeds && !!feeds.length && (!currentFeed || currentFeed.id === 'SWITCH_FEED') &&
				<ChooseFeed currentFeed={currentFeed} feeds={feeds} setCurrentFeed={setCurrentFeed} />
			}
			<Sidebar currentFeed={currentFeed} setCurrentFeed={setCurrentFeed} setFeeds={setFeeds} />
			{
				currentFeed && !['ADD_FEED', 'UPDATE_FEED', 'SWITCH_FEED'].includes(currentFeed.id) &&
				<InfoPanel mapDatum={mapDatum} selectedRoute={selectedRoute} routes={routes} setHoveredRoute={setHoveredRoute} setSelectedRoute={setSelectedRoute} />
			}
			<MapComponent mapDatum={mapDatum} hoveredRoute={hoveredRoute} selectedRoute={selectedRoute} mapData={mapData} />
		</div>
	);
}

export default App;
