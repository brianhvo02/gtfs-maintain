import { transit_realtime } from 'gtfs-realtime-bindings';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import AdmZip from 'adm-zip';
import { join } from 'path';
import { GTFSData, MAP_BOX_PUB_KEY, OPERATOR_ID, SFB_511_API_KEY, agencyCollection, calendarCollection, calendarDateCollection, client, database, directionCollection, fareAttributeCollection, fareRuleCollection, routeAttributeCollection, routeCollection, shapeCollection, stopCollection, stopTimeCollection, tripCollection, tripUpdateCollection, vehicleCollection } from './config';
import { filterNull, hash, readCsv, timestampToDate } from './util';
import polyline from '@mapbox/polyline';
import { pick } from 'lodash';

const runSchedule = async () => {
    try {
        const operatorPath = join('./gtfs', OPERATOR_ID);
        await mkdir(operatorPath, { recursive: true });
        const buf = await fetch(`http://api.511.org/transit/datafeeds?api_key=${SFB_511_API_KEY}&operator_id=${OPERATOR_ID}`)
            .then(res => res.arrayBuffer())
            .then(data => Buffer.from(data));
        
        const checksumPath = join(operatorPath, 'checksum');
        const downloadChecksum = hash(buf);
        if (existsSync(checksumPath)) {
            const checksum = await readFile(checksumPath, 'utf-8');
            if (checksum === downloadChecksum) return;
        }
        await writeFile(checksumPath, downloadChecksum);

        const transactions = new AdmZip(buf).getEntries().map(async entry => {
            const filename = entry.name;
            console.log('Starting processing of', filename);

            const collection = database.collection(filename.slice(0, -4));
            
            const data = await new Promise<Buffer>((resolve, reject) => 
                entry.getDataAsync(
                    (data, err) => err ? 
                        reject(err) : 
                        resolve(data)
                )
            );

            const checksumPath = join(operatorPath, `${filename}.checksum`);
            const downloadChecksum = hash(data);
            if (existsSync(checksumPath)) {
                const checksum = await readFile(checksumPath, 'utf-8');
                if (checksum === downloadChecksum) return;
            }
            await writeFile(checksumPath, downloadChecksum);
            
            const dataObjects = readCsv(data.toString('utf-8'));

            console.log('Deleting old', filename);
            await collection.deleteMany({});

            console.log('Processing', dataObjects.length, 'lines in', filename);
            if (dataObjects.length) await collection.insertMany(dataObjects);
            return console.log('Completed processing', filename);
        });

        await Promise.all(transactions);
    } finally {
        await client.close();
    }
}

const fetchRealtime = async (endpoint: string) => fetch(`http://api.511.org/transit/${endpoint}?api_key=${SFB_511_API_KEY}&agency=${OPERATOR_ID}`)
    .then(res => res.arrayBuffer())
    .then(data => transit_realtime.FeedMessage.decode(new Uint8Array(data)));

const updateRealtime = async (endpoint: string) => {
    const database = client.db(OPERATOR_ID);
    const { entity } = await fetchRealtime(endpoint);
    const collection = database.collection(endpoint);
    await collection.deleteMany({});
    await collection.insertMany(entity);
}

const runRealtime = async () => {
    try {
        await Promise.all([
            updateRealtime('vehiclepositions'),
            updateRealtime('tripupdates')
        ]);
    } finally {
        await client.close();
    }
}

