import type { ApiEndpoint } from '../endpoint.js';
import type { IEndpointInfo } from '../endpoint.types.js';

export interface IEndpointInputValidation {
    readonly validate?: IEndpointInputValidation.Validator<IEndpointInfo.ExtractIn<this>>;

    withValidation(validator: IEndpointInputValidation.Validator<IEndpointInfo.ExtractIn<this>>): this;
}

export namespace IEndpointInputValidation {
    export type Validator<TIn> = (input: TIn) => Promise<void> | void;

    export const extender: ApiEndpoint.IBuilderExtender<IEndpointInputValidation> = <T extends ApiEndpoint>(base: T) => {

        const ext = {
            validate: undefined,
            withValidation(this: { validate: unknown }, validate: Validator<IEndpointInfo.ExtractIn<T>>) {
                this.validate = validate;
                return this as T & IEndpointInputValidation;
            },
        } as IEndpointInputValidation;
        return Object.assign(base, ext);
    };

    export function guard(api: IEndpointInfo): api is (IEndpointInfo & IEndpointInputValidation) {
        return 'validate' in api;
    }

    export function tryValidate(api: IEndpointInfo, input: IEndpointInfo.ExtractIn<IEndpointInfo>) {
        if (guard(api) && api.validate) {
            return api.validate(input);
        }
    }
}
