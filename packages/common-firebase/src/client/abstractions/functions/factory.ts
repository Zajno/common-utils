import { ILogger, createLogger } from '@zajno/common/logger';
import { Event, IEvent } from '@zajno/common/observing/event';

import type { IFunctionWorker, IFunctionDefinition, IFunctionDefinitionInfo, IFunctionsError } from './types.js';
import type { FunctionType } from '../../../functions/interface.js';
import { META_ARG_KEY } from '../../../functions/composite.js';

const _onFactoryCreated = new Event<FunctionFactoryHook>();

export const OnFactoryCreated: IEvent<FunctionFactoryHook> = _onFactoryCreated;

export type FunctionFactoryHook = {
    readonly definition: IFunctionDefinitionInfo;
    addMeta(meta: any): void;
};

export interface IFirebaseFunctionsProvider {
    createCallable<TArg, TResult>(definition: IFunctionDefinition<TArg, TResult>): FunctionType<TArg, TResult>;
}

export class FunctionFactory<TArg, TResult> implements IFunctionWorker<TArg, TResult> {

    private readonly logger: ILogger;
    private _meta: any = null;

    constructor(readonly functions: IFirebaseFunctionsProvider, readonly Definition: IFunctionDefinition<TArg, TResult>) {
        this.logger = createLogger(`[${Definition.CallableName}]`);

        _onFactoryCreated.trigger({
            definition: Definition,
            addMeta: meta => this.addMeta(meta),
        });
    }

    addMeta<TMeta>(meta?: TMeta) {
        this._meta = meta;
        return this;
    }

    async execute(arg: TArg): Promise<TResult> {
        const start = Date.now();
        try {
            const fn = this.functions.createCallable(this.Definition);
            const processedArgs = await this.Definition.ArgProcessor(arg);
            this.logger.log('Executing with args:', processedArgs, ...(this._meta ? ['with meta:', this._meta] : []));

            if (this._meta != null) {
                const existing = processedArgs[META_ARG_KEY];
                if (existing != null) {
                    this.logger.warn(`Skipping adding metadata because field "${META_ARG_KEY}" is occupied already:`, existing);
                } else {
                    Object.assign(processedArgs, { [META_ARG_KEY]: this._meta });
                }
            }

            const res = await fn(processedArgs);

            const data = await this.Definition.ResultProcessor(res.data);

            this.logger.log('Succeed with result in', Date.now() - start, 'ms =>', data);

            return data;
        } catch (err) {
            const e = err as IFunctionsError;
            this.logger.warn(
                'Failed with error after',
                Date.now() - start,
                'ms, see details below.',
                {
                    code: e.code,
                    message: e.message,
                    details: e.details,
                });
            // eslint-disable-next-line no-console
            console.error(err);
            throw err;
        }
    }
}
