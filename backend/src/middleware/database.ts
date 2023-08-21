import { NextFunction, Request, Response } from "express";
import { MongoClient } from "mongodb";

export const databaseConnect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.dbClient = new MongoClient(req.cookies.mdbUri);
        return next();
    } catch(e) {
        return next(e);
    }
}

export const databaseClose = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await req.dbClient?.close();
        return next();
    } catch(e) {
        return next(e);
    }
}