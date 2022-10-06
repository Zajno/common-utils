import type firebase from 'firebase';
import { IFunctionDefinition } from '../functions';
import { IFunctionDefinitionInfo } from '../functions/interface';
import { ILogger, createLogger } from '@zajno/common/lib/logger';
import { Event, IEvent } from '@zajno/common/lib/event';

const _onFactoryCreated = new Event<FunctionFactoryHook>();

export const OnFactoryCreated: IEvent<FunctionFactoryHook> = _onFactoryCreated;

export type FunctionFactoryHook = {
    readonly definition: IFunctionDefinitionInfo;
    addMeta(meta: any): void;
};

export class FunctionFactory<TArg, TResult> {

    private readonly logger: ILogger = null;
    private _meta: any = null;

    constructor(readonly Definition: IFunctionDefinition<TArg, TResult>, private readonly firebaseFunctions: firebase.functions.Functions) {
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
        const DefinitionFunction = this.Definition.Function;
        const start = Date.now();
        try {
            const fn: typeof DefinitionFunction = this.firebaseFunctions.httpsCallable(
                this.Definition.CallableName,
                {
                    timeout: (this.Definition.Timeout || 60) * 1000,
                },
            );
            const processedArgs = await this.Definition.ArgProcessor(arg);
            this.logger.log('Executing with args:', processedArgs, ...(this._meta ? ['with meta:', this._meta] : []));

            if (this._meta != null) {
                if ((processedArgs as any).__meta != null) {
                    this.logger.warn('Skipping adding metadata because field "__meta" is occupied already:', (processedArgs as any).__meta);
                } else {
                    Object.assign(processedArgs, { __meta: this._meta });
                }
            }

            const res = await fn(processedArgs);

            const data = await this.Definition.ResultProcessor(res.data);

            this.logger.log('Succeed with result in', Date.now() - start, 'ms =>', data);

            return data;
        } catch (err) {
            this.logger.warn('Failed with error after', Date.now() - start, 'ms, see details below.', { code: err.code, message: err.message, details: err.details });
            // eslint-disable-next-line no-console
            console.error(err);
            throw err;
        }
    }
}
