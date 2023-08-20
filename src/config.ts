import 'dotenv/config';
import { transit_realtime } from 'gtfs-realtime-bindings';
import { Trip, Route, Agency, StopTime, Stop, Shapes, Calendar, CalendarDates } from 'gtfs-types';
import { Document, MongoClient, WithId } from 'mongodb';

if (!process.env.SFB_511_API_KEY)
    throw new Error('No API key');

if (!process.env.MDB_CON_STR_URI)
    throw new Error('No MongoDB URI');

if (!process.env.MAP_BOX_PUB_KEY)
    throw new Error('No Mapbox public key');

export const { SFB_511_API_KEY, MDB_CON_STR_URI, MAP_BOX_PUB_KEY } = process.env;
export const OPERATOR_ID = 'SC';

export const client = new MongoClient(MDB_CON_STR_URI);
export const database = client.db(OPERATOR_ID);

export const tripUpdateCollection = database.collection<{ tripUpdate: transit_realtime.TripUpdate }>('tripupdates');
export const vehicleCollection = database.collection<{ vehicle: transit_realtime.VehiclePosition }>('vehiclepositions');
export const tripCollection = database.collection<Trip>('trips', { });
export const routeCollection = database.collection<Route>('routes');
export const routeAttributeCollection = database.collection('route_attributes');
export const agencyCollection = database.collection<Agency>('agency');
export const stopTimeCollection = database.collection<StopTime>('stop_times');
export const stopCollection = database.collection<Stop>('stops');
export const shapeCollection = database.collection<Shapes>('shapes');
export const directionCollection = database.collection('directions');
export const calendarCollection = database.collection<Calendar>('calendar');
export const calendarDateCollection = database.collection<CalendarDates>('calendar_dates');
export const fareRuleCollection = database.collection('fare_rules');
export const fareAttributeCollection = database.collection('fare_attributes');

export interface GTFSData {
    agency: WithId<Agency>;
    route: WithId<Route>;
    routeAttributes: WithId<Document>;
    trip: WithId<Trip>;
    direction: WithId<Document>;
    calendar: WithId<Calendar>;
    calendarExceptions: WithId<CalendarDates>[];
    fareRules: WithId<Document>[];
    fareAttributes: WithId<Document>[];
    stopTimes: WithId<StopTime>[];
    stops: WithId<Stop>[];
    shapes: WithId<Shapes>[];
    tripUpdate: transit_realtime.TripUpdate;
    vehicle: transit_realtime.VehiclePosition;
}