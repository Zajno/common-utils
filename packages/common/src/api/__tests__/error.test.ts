import { ApiError, ApiErrorResponse } from '../error.js';
import { StatusCodes } from '../statusCodes.js';

describe('api/error', () => {

    test('creates - from response', () => {
        const response = ApiErrorResponse.create(404, 'Not found');
        expect(response).toEqual({ code: 404, message: 'Not found', cause: undefined });

        const error = ApiError.fromResponse(StatusCodes.NOT_FOUND, response);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(StatusCodes.NOT_FOUND);
        expect(error.code).toBe(404);
        expect(error.message).toBe('Not found');
        expect(error.cause).toBeUndefined();
    });

    test('creates', () => {
        const error = ApiError.fromResponse(StatusCodes.NOT_FOUND, undefined);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(StatusCodes.NOT_FOUND);
        expect(error.code).toBe(0);
        expect(error.message).toBe('An unknown error has occurred. Please try again later.');
        expect(error.cause).toBeUndefined();
    });

});
