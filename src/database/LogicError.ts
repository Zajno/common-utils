
export class LogicError extends Error {
    constructor(readonly type: LogicError.Types, message: string) {
        super(message);
    }

    static InvalidArg(argname: string, info: { expected: any, got: any } = null) {
        const infoStr = info ? `Expected '${info.expected}', but got '${info.got}'` : '';
        return new LogicError(LogicError.Types.InvalidArgs, `Invalid '${argname}' argument. ${infoStr}`);
    }

    static AlreadyExists(message: string) {
        return new LogicError(LogicError.Types.AlreadyExists, message);
    }

    static OnlyOne(path: string, query: string) {
        return new LogicError(LogicError.Types.OnlyOne, `Requested query '${query}' for path '${path}' returned not the only item`);
    }
}

export namespace LogicError {
    export enum Types {
        Unknown,
        InvalidArgs,
        AlreadyExists,
        OnlyOne,
    }
}

export default LogicError;
