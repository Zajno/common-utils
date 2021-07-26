import { PubSub } from '../../server/pubsub/pubsub';

describe('PubSub instance', () => {
    it('create trigger for a topic', () => {
        expect(() => {
            const pubsub = new PubSub.TopicDefinition('test');

            pubsub.createTrigger(() => { return; });
        }).not.toThrow();
    });
});
