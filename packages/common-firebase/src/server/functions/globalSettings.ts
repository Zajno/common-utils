import { Model } from '@zajno/common/models/Model';
import type { EndpointSettings } from '../../functions/interface.js';

export const GlobalRuntimeOptions = new Model<EndpointSettings>({
    timeoutSeconds: 60,
    memory: '256MB',
});
