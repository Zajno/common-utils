import * as functions from 'firebase-functions';
import { PubSub as CloudPubsSub } from '@google-cloud/pubsub';
import { createLogger, ILogger } from '@zajno/common/lib/logger';
import { FunctionsMemoryOptions } from '../../functions/interface';
import { AppConfig } from '../../config';
import { TopicBuilder } from 'firebase-functions/lib/providers/pubsub';
import { Event } from '@zajno/common/lib/event';

export namespace PubSub {
    export const topicCloudFunctions = {}; // values
    export let isCloudFunctionsInitialized: boolean = false;

    const Instance: CloudPubsSub = new CloudPubsSub({ projectId: AppConfig.value?.appId });

    export const getCloudFunctions = () => {
        isCloudFunctionsInitialized = true;

        return topicCloudFunctions;
    };

    export class Topic<TData extends Object> {
        private readonly _onHandlerCalled = new Event<TData>();

        private _logger: ILogger = null;

        constructor (private readonly name: string, private readonly timeout: number = 60, private readonly memory: FunctionsMemoryOptions = '256MB') {
            this._logger = createLogger(`[Pubsub topic:${name}]`);

            this.topicInitialize();
        }

        public get onHandlerCalled() { return this._onHandlerCalled.expose(); }

        private topicInitialize = () => {
            if (isCloudFunctionsInitialized) {
                throw new Error('CloudFunctions initialized! Topic don\'t created');
            }

            const createdTopic: TopicBuilder = this.createTopic();

            this.setTopicHandler(createdTopic);
        };

        private createTopic = () => {
            const builder = functions.runWith({ timeoutSeconds: this.timeout, memory: this.memory });

            return builder.pubsub.topic(this.name);
        };

        private setTopicHandler = (builder: TopicBuilder) => {
            if (!builder) {
                this._logger.warn('Topic builder not initialized. Create topic handler canceled');
                return null;
            }

            const cloudFunction = builder.onPublish(async (message, _) => {
                const data = message.json as TData;

                try {
                    await this._onHandlerCalled.triggerAsync(data);
                } catch (e) {
                    this._logger.error('Failed to execute trigger, error: ', e);
                }
            });

            if (!cloudFunction) {
                this._logger.warn('CloudFunction don\'t created. Add function to firebase canceled');
                return null;
            }

            topicCloudFunctions[this.name] = cloudFunction;
        };

        async triggerTopicHandler (data: TData) {
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
