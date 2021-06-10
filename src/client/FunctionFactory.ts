import type firebase from 'firebase';
import { IFunctionDefinition } from '../functions';
import { ILogger, createLogger } from '@zajno/common/lib/logger';

export class FunctionFactory<TArg, TResult> {

    private readonly logger: ILogger = null;

    constructor(readonly Definition: IFunctionDefinition<TArg, TResult>, private readonly firebaseFunctions: firebase.functions.Functions) {
        this.logger = createLogger(`[${Definition.CallableName}]`);
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
            this.logger.log('Executing with args:', processedArgs);

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
