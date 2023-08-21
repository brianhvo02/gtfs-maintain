import { MongoClient } from "mongodb"

export {}

declare global {
    namespace Express {
        export interface Request {
            dbClient?: MongoClient;
        }
    }
}