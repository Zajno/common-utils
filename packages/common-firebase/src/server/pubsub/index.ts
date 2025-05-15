import type { pubsub, CloudFunction } from 'firebase-functions/v1';
import type { ClientConfig } from '@google-cloud/pubsub';
import { Event } from '@zajno/common/observing/event';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { AnyObject } from '@zajno/common/types/misc';
import { LoggerProvider, type ILoggerFactory } from '@zajno/common/logger';
import { createLazy } from '@zajno/common/lazy';
import { EndpointSettings } from '../../functions/interface.js';
import { createTopicListener } from '../functions/index.js';

export namespace PubSub {

    export type Config = Pick<ClientConfig, 'projectId'>;
    type ErrorHandlerFn = (e: Error) => void;

    export class Manager {

        private readonly _logging = new LoggerProvider();
        private STRICT_PUBLISH_MODE = true;
        private isCloudFunctionsInitialized: boolean = false;
        private ErrorHandler: ErrorHandlerFn | null = null;

        private topicCloudFunctions: Record<string, CloudFunction<pubsub.Message>> = {};

        private readonly _instanceLoader = new LazyPromise(async () => {
            const { PubSub } = await import('@google-cloud/pubsub');
            return new PubSub(this.config);
        });

        constructor(private readonly config: Config) { }

        public setLoggerFactory(factory: ILoggerFactory) {
            this._logging.setLoggerFactory(factory, '[PubSub]');
            return this;
        }

        public setStrictPublishMode(strictMode: boolean) {
            this.STRICT_PUBLISH_MODE = strictMode;
            return this;
        }

        public setErrorHandler(handler: ErrorHandlerFn) {
            this.ErrorHandler = handler;
            return this;
        }

        public exportCloudFunctions() {
            this.isCloudFunctionsInitialized = true;

            return this.topicCloudFunctions;
        }

        public createTopic<TData extends AnyObject>(name: string, options?: EndpointSettings | null) {
            const logger = createLazy(() => this._logging.createLogger(`[PubSubTopic:${name}]`));
            const _handler = new Event<TData>();
            let _registration: LazyPromise<void> | null = null;

            if (this.isCloudFunctionsInitialized) {
                logger.value?.warn(`Topics has been exported already so publishing to this one (${name}) will be no-op`);
            } else {
                const cloudFunction = createTopicListener(name, async (message, _) => {
                    const data = message.json as TData;

                    if (_registration) {
                        await _registration.promise;
                    }

                    let errors: Error[];

                    try {
                        errors = await _handler.triggerAsync(data) as any[];
                    } catch (e) {
                        logger.value?.error('Failed to execute trigger, error: ', e);
                        errors = [e as Error];
                    }

                    if (errors?.length && this.ErrorHandler != null) {
                        errors.forEach((error) => {
                            this.ErrorHandler?.(error);
                        });
                    }
                }, options || {});

                if (!cloudFunction) {
                    logger.value?.warn('PubSub topic handler was not created. Adding function to firebase canceled');
                    return null;
                }

                this.topicCloudFunctions[name] = cloudFunction;
            }

            const publish = async (data: TData) => {
                if (this.STRICT_PUBLISH_MODE && !this.topicCloudFunctions[name]) {
                    throw new Error('Trigger unsettled callback. Trigger canceled');
                }

                const pubsub = await this._instanceLoader.promise;
                const topic = pubsub.topic(name);

                try {
                    await topic.publishMessage({ json: data });
                } catch (e) {
                    logger.value?.error('Failed to publish error ', e);
                }
            };

            return {
                get handler() { return _handler.expose(); },
                addRegistration(lazyLoader: () => Promise<void>) {
                    _registration = new LazyPromise(lazyLoader);
                    return this;
                },
                publish,
            };
        }
    }
}
