import { Model } from '@zajno/common/lib/viewModels/Model';
import type { EndpointSettings } from '../../functions/interface';

export const GlobalRuntimeOptions = new Model<EndpointSettings>({
    timeoutSeconds: 60,
    memory: '256MB',
});
