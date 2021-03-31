import firebase from 'firebase';
import { FunctionDefinition } from '../abstractions/functions';
import { ILogger, createLogger } from '@zajno/common/lib/logger';

export class FunctionFactory<TArg, TResult> {

    private readonly logger: ILogger;

    constructor(readonly Definition: FunctionDefinition<TArg, TResult>, private readonly firebaseFunctions: firebase.functions.Functions) {
        this.logger = createLogger(`[${Definition.Namespace || 'global'}:${Definition.Name}]`);
    }

    async execute(arg: TArg): Promise<TResult> {
        const DefintionFunction = this.Definition.Function;
        try {
            const fn: typeof DefintionFunction = this.firebaseFunctions.httpsCallable(
                this.Definition.FullName,
                {
                    timeout: (this.Definition.Timeout || 60) * 1000,
                },
            );
            const processedArgs = this.Definition.ArgProrcessor(arg);
            const start = Date.now();
            this.logger.log('Executing with args:', processedArgs);
            const res = await fn(processedArgs);
            const data = this.Definition.ResultProcessor(res.data);
            this.logger.log('Succeed with result in', Date.now() - start, 'ms =>', data);
            return data;
        } catch (err) {
            this.logger.warn('Failed with error, see details below', err.message);
            // eslint-disable-next-line no-console
            console.error(err);
            throw err;
        }
    }
}
