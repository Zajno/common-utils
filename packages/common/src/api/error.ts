/*

This module is mostly an example of how an API error data structures may look like.

It implies that API endpoints have a standardized data structure for errors, and that the error handling is done in a centralized way.

`ApiErrorResponse` is a base DTO for errors in responses, can be a combination of an error code, message, and a cause.

`ApiError` is an Error class that can be thrown and caught, and is basically a wrapper around the `ApiErrorResponse` DTO.

*/

import { StatusCodes } from './statusCodes.js';

/** Base DTO for getting a error response */
export type ApiErrorResponse<TCause = never, TErrors = number | string> = {
    code?: TErrors,
    message?: string,
} & ([TCause] extends [never] ? object : { cause?: TCause });

export namespace ApiErrorResponse {
    export function create<TCause = never, TErrors = number | string>(code: TErrors, message?: string, cause?: TCause): ApiErrorResponse<TCause, TErrors> {
        return { code, message, cause };
    }
}

/** An Error to be thrown as an API error, and be caught */
export class ApiError<
    TCause = unknown,
    TCodes extends number = StatusCodes,
    TErrors extends number | string = number | string,
> extends Error {

    readonly cause?: TCause;

    constructor(
        public readonly status: TCodes,
        public readonly code: TErrors,
        message: string,
        cause?: TCause,
    ) {
        super(message, { cause });
        this.cause = cause;

        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    public static fromResponse<TCodes extends number = StatusCodes, TErrors extends number | string = number | string>(
        status: TCodes,
        responseData: unknown,
    ) {
        const response = responseData as ApiErrorResponse<unknown, TErrors>;
        if (!response || response.code == null) {
            return new ApiError(
                status,
                0,
                [
                    'An unknown error has occurred. Please try again later.',
                    response?.message && `Message: ${response.message}`,
                ].filter(Boolean).join('\n'),
            );
        }

        return new ApiError<unknown, TCodes, TErrors>(
            status,
            response.code,
            response.message || '<no message>',
            response.cause,
        );
    }
}
