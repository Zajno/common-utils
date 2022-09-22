import * as validation from '..';
import { ValidationErrors } from '../ValidationErrors';
import { faker } from '@faker-js/faker';
import fc from 'fast-check';
import { toArbitrary } from '../../__tests__/helpers/main';

describe('validation websites', () => {
    it('test', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.None);
            }),
        );
    });

    it('test domain name', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.internet.domainName());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.None);
            }),
        );
    });

    it('test hard domain name', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => `${ faker.internet.domainWord() }.${ faker.internet.domainName() }`);

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.None);
            }),
        );
    });

    it('test domainWord', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.internet.domainWord());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.Website);
            }),
        );
    });

    it('test domainWord with dot', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => `${ faker.internet.domainWord() }.`);

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.Website);
            }),
        );
    });

    it('test email', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.internet.email());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.Website);
            }),
        );
    });

    it('test ip', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.internet.ip());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.Website);
            }),
        );
    });

    it('test website with directory path', () => {
        const _url: fc.Arbitrary<string> = toArbitrary(() => faker.image.imageUrl());

        fc.assert(
            fc.property(_url, (url) => {
                expect(validation.Validators.website(url)).toEqual(ValidationErrors.None);
            }),
        );
    });

    it('long valid website with two dots', () => {
        expect(validation.Validators.website('ivanivanivanivanivanivanivanivan.zajno.comcomcomcomcomcomcom')).toEqual(ValidationErrors.None);
    });

    it('valid website with directory path', () => {
        expect(validation.Validators.website('http://www.regexbuddy.com/index.html?source=library')).toEqual(ValidationErrors.None);
    });

    it('valid website with many dashes', () => {
        expect(validation.Validators.website('https://www.test-test-test-test.com')).toEqual(ValidationErrors.None);
    });

    it('valid website with short domain', () => {
        expect(validation.Validators.website('https://t.me')).toEqual(ValidationErrors.None);
    });

    it('test url with few dashes in a row', () => {
        expect(validation.Validators.website('https://dashedurl-------.com')).toEqual(ValidationErrors.Website);
    });
});
