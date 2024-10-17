import {
    connectFunctionsEmulator,
    getFunctions,
    httpsCallable,
} from 'firebase/functions';

import { FirebaseApp, createFirebaseLazy, logger } from './app.js';
import type { IFirebaseFunctions, IFunctionDefinition, IFirebaseFunctionsProvider, IFunctionWorker } from '../abstractions/functions/index.js';
import { FunctionFactory } from '../abstractions/functions/index.js';

export const FunctionsRaw = createFirebaseLazy(() => {
    const { functionsEmulator } = FirebaseApp.Settings;

    const fns = getFunctions(FirebaseApp.Current);

    if (functionsEmulator?.url) {
        const { hostname, port } = new URL(functionsEmulator.url);
        logger.log('Firebase functions will use emulator:', functionsEmulator.url, '=>', hostname, port);
        connectFunctionsEmulator(fns, hostname, +port);
    }

    return fns;
});

const CallableFactory: IFirebaseFunctionsProvider = {
    createCallable<TArg, TResult>(this: void, definition: IFunctionDefinition<TArg, TResult>) {
        const timeout = typeof definition.Options?.timeoutSeconds === 'number'
            ? definition.Options.timeoutSeconds * 1000
            : 60_000;

        return httpsCallable(
            FunctionsRaw.value,
            definition.CallableName,
            {
                timeout,
            },
        );
    },
};

export const Functions: IFirebaseFunctions = {
    create: function <TArg, TResult>(definition: IFunctionDefinition<TArg, TResult>): IFunctionWorker<TArg, TResult> {
        return new FunctionFactory<TArg, TResult>(CallableFactory, definition);
    },
};
