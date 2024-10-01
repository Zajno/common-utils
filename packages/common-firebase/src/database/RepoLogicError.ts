
export class RepoLogicError extends Error {
    constructor(readonly type: RepoLogicError.Types, message: string) {
        super(message);
    }

    static InvalidArg(argName: string, info?: { expected: any, got: any }) {
        const infoStr = info ? `Expected '${info.expected}', but got '${info.got}'` : '';
        return new RepoLogicError(RepoLogicError.Types.InvalidArgs, `Invalid '${argName}' argument. ${infoStr}`);
    }

    static AlreadyExists(message: string) {
        return new RepoLogicError(RepoLogicError.Types.AlreadyExists, message);
    }

    static OnlyOne(path: string, query: string) {
        return new RepoLogicError(RepoLogicError.Types.OnlyOne, `Requested query '${query}' for path '${path}' returned not the only item`);
    }
}

export namespace RepoLogicError {
    export enum Types {
        Unknown,
        InvalidArgs,
        AlreadyExists,
        OnlyOne,
    }
}
