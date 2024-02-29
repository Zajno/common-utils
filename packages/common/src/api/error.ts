import { StatusCodes } from './statusCodes';

export type ApiErrorResponse<TCause = never, TErrors = number | string> = {
    code?: TErrors,
    message?: string,
} & ([TCause] extends [never] ? object : { cause?: TCause });

export namespace ApiErrorResponse {
    export function create<TCause = never, TErrors = number | string>(code: TErrors, message?: string, cause?: TCause): ApiErrorResponse<TCause, TErrors> {
        return { code, message, cause };
    }
}


export class ApiError<
    TCause = unknown,
    TCodes = StatusCodes,
    TErrors = number | string,
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

    public static fromResponse<TCodes = StatusCodes, TErrors = number | string>(status: TCodes, responseData: unknown) {
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
