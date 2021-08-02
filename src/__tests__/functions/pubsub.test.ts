import { PubSub } from '../../server/pubsub/index';

describe('PubSub instance', () => {
    it('create trigger for a topic', () => {
        expect(() => {
            const pubsub = new PubSub.Topic('test');

            pubsub.publish({});
        }).not.toThrow();
    });
});
