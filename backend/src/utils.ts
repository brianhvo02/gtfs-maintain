import { Feature, MultiLineString, Point, Position } from '@turf/helpers';
import { createHash } from 'crypto';
import { Route, Stop } from 'gtfs-types';
import { zipObject } from 'lodash';
import { Long } from 'protobufjs';
import { WebSocket } from 'ws';

export const hash = (buf: Buffer) => {
    const hasher = createHash('sha1');
    hasher.update(buf);
    return hasher.digest('hex');
}

const numbers = [
    'continuous_pickup', 'continuous_drop_off',
    'stop_lat', 'stop_lon', 'location_type', 'wheelchair_boarding',
    'route_type', 'route_sort_order',  
    'direction_id', 'wheelchair_accessible', 'bikes_allowed', 
    'stop_sequence', 'pickup_type', 'drop_off_type', 'shape_dist_traveled', 'timepoint', 
    'service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
    'exception_type', 
    'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence', 'shape_dist_traveled', 
    'headway_secs', 'exact_times', 
    'transfer_type', 'min_transfer_time',
    'price', 'payment_method', 'transfers', 'transfer_duration'
]

export const readCsv = (csv: String) => {
    const csvTransform = csv.replaceAll('\r\n', '\n').split('\n');
    if (!csvTransform[csvTransform.length - 1].length)
        csvTransform.pop();
    const [header, ...data] = csvTransform.map(line => {
        const strArr = [...new Set([...line.matchAll(/"[^"]+"/g)].map(match => match[0]))];
        const newLine = strArr.reduce((newLine, str, i) => newLine.replaceAll(str, `$${i}`), line).split(',');
        strArr.forEach((str, i) => { newLine[newLine.indexOf(`$${i}`)] = str.slice(1, str.length - 1) });
        return newLine;
    });
    return data.map(line => zipObject(header, line.map((datum, i) => numbers.includes(header[i]) && !isNaN(+datum) ? +datum : datum)));
}

export const notEmpty = <T>(val: T | null | undefined): val is T => val !== null && val !== undefined;
export const filterNull = <T>(data: (T | null | undefined)[])  => data.filter(notEmpty);

export const timestampToDate = (num: number | Long | null | undefined) => {
    if (!num)
        return;

    const timestamp = typeof num !== 'number' ? num.low : num;
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const checkPosition = (pos: Position): pos is [number, number] => pos.length === 2;

export const checkRouteFeature = (feature: Feature<MultiLineString | Point, Route | Stop>): feature is Feature<MultiLineString, Route> => feature.geometry.type === 'MultiLineString';
export const checkStopFeature = (feature: Feature<MultiLineString | Point, Route | Stop>): feature is Feature<Point, Stop> => feature.geometry.type === 'Point';

export const log = (message: string, ws?: WebSocket) => ws ? ws.send(message) : console.log(message);