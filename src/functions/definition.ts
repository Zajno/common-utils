import {
    IFunctionDefinition,
    Converter,
    Processor,
    FunctionsMemoryOptions,
    FunctionType,
} from './interface';

export class FunctionDefinition<TArg, TResult> implements IFunctionDefinition<TArg, TResult> {
    readonly Function: FunctionType<TArg, TResult> = null;

    readonly Arg: TArg = null;
    readonly Result: TResult = null;

    private _argProcessor: Processor<TArg, any> = a => a;
    private _resultProcessor: Processor<any, TResult> = r => r as TResult;

    public get ArgProcessor() { return this._argProcessor; }
    public get ResultProcessor() { return this._resultProcessor; }

    public get DisplayName() { return `${this.Namespace || 'global'}:${this.Name}`; }
    public get CallableName() { return this.Namespace ? `${this.Namespace}-${this.Name}` : this.Name; }

    constructor(
        readonly Name: string,
        readonly Namespace: string = '',
        readonly Timeout = 60,
        readonly Memory: FunctionsMemoryOptions = '256MB',
    ) {
    }

    public specify<TArg2, TResult2 = TResult>(
        argConverter?: Converter<TArg2, TArg>,
        resConverter?: Converter<TResult, TResult2>,
    ): FunctionDefinition<TArg2, TResult2> {
        return new FunctionDefinition<TArg2, TResult2>(this.Name, this.Namespace, this.Timeout, this.Memory)
            .addArgProcessor(argConverter)
            .addResultProcessor(resConverter);
    }

    public addArgProcessor(processArg: Processor<TArg, any>) {
        if (processArg) {
            this._argProcessor = processArg;
        }
        return this;
    }

    public addResultProcessor(processRes: Processor<any, TResult>) {
        if (processRes) {
            this._resultProcessor = processRes;
        }
        return this;
    }
}
