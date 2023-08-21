import { NextFunction, Request, Response } from "express";
import { UnprocessableContent } from "../errors";
import { getCollections } from "../config";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { feedId } = req.params;
        const client = req.dbClient;
        if (!client) throw new UnprocessableContent('Database URI missing');
        const { routeGeoJSON } = getCollections(client, feedId);
        routeGeoJSON.find({}).toArray().then(data => res.json(data));
    } catch (e) {
        next(e);
    }
}