import { NextFunction, Request, Response } from "express";

export const logger = async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
    })
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })
    console.log(`[${date} ${time}] ${req.method} ${req.path}`);
    next();
}