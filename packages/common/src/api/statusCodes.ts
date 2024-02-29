
export enum StatusCodes {
    OK = 200,
    CREATED = 201,

    FOUND = 302,
    NOT_MODIFIED = 304,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,

    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,

    CONFLICT = 409,

    PRECONDITION_FAILED = 412,
    UPGRADE_REQUIRED = 426,

    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503,
}
