import * as validation from '../index.js';
import { ValidationErrors } from '../ValidationErrors.js';

describe('validation (TODO)', () => {
    it('Validators', () => {
        expect(validation.Validators.notEmpty('')).toEqual(ValidationErrors.ShouldBeNonEmpty);
    });
});
