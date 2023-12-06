import * as validation from '..';
import { ValidationErrors } from '../ValidationErrors';

describe('validation (TODO)', () => {
    it('Validators', () => {
        expect(validation.Validators.notEmpty('')).toEqual(ValidationErrors.ShouldBeNonEmpty);
    });
});
