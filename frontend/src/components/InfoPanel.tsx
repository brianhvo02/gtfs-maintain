import { Route, Stop } from 'gtfs-types';
import './InfoPanel.scss';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { MapDatum, checkRoute, checkRouteFeature, checkStop, checkStopFeature } from '../utils';

enum RouteType {
    'LIGHT_RAIL',
    'SUBWAY',
    'RAIL',
    'BUS',
    'FERRY',
    'CABLE_TRAM',
    'AERIAL_LIFT',
    'FUNICULAR',
    'TROLLEYBUS',
    'MONORAIL'
}

const getRouteType = (routeType: number) => {
    switch (routeType) {
        case RouteType.LIGHT_RAIL:
            return 'Tram, Streetcar, Light rail';
        case RouteType.SUBWAY:
            return 'Subway, Metro';
        case RouteType.RAIL:
            return 'Rail';
        case RouteType.BUS:
            return 'Bus';
        case RouteType.FERRY:
            return 'Ferry';
        case RouteType.CABLE_TRAM:
            return 'Cable tram';
        case RouteType.AERIAL_LIFT:
            return 'Aerial lift, suspended cable car (e.g., gondola lift, aerial tramway)';
        case RouteType.FUNICULAR:
            return 'Funicular';
        case RouteType.TROLLEYBUS:
            return 'Trolleybus';
        case RouteType.MONORAIL:
            return 'Monorail';
        default:
            return routeType;
    }
}

interface InfoPanelProps {
    mapDatum?: MapDatum;
    selectedRoute?: Route;
    routes?: Route[];
    setHoveredRoute: Dispatch<SetStateAction<Route | undefined>>
    setSelectedRoute: Dispatch<SetStateAction<Route | undefined>>
}

const InfoPanel = ({ mapDatum, selectedRoute, routes, setHoveredRoute, setSelectedRoute }: InfoPanelProps) => {
    const [page, setPage] = useState(1);
    const stops = useMemo(() => mapDatum?.features.reduce((arr: Stop[], feature) => checkStopFeature(feature) ? arr.concat(feature.properties) : arr, []), [mapDatum]);
    const pageInfo = useMemo(() => (stops || routes)?.slice((page - 1) * 10, page * 10), [routes, stops, page]);

    if (!routes || !pageInfo) return null;

    if (selectedRoute) {
        return (
            <div className='info-panel info-panel-selected'>
                <header>
                    <FontAwesomeIcon
                        icon={faArrowLeft} 
                        onClick={() => setPage(prev => prev - 1)} 
                    />
                    <h2>{selectedRoute.route_short_name} - {selectedRoute.route_long_name}</h2>
                    <p>ID: {selectedRoute.route_id}</p>
                    <p>{getRouteType(selectedRoute.route_type)}</p>
                </header>
                <ol>
                </ol>
            </div>
        );
    }

    return (
        <div className='info-panel info-panel-routes'>
            <header>
                {
                    page > 1 &&
                    <FontAwesomeIcon
                        icon={faArrowLeft} 
                        onClick={() => setPage(prev => prev - 1)} 
                    />
                }
                <span>{page}/{Math.ceil(routes.length / 10)}</span>
                {
                    page < Math.ceil(routes.length / 10) &&
                    <FontAwesomeIcon 
                        icon={faArrowRight} 
                        onClick={() => setPage(prev => prev + 1)}
                    />
                }
            </header>
            <ol onMouseLeave={() => setHoveredRoute(undefined)}>
                {
                    pageInfo.map(route => {
                        if (!checkRoute(route))
                            return null;
                        return (
                            <li 
                                key={route.route_id}
                                onMouseEnter={() => setHoveredRoute(route)}
                                onClick={() => {
                                    setSelectedRoute(route);
                                    setPage(1);
                                }}
                            >
                                <section>
                                    <h2>{route.route_short_name}</h2>
                                    <h3>{route.route_long_name}</h3>
                                </section>
                                <section>
                                    <p>{route.route_id}</p>
                                    <p>{getRouteType(route.route_type)}</p>
                                </section>
                            </li>
                        );
                    })
                }
            </ol>
        </div>
    );
}

export default InfoPanel;