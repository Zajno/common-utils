import type { pubsub, CloudFunction } from 'firebase-functions';
import logger, { createLogger, ILogger } from '@zajno/common/logger/index';
import { Event } from '@zajno/common/observing/event';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { createLazy } from '@zajno/common/lazy/light';
import type { PubSub as CloudPubSub, ClientConfig } from '@google-cloud/pubsub';
import { AppConfig } from '../../config';
import { EndpointSettings } from '../../functions/interface';
import { createTopicListener } from '../functions';
import { AnyObject } from '@zajno/common/types/misc';

export namespace PubSub {
    const topicCloudFunctions: Record<string, CloudFunction<pubsub.Message>> = { };
    let isCloudFunctionsInitialized: boolean = false;

    const Config: ClientConfig = {
        projectId: AppConfig.value?.appId,
    };

    const InstanceLazy = createLazy<CloudPubSub>(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PubSub } = require('@google-cloud/pubsub') as { PubSub: typeof CloudPubSub };
        return new PubSub(Config);
    });

    // const Instance = new CloudPubSub({ projectId: AppConfig.value?.appId });

    type ErrorHandlerFn = (e: Error) => void;
    let ErrorHandler: ErrorHandlerFn | null = null;

    export function useErrorHandler(handler: ErrorHandlerFn) {
        ErrorHandler = handler;
    }

    let STRICT_PUBLISH_MODE = true;

    export function setStrictPublishMode(strictMode: boolean) {
        STRICT_PUBLISH_MODE = strictMode;
    }

    export const getCloudFunctions = () => {
        isCloudFunctionsInitialized = true;

        return topicCloudFunctions;
    };

    export function preloadLibrary(config?: ClientConfig) {
        if (config) {
            if (InstanceLazy.hasValue) {
                logger.warn('Will not apply PubSub ClientConfig because library instance has been created already. config =', config);
            } else {
                Object.assign(Config, config);
            }
        }
        return InstanceLazy.value;
    }

    export class Topic<TData extends AnyObject> {
        private readonly _handler = new Event<TData>();

        private readonly _logger: ILogger;
        private _registration: LazyPromise<void> | null = null;

        constructor(private readonly name: string, private readonly options: EndpointSettings | null = null) {
            this._logger = createLogger(`[PubsubTopic:${name}]`);

            this.init();
        }

        public get handler() { return this._handler.expose(); }

        public addRegistration(lazyLoader: () => Promise<void>) {
            this._registration = new LazyPromise(lazyLoader);
            return this;
        }

        private init = () => {
            if (isCloudFunctionsInitialized) {
                this._logger.warn(`Topics has been exported already so publishing to this one (${this.name}) will be no-op`);
                return;
            }

            this.registerEndpoint();
        };

        private registerEndpoint = () => {
            const cloudFunction = createTopicListener(this.name, async (message, _) => {
                const data = message.json as TData;

                if (this._registration) {
                    await this._registration.promise;
                }

                let errors: Error[];

                try {
                    errors = await this._handler.triggerAsync(data) as any[];
                } catch (e) {
                    this._logger.error('Failed to execute trigger, error: ', e);
                    errors = [e as Error];
                }

                if (errors?.length && ErrorHandler != null) {
                    errors.forEach((error) => {
                        ErrorHandler?.(error);
                    });
                }
            }, this.options || { });

            if (!cloudFunction) {
                this._logger.warn('PubSub topic handler was not created. Adding function to firebase canceled');
                return null;
            }

            topicCloudFunctions[this.name] = cloudFunction;
        };

        async publish(data: TData) {
            if (STRICT_PUBLISH_MODE && !topicCloudFunctions[this.name]) {
                throw new Error('Trigger unsettled callback. Trigger canceled');
            }
            const topic = InstanceLazy.value.topic(this.name);

            try {
                await topic.publishMessage({ json: data });
            } catch (e) {
                this._logger.error('Failed to publish error ', e);
            }
        }
    }
}
