import {
    IFunctionDefinition,
    Converter,
    EndpointSettings,
    FunctionType,
} from './interface';

export class FunctionDefinition<TArg, TResult> implements IFunctionDefinition<TArg, TResult> {
    readonly Function: FunctionType<TArg, TResult> = null as any;

    readonly Arg: TArg = null as any;
    readonly Result: TResult = null as any;

    private _argProcessor: Converter<TArg, any> = a => a;
    private _resultProcessor: Converter<any, TResult> = r => r as TResult;

    public get ArgProcessor() { return this._argProcessor; }
    public get ResultProcessor() { return this._resultProcessor; }

    public get DisplayName() { return `${this.Namespace || 'global'}:${this.Name}`; }
    public get CallableName() { return this.Namespace ? `${this.Namespace}-${this.Name}` : this.Name; }

    constructor(
        readonly Name: string,
        readonly Namespace: string = '',
        readonly Options: EndpointSettings = { },
    ) {
    }

    public specify<TArg2, TResult2 = TResult>(
        argConverter?: Converter<TArg2, TArg>,
        resConverter?: Converter<TResult, TResult2>,
    ): FunctionDefinition<TArg2, TResult2> {

        const currentArgProc = this._argProcessor;
        const currentResProc = this._resultProcessor;

        return new FunctionDefinition<TArg2, TResult2>(this.Name, this.Namespace, this.Options)
            .addArgProcessor(argConverter ? (a => currentArgProc(argConverter(a))) : null)
            .addResultProcessor(resConverter ? (r => resConverter(currentResProc(r))) : null);
    }

    public addArgProcessor(processArg: Converter<TArg, any> | null) {
        if (processArg) {
            this._argProcessor = processArg;
        }
        return this;
    }

    public addResultProcessor(processRes: Converter<any, TResult> | null) {
        if (processRes) {
            this._resultProcessor = processRes;
        }
        return this;
    }
}
