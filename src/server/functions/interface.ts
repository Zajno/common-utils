import * as functions from 'firebase-functions';
import { IFunctionDefinitionInfo } from '../../functions/interface';

export type EndpointContext<T = never> = functions.https.CallableContext & {
    data?: T;
};

export type EndpointFunction<T, TOut, TContext = never> = { debugName?: string }
    & ((data: T, context: EndpointContext<TContext>) => Promise<TOut>);

export type HandlerContext<TArg, TOut, TContext = never> = EndpointContext<TContext> & {
    input: TArg,
    output: TOut,
};

export type NextFunction = () => Promise<void>;

export type EndpointHandler<TArg, TOut, TContext = never> = {
    (ctx: HandlerContext<TArg, TOut, TContext>, next: NextFunction): Promise<void>;
};

type OmitSecondParameter<T> = T extends (first: infer F, second: any, ...last: infer L) => infer R ? (first: F, ...last: L) => R : never;

export type EndpointHandlerVoid<TArg, TOut, TContext = never> = OmitSecondParameter<EndpointHandler<TArg, TOut, TContext>>;

export type FirebaseEndpoint = functions.HttpsFunction & functions.Runnable<any>;

export interface IFirebaseFunction {
    readonly Definition: IFunctionDefinitionInfo;
    readonly Endpoint: FirebaseEndpoint;
}

export namespace IFirebaseFunction {
    export function addTo(this: void, target: any, namespaceLevel: boolean, ...funcs: IFirebaseFunction[]) {
        if (!target) {
            return;
        }

        funcs.forEach(f => {
            let tt: any = target;
            if (namespaceLevel) {
                tt = target[f.Definition.Namespace];
                if (!tt) {
                    tt = { };
                    target[f.Definition.Namespace] = tt;
                }
            }

            if (tt[f.Definition.Name]) {
                throw new Error('Redefining function: ' + f.Definition.CallableName);
            }

            tt[f.Definition.Name] = f.Endpoint;
        });
    }
}

