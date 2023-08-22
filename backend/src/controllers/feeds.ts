import { NextFunction, Request, Response } from 'express';
import { UnprocessableContent } from '../errors';
import { Checksums, Collections, getCollections, getSharedCollections } from '../config';
import { Feed, checkFeed } from '../../../shared';
import { v4 } from 'uuid';
import { join } from 'path';
import { hash, notEmpty, readCsv, log } from '../utils';
import { Collection, Db } from 'mongodb';
import AdmZip from 'adm-zip';
import wsServer from '../websocket';
import { WebSocket } from 'ws';
import { Feature, Point, point, featureCollection, MultiLineString, multiLineString } from '@turf/helpers';
import { Route, Trip, Stop } from 'gtfs-types';
import { chunk } from 'lodash';

const updateDatabase = async (url: string, collections: Collections, ws?: WebSocket) => {
    log(`Received request to update database`, ws);
    const { checksums, database } = collections;
    const allChecksums = await checksums.findOne();

    const buf = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => Buffer.from(data));
    log(`Downloaded GTFS archive`, ws);

    const downloadChecksum = hash(buf);
    if (allChecksums && allChecksums.archive) {
        if (allChecksums.archive === downloadChecksum) return;
    }

    await checksums.updateOne({}, { $set: { archive: downloadChecksum } }, { upsert: true });

    const transactions = new AdmZip(buf).getEntries().map(async entry => {
        const filename = entry.name.slice(0, -4);
        log(`Starting processing of ${filename}`, ws);

        const collection = database.collection(filename);
        
        const data = await new Promise<Buffer>((resolve, reject) => 
            entry.getDataAsync(
                (data, err) => err ? 
                    reject(err) : 
                    resolve(data)
            )
        );

        const downloadChecksum = hash(data);
        if (allChecksums && allChecksums[filename] && allChecksums[filename] === downloadChecksum) return;
        await checksums.updateOne({}, { $set: { [filename]: downloadChecksum } });
        
        const dataString = data.toString('utf8');
        const dataObjects = readCsv(dataString.codePointAt(0) === 0xFEFF ? dataString.slice(1) : dataString);

        log(`Deleting old ${filename}`, ws);
        await collection.deleteMany({});

        log(`Processing ${dataObjects.length} in ${filename}`, ws);
        await collection.insertMany(dataObjects);
        log(`Completed processing ${filename}`, ws);
    });

    return await Promise.all(transactions);
}

const updateGeoJSON = async (collections: Collections, ws?: WebSocket) => {
    const routes = await collections.route.find({}).project<Route>({ 
        _id: 0
    }).toArray();

    log('Calculating GeoJSON shapes', ws);
    await collections.routeGeoJSON.deleteMany({});
    await Promise.all(
        routes.map(async function (route) {
            log(`Working on ${route.route_id}`, ws);
            const trips = await collections.trip
                .find({ route_id: route.route_id })
                .project<Pick<Trip, 'shape_id' | 'trip_id'>>({ _id: 0, shape_id: 1, trip_id: 1 })
                .toArray();
            log(`Found ${trips.length} trips for ${route.route_id}`, ws);

            const shapeCoords = await Promise.all(
                [...new Set(trips.map(({ shape_id }) => shape_id).filter(notEmpty))].map(async shapeId => 
                    collections.shape
                        .find({ shape_id: shapeId })
                        .sort({ shape_pt_sequence: 1 })
                        .toArray()
                        .then(shapes => shapes.map(shape => [shape.shape_pt_lon, shape.shape_pt_lat]))
                )
            );
            log(`Found ${shapeCoords.length} shapes for ${route.route_id}`, ws);

            const stopIds = await collections.stopTime.distinct('stop_id', {
                trip_id: { 
                    '$in': trips.map(({ trip_id }) => trip_id).filter(notEmpty) 
                },
            });
            log(`Found ${stopIds.length} stops for ${route.route_id}`, ws);

            const stopFeatures = await Promise.all(
                stopIds.map(async stopId => 
                    collections.stop
                        .findOne<Stop>({ stop_id: stopId }, { projection: { _id: 0 } })
                )
            ).then(stops => 
                stops.reduce((stops: Feature<Point, Stop>[], stop) => (
                    stop && stop.stop_lon && stop.stop_lat 
                    ? stops.concat(point([stop.stop_lon, stop.stop_lat], stop)) 
                    : stops
                ), [])    
            );
            log(`Created stop features for ${route.route_id}`, ws);

            await collections.routeGeoJSON.insertOne(featureCollection<MultiLineString | Point, Route | Stop>([
                multiLineString(shapeCoords, route),
                ...stopFeatures
            ], {
                id: route.route_id
            }));
            log(`Finished calculating route ${route.route_id}`, ws);
        })
    );

    log('Finished GeoJSON calculations', ws);
}

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = req.dbClient;
        if (!client) throw new UnprocessableContent('Database URI missing');
        const { feeds } = getSharedCollections(client);
        feeds.find({}).toArray().then(data => res.json(data));
    } catch (e) {
        next(e);
    }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!checkFeed(req.body)) throw new UnprocessableContent('Body not a Feed object');

        const wsClient = [...wsServer.clients].find(client => client.protocol === req.body.id);
        // if (!wsClient) throw new UnprocessableContent('WebSocket id not valid');

        const client = req.dbClient;
        if (!client) throw new UnprocessableContent('Database URI missing');
        
        const { feeds } = getSharedCollections(client);
        const collections = getCollections(client, req.body.id);
        await feeds.insertOne(req.body);

        await updateDatabase(req.body.url, collections, wsClient);
        await updateGeoJSON(collections, wsClient);
        res.json(req.body);
    } catch (e) {
        next(e);
    }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { feedId } = req.params;
        const wsClient = [...wsServer.clients].find(client => client.protocol === feedId);
        // if (!wsClient) throw new UnprocessableContent('Invalid WebSocket id');

        const client = req.dbClient;
        if (!client) throw new UnprocessableContent('Database URI missing');

        const { feeds } = getSharedCollections(client);
        const collections = getCollections(client, feedId);
        const feed = await feeds.findOne({ id: feedId });
        if (!feed) throw new UnprocessableContent('Invalid feed id');

        await updateDatabase(feed.url, collections, wsClient);
        await updateGeoJSON(collections, wsClient);
        res.json(feed);
    } catch (e) {
        next(e);
    }
}