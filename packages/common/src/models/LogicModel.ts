import { ExclusiveLoadingError, LoadingModel, withLoading } from './Loading.js';
import { Getter, Nullable } from '../types/index.js';
import { PromiseExtended } from '../structures/promiseExtended.js';
import { createLogger, ILogger } from '../logger/index.js';

export type ActionRunOptions = {
    /** Action name, required for logging and joining. */
    name?: string;

    /** If set to truthy, will not start an action if another is still in progress.
     * Additionally, if set to 'throw', will throw an error. Otherwise, will return undefined.
     *
     * Note: if a current action runs in an exclusive mode, but the next one is not, the next one will still be allowed.
    */
    exclusive?: boolean | 'throw';

    /** If an action with the same name (should be specified) runs already, this action is skipped:
     * - 'cancel' - this action is skipped immediately, no result returned;
     * - 'merge' - this action waits for the previous one to finish and returns its result;
    */
    join?: 'merge' | 'cancel';

    /** If set to true, loading indicator will not be increased, and exclusiveness will not be checked. */
    noLoading?: boolean;

    /** Whether to disable logging for the action. */
    noLogs?: boolean;
};


export class LogicModel {

    protected readonly _loading: LoadingModel;

    public get isLoading(): boolean { return this._loading.isLoading; }

    protected logger: ILogger;

    private readonly _namedRunners = new Map<string, Promise<unknown>>();
    private readonly _runningActionNames = new Set<string>();

    constructor(name?: string, useFirstInit = true) {
        this.logger = createLogger(`[${name || this.constructor.name}]`);
        this._loading = this.pureConstructLoadingModel(useFirstInit);
    }

    protected pureConstructLoadingModel(useFirstInit: boolean): LoadingModel {
        return new LoadingModel(useFirstInit);
    }

    protected runAction<T = unknown>(worker: () => Promise<T>, options: ActionRunOptions = {}, errorCtx?: Getter<unknown>): ActionResult<T> {
        const started = Date.now();
        const name = options.name;
        if (name && !options.noLogs) {
            this.logger.log(`runAction "${name}" started...`);
        }

        const runner = async () => {
            const { exclusive = false, noLoading = false, join } = options;

            let existingRunner: Promise<unknown> | undefined;
            if (join && name) {
                existingRunner = this._namedRunners.get(name);
                if (existingRunner != null) {
                    if (join === 'cancel') {
                        if (!options.noLogs) {
                            this.logger.warn(`runAction "${name}" has been skipped because another instance of it is in progress`);
                        }
                        return undefined;
                    } else if (join === 'merge') {
                        if (!options.noLogs) {
                            this.logger.log(`runAction "${name}" merging with existing instance...`);
                        }
                        return existingRunner as ReturnType<typeof worker>;
                    }
                }
            }

            const wrapWorker = async () => {
                const storedName = name || `<unnamed:${Date.now()}>`;
                this._runningActionNames.add(storedName);

                try {
                    let result: T | undefined;
                    if (!noLoading) {
                        const resultWithLoading = await withLoading(this._loading, worker, !!exclusive);
                        if (resultWithLoading.aborted) {
                            const othersNames = Array.from(this._runningActionNames, n => `"${n}"`).join(', ') || '<?>';
                            const message = `runAction(exclusive=${exclusive}): "${storedName}" has been skipped, others in progress: ${othersNames}`;
                            if (exclusive === 'throw') {
                                throw new ExclusiveLoadingError(message, storedName);
                            }

                            this.logger.warn(message);
                            return undefined;
                        }
                        result = resultWithLoading.result;
                    } else {
                        result = await worker();
                    }

                    if (name && !options.noLogs) {
                        this.logger.log(`runAction "${storedName}" succeed in ${Date.now() - started}ms`);
                    }
                    return result;
                } finally {
                    this._runningActionNames.delete(storedName);
                }
            };

            const wrapped = wrapWorker();
            if (!name) {
                return await wrapped;
            }

            try {
                this._namedRunners.set(name, wrapped);
                return await wrapped;
            } finally {
                this._namedRunners.delete(name);
            }
        };

        return ActionResult.expectExclusive(PromiseExtended.run(runner))
            .onError(data => {
                this.logger.error(...formatError({
                    name,
                    err: data.source,
                    errorCtx,
                    elapsed: Date.now() - started,
                }));
            });
    }
}

type ErrorData = {
    name: Nullable<string>;
    err: Error | Error[];
    errorCtx?: Getter<unknown>;
    elapsed: number;
};

function formatError(this: void, { name, err, errorCtx, elapsed }: ErrorData) {
    const prepend = (val: unknown, ...strs: string[]) => (val ? [...strs, ...(Array.isArray(val) ? val : [val])] : [null]);
    const getErrorCause = () => {
        if (!err) {
            return [''];
        }

        if (Array.isArray(err)) {
            return err.map(e => e.cause ?? '');
        }
        return [err.cause ?? ''];
    };

    return [
        `runAction "${name || '<unnamed>'}" got an error(s) after ${elapsed}ms:`,
        err,
        ...prepend(getErrorCause(), '\nCause:'),
        ...prepend(Getter.toValue(errorCtx), '\nContext:'),
    ];
}

export type ActionResult<T, TCustomErrors extends Record<string, unknown> = Record<never, unknown>> = ReturnType<typeof ActionResult.expectExclusive<T | undefined, TCustomErrors>>;

export namespace ActionResult {
    export type Expect = { exclusive: ExclusiveLoadingError };

    export namespace Expect {
        export const Config = {
            name: 'exclusive',
            ErrCtor: ExclusiveLoadingError,
        } as const;
    }

    export const expectExclusive = PromiseExtended.ErrorConfig.createExpecter(Expect.Config);

    export function createSucceeded<T>(data: T): ActionResult<T> {
        return expectExclusive(PromiseExtended.succeeded(data));
    }
}
