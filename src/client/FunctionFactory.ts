import type firebase from 'firebase';
import { FunctionDefinition } from '../abstractions/functions';
import { ILogger, createLogger } from '@zajno/common/lib/logger';

export class FunctionFactory<TArg, TResult> {

    private readonly logger: ILogger;

    constructor(readonly Definition: FunctionDefinition<TArg, TResult>, private readonly firebaseFunctions: firebase.functions.Functions) {
        this.logger = createLogger(`[${Definition.CallableName}]`);
    }

    async execute(arg: TArg): Promise<TResult> {
        const DefinitionFunction = this.Definition.Function;
        try {
            const fn: typeof DefinitionFunction = this.firebaseFunctions.httpsCallable(
                this.Definition.CallableName,
                {
                    timeout: (this.Definition.Timeout || 60) * 1000,
                },
            );
            const processedArgs = await this.Definition.ArgProcessor(arg);
            const start = Date.now();
            this.logger.log('Executing with args:', processedArgs);

            const res = await fn(processedArgs);

            const data = await this.Definition.ResultProcessor(res.data);

            this.logger.log('Succeed with result in', Date.now() - start, 'ms =>', data);

            return data;
        } catch (err) {
            this.logger.warn('Failed with error, see details below.', { code: err.code, message: err.message, details: err.details });
            // eslint-disable-next-line no-console
            console.error(err);
            throw err;
        }
    }
}
