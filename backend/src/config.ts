import { Feature, FeatureCollection, MultiLineString, Point } from '@turf/helpers';
import 'dotenv/config';
import { transit_realtime } from 'gtfs-realtime-bindings';
import { Trip, Route, Agency, StopTime, Stop, Shapes, Calendar, CalendarDates } from 'gtfs-types';
import { Collection, Db, Document, MongoClient, WithId } from 'mongodb';
import { Feed } from '../../shared';

export interface Checksums { [filename: string]: string }
export interface Collections {
    database: Db;
    checksums: Collection<Checksums>;
    tripUpdate: Collection<{ id: string; tripUpdate: transit_realtime.TripUpdate }>;
    vehicle: Collection<{ id: string; vehicle: transit_realtime.VehiclePosition }>;
    trip: Collection<Trip>;
    route: Collection<Route>;
    routeAttribute: Collection;
    agency: Collection<Agency>;
    stopTime: Collection<StopTime>;
    stop: Collection<Stop>;
    shape: Collection<Shapes>;
    direction: Collection;
    calendar: Collection<Calendar>;
    calendarDate: Collection<CalendarDates>;
    fareRule: Collection;
    fareAttribute: Collection;
    routeGeoJSON: Collection<FeatureCollection<MultiLineString | Point, Route | Stop>>;
}

export const getSharedCollections = (client: MongoClient) => {
    const sharedDb = client.db('shared');
    return {
        sharedDb,
        feeds: sharedDb.collection<Feed>('feeds'),
    }
}

export const getCollections = (client: MongoClient, db: string): Collections => {
    const database = client.db(db);
    
    return {
        database,
        checksums: database.collection<Checksums>('checksums'),
        tripUpdate: database.collection<{ id: string, tripUpdate: transit_realtime.TripUpdate }>('tripupdates'),
        vehicle: database.collection<{ id: string, vehicle: transit_realtime.VehiclePosition }>('vehiclepositions'),
        trip: database.collection<Trip>('trips'),
        route: database.collection<Route>('routes'),
        routeAttribute: database.collection('route_attributes'),
        agency: database.collection<Agency>('agency'),
        stopTime: database.collection<StopTime>('stop_times'),
        stop: database.collection<Stop>('stops'),
        shape: database.collection<Shapes>('shapes'),
        direction: database.collection('directions'),
        calendar: database.collection<Calendar>('calendar'),
        calendarDate: database.collection<CalendarDates>('calendar_dates'),
        fareRule: database.collection('fare_rules'),
        fareAttribute: database.collection('fare_attributes'),
        routeGeoJSON: database.collection<FeatureCollection<MultiLineString | Point, Route | Stop>>('routes_geojson')
    }
}

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