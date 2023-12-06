
export interface IPluggableController {

    readonly enabled: boolean;

    setEnabledAsync(enabled: boolean): Promise<void>;
}
