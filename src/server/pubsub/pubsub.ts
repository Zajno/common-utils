import * as functions from 'firebase-functions';
import { PubSub as CloudPubsSub } from '@google-cloud/pubsub';
import { createLogger, ILogger } from '@zajno/common/lib/logger';
import { FunctionsMemoryOptions } from 'functions/interface';
import { AppConfig } from '../../config';

export namespace PubSub {
    const Instance = new CloudPubsSub({ projectId: AppConfig.value?.appId });

    export class TopicDefinition<TData extends Object> {
        logger: ILogger = null;

        constructor (readonly name: string, readonly timeout: number = 60, readonly memory: FunctionsMemoryOptions = '256MB') {
            this.logger = createLogger(`[PubSub:${name}]`);
        }

        async publish (data: TData) {
            const topic = Instance.topic(this.name);

            try {
                await topic.publishJSON(data);
            } catch (e) {
                this.logger.error('Failed to publish error ', e);
            }
        }

        createTrigger (handler: (d: TData) => (void | Promise<void>)) {
            const builder = functions.runWith({ timeoutSeconds: this.timeout, memory: this.memory });

            return builder.pubsub.topic(this.name).onPublish(async (message, _) => {
                const data = message.json as TData;

                try {
                    await handler(data);
                } catch (e) {
                    this.logger.error('Failed to execute trigger, error: ', e);
                }
            });
        }
    }
}
