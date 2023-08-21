export class ServerError extends Error {
    statusCode = 500;
}

export class UnprocessableContent extends Error {
    statusCode = 422;
}