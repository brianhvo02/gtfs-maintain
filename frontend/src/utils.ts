import { Feature, FeatureCollection, MultiLineString, Point } from 'geojson';
import { Route, Stop } from 'gtfs-types';
import { useEffect, useState } from 'react';

interface GeolocationResponse {
    status: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    query: string;
}

export const useGeolocation = () => {
    const [geolocation, setGeolocation] = useState<GeolocationResponse>();
    useEffect(() => {
        fetch('http://ip-api.com/json')
            .then(res => res.json())
            .then(setGeolocation);
    }, []);

    return geolocation;
}

export const isDevelopment = process.env.NODE_ENV === 'development';

export const customFetch = (
    input: RequestInfo | URL,
    init?: RequestInit | undefined, 
    onfulfilled?: (response: Response) => void, 
    onrejected?: (reason: any) => void
) => {
    const controller = new AbortController();
    fetch(input, {
        ...init,
        signal: controller.signal
    }).then(onfulfilled).catch(onrejected);
    return () => controller.abort();
}

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [ 
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

export type MapDatum = FeatureCollection<MultiLineString | Point, Route | Stop>;
export type MapFeature = Feature<MultiLineString | Point, Route | Stop>;

export const flattenFeatureCollections = (collections: MapDatum[]): MapFeature[] => 
	collections.map((c: MapDatum) => c.features).flat();

// export const getOccupancyStatus = (occupancyStatus: transit_realtime.VehiclePosition.OccupancyStatus) => {
//     const OccupancyStatus = transit_realtime.VehiclePosition.OccupancyStatus;
//     switch (occupancyStatus) {
//         case OccupancyStatus.EMPTY:
//             return 'Vehicle has few or no passengers onboard.';
//         case OccupancyStatus.MANY_SEATS_AVAILABLE:
//             return 'Vehicle has large number of seats available.'
//         case OccupancyStatus.FEW_SEATS_AVAILABLE:
//             return 'Vehicle has a small number of seats available.';
//         case OccupancyStatus.STANDING_ROOM_ONLY:
//             return 'Vehicle can currently accommodate only standing passengers.';
//         case OccupancyStatus.CRUSHED_STANDING_ROOM_ONLY:
//             return 'Vehicle has limited space accomodating only standing passengers.';
//         case OccupancyStatus.FULL:
//             return 'Vehicle has little to no room for passengers.'
//         case OccupancyStatus.NOT_ACCEPTING_PASSENGERS:
//             return 'Vehicle not accepting passengers.';
//         default:
//             return occupancyStatus;
//     }
// }

export const checkRouteFeature = (feature: Feature<MultiLineString | Point, Route | Stop>): feature is Feature<MultiLineString, Route> => feature.geometry.type === 'MultiLineString';
export const checkStopFeature = (feature: Feature<MultiLineString | Point, Route | Stop>): feature is Feature<Point, Stop> => feature.geometry.type === 'Point';
export const checkRoute = (data: Route | Stop): data is Route => !!(data as Route).route_id;
export const checkStop = (data: Route | Stop): data is Stop => !!(data as Stop).stop_id;