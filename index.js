const { MongoClient } = require("mongodb");
const { mkdir, writeFile, readFile, readdir } = require('fs/promises');
const { existsSync } = require('fs');
const { pipeline } = require("stream/promises");
const AdmZip = require('adm-zip');
const { join } = require("path");
const { createHash } = require("crypto");
const { zipObject } = require("lodash");
require('dotenv').config();

const { SFB_511_API_KEY, MDB_CON_STR_URI } = process.env;
const OPERATOR_ID = 'SC';

const client = new MongoClient(MDB_CON_STR_URI);

const hash = buf => {
    const hasher = createHash('sha1');
    hasher.update(buf);
    return hasher.digest('hex');
}

const readCsv = str => {
    const [header, ...data] = str.split('\r\n').map(line => line.split(','));
    return data.map(datum => zipObject(header, datum));
}

const run = async () => {
    try {
        const database = client.db(OPERATOR_ID);

        const operatorPath = join('./gtfs', OPERATOR_ID);
        await mkdir(operatorPath, { recursive: true });
        const buf = await fetch(`http://api.511.org/transit/datafeeds?api_key=${SFB_511_API_KEY}&operator_id=${OPERATOR_ID}`)
            .then(res => res.arrayBuffer())
            .then(data => Buffer.from(data));
        
        const checksumPath = join(operatorPath, 'checksum');
        const downloadChecksum = hash(buf);
        if (existsSync(checksumPath)) {
            const checksum = await readFile(checksumPath, 'utf-8');
            if (checksum === downloadChecksum)
                return;
        }
        await writeFile(checksumPath, downloadChecksum);

        const transactions = new AdmZip(buf).getEntries().map(async entry => {
            const filename = entry.name;
            console.log('Starting processing of', filename);

            const collection = database.collection(filename.slice(0, -4));
            
            const data = await new Promise((resolve, reject) => 
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
                if (checksum === downloadChecksum)
                    return;
            }
            await writeFile(checksumPath, downloadChecksum);
            
            const dataObjects = readCsv(data.toString('utf-8'));

            console.log('Processing', dataObjects.length, 'lines in', filename);
            if (dataObjects.length) {
                await collection.insertMany(dataObjects);
            }
            return console.log('Completed processing', filename);
        });

        return await Promise.all(transactions);
    } finally {
        await client.close();
    }
}

run().then('Success.').catch(console.dir);