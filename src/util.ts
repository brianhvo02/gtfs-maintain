import { createHash } from "crypto";
import { zipObject } from "lodash";
import { Long } from "protobufjs";

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

export const readCsv = (str: String) => {
    const [header, ...data] = str.split('\r\n').map(line => line.split(','));
    return data.map(line => zipObject(header, line.map((datum, i) => datum.length && numbers.includes(header[i]) ? +datum : datum)));
}

const notEmpty = <T>(val: T | null | undefined): val is T => val !== null && val !== undefined;
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