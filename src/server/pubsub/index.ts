import * as functions from 'firebase-functions';
import { PubSub as CloudPubsSub } from '@google-cloud/pubsub';
import { createLogger, ILogger } from '@zajno/common/lib/logger';
import { FunctionsMemoryOptions } from '../../functions/interface';
import { AppConfig } from '../../config';
import { TopicBuilder } from 'firebase-functions/lib/providers/pubsub';
import { Event } from '@zajno/common/lib/event';

export namespace PubSub {
    export const topicCloudFunctions = {}; // values
    let isCloudFunctionsInitialized: boolean = false;

    const Instance: CloudPubsSub = new CloudPubsSub({ projectId: AppConfig.value?.appId });

    let ErrorHandler: Function | null = null;

    export function useErrorHandler(handler: (error: any) => void) {
        ErrorHandler = handler;
    }

    export const getCloudFunctions = () => {
        isCloudFunctionsInitialized = true;

        return topicCloudFunctions;
    };
    export class Topic<TData extends Object> {
        private readonly _handler = new Event<TData>();

        private _logger: ILogger = null;

        constructor (private readonly name: string, private readonly timeout: number = 60, private readonly memory: FunctionsMemoryOptions = '256MB', private readonly retry: boolean = false) {
            this._logger = createLogger(`[Pubsub topic:${name}]`);

            this.topicInitialize();
        }

        public get handler() { return this._handler.expose(); }

        private topicInitialize = () => {
            if (isCloudFunctionsInitialized) {
                this._logger.warn(`Topics has been exported already so publishing to this one (${this.name}) will be no-op`);
                return;
            }

            const createdTopic: TopicBuilder = this.createTopic();

            this.setTopicHandler(createdTopic);
        };

        private createTopic = () => {
            const builder = functions.runWith({ timeoutSeconds: this.timeout, memory: this.memory, failurePolicy: this.retry });

            return builder.pubsub.topic(this.name);
        };

        private setTopicHandler = (builder: TopicBuilder) => {
            if (!builder) {
                this._logger.warn('Topic builder not initialized. Create topic handler canceled');
                return null;
            }

            const cloudFunction = builder.onPublish(async (message, _) => {
                const data = message.json as TData;

                let errors: any[] | null = null;

                try {
                    errors = await this._handler.triggerAsync(data) as any[];
                } catch (e) {
                    this._logger.error('Failed to execute trigger, error: ', e);
                }

                if (errors && ErrorHandler) {
                    errors.forEach((error) => {
                        ErrorHandler(error);
                    });
                }
            });

            if (!cloudFunction) {
                this._logger.warn('CloudFunction don\'t created. Add function to firebase canceled');
                return null;
            }

            topicCloudFunctions[this.name] = cloudFunction;
        };

        async publish (data: TData) {
            if (!topicCloudFunctions[this.name]) {
                throw new Error('Trigger unsettled callback. Trigger canceled');
            }

            const topic = Instance.topic(this.name);

            try {
                await topic.publishJSON(data);
            } catch (e) {
                this._logger.error('Failed to publish error ', e);
            }
        }
    }
}