const runQuery = async (tripId: string): Promise<GTFSData | undefined> => {
    try {
        console.log('Gathering data on trip', tripId);
        const tripUpdateEntity = await tripUpdateCollection.findOne({ id: tripId });
        const tripUpdate = tripUpdateEntity?.tripUpdate;
        if (!tripUpdate?.vehicle || !tripUpdate?.trip.tripId) return;
        console.log('Gathered tripUpdate')

        const [ vehicleEntity, trip ] = await Promise.all([
            vehicleCollection.findOne({ id: tripUpdate.vehicle.id }),
            tripCollection.findOne({ trip_id: tripUpdate.trip.tripId })
        ]);
        const vehicle = vehicleEntity?.vehicle;
        if (!vehicle || !trip) return;
        console.log('Gathered vehicle and trip')

        const [ route, stopTimes, shapes, calendar ] = await Promise.all([
            routeCollection.findOne({ route_id: trip.route_id }),
            stopTimeCollection.find({ trip_id: trip.trip_id }).toArray(),
            shapeCollection.find({ shape_id: trip.shape_id }).sort({ shape_pt_sequence: 1 }).toArray(),
            calendarCollection.findOne({ service_id: trip.service_id })
        ]);
        if (!route || !calendar) return;
        console.log('Gathered route, stopTimes, shapes, and calendar')

        const [ routeAttributes, fareRules, agency ] = await Promise.all([
            routeAttributeCollection.findOne({ route_id: route.route_id }),
            fareRuleCollection.find({ route_id: route.route_id }).toArray(),
            agencyCollection.findOne({ agency_id: route.agency_id })
        ]);
        if (!routeAttributes || !agency) return;
        console.log('Gathered routeAttributes and agency')

        const [ fareAttributes, stops, direction, calendarExceptions ] = await Promise.all([
            Promise.all(fareRules.map(fareRule => fareAttributeCollection.findOne({ fare_id: fareRule.fare_id }))).then(filterNull),
            Promise.all(stopTimes.map(stopTime => stopCollection.findOne({ stop_id: stopTime.stop_id }))).then(filterNull),
            directionCollection.findOne({ route_id: route.route_id, direction_id: trip.direction_id }),
            calendarDateCollection.find({ service_id: trip.service_id }).toArray()
        ]);
        if (!direction) return;
        console.log('Gathered fareAttributes, stops, direction, and calendarExceptions')

        console.log('Data gather complete.');
        
        return {
            agency,
            route, routeAttributes, 
            trip, 
            direction,
            calendar, calendarExceptions,
            fareRules, fareAttributes,
            stopTimes, stops,
            shapes,
            tripUpdate, vehicle,
        }

        // const geojson = featureCollection<MultiPoint | LineString>([
        //     multiPoint(stops.reduce((points: Position[], stop) => stop && stop.stop_lon && stop.stop_lat ? [ ...points, [stop.stop_lon, stop.stop_lat] ] : points, []), {
        //         "marker-symbol": "bus"
        //     }),
        //     lineString(shapes.map<Position>(shape => [shape.shape_pt_lon, shape.shape_pt_lat]), {
        //         stroke: `#${route.route_color}`
        //     }),
        // ]);
    } finally {
        await client.close();
    }
}

// const stopDetails = ['stop_name', ]

const generateMap = async (data?: GTFSData) => {
    if (!data) return;
    const { stops, shapes, vehicle, route, direction, stopTimes, tripUpdate } = data;

    const orderedStops = direction.direction_id ? stops : stops.reverse();
    const remainingStops = orderedStops.slice(vehicle.currentStopSequence - 1);
    const stopStrings = [orderedStops[0], ...remainingStops]
        .map((stop, i) => stop ? `pin-s${i === 0 ? '-home+32A431' : i === orderedStops.length - vehicle.currentStopSequence + 1? '-caution+BB1E10' : ''}(${stop.stop_lon},${stop.stop_lat})` : '');
    const lineString = `path+${route.route_color}(${polyline.encode(shapes.map(shape => [shape.shape_pt_lat, shape.shape_pt_lon]))})`;
    const vehicleString = `pin-l-bus+00B5E2(${vehicle.position?.longitude},${vehicle.position?.latitude})`;

    const remainingStopInfo = remainingStops.map(stop => {
        const scheduled = stopTimes.find(stopTime => stopTime.stop_id === stop.stop_id);
        const update = tripUpdate.stopTimeUpdate.find(stopTime => stopTime.stopId === stop.stop_id)
        const stopInfo = {
            name: stop.stop_name,
            arrival: {
                scheduled: scheduled?.arrival_time,
                estimated: timestampToDate(update?.arrival?.time)
            },
            departure: {
                scheduled: scheduled?.departure_time,
                estimated: timestampToDate(update?.departure?.time)
            }
        }

        return stopInfo;
    });

    console.table(remainingStopInfo);

    const pic = await fetch(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${encodeURIComponent(stopStrings.concat(lineString, vehicleString).join(','))}/auto/1280x1280@2x?access_token=${MAP_BOX_PUB_KEY}`)
        .then(res => res.arrayBuffer());
    await writeFile('map.png', Buffer.from(pic));
}

const success = () => console.log('Success.');
// runSchedule().then(success).catch(console.dir);
// runRealtime().then(success).catch(console.dir);
runQuery('3401263').then(generateMap).then(success).catch(console.dir);