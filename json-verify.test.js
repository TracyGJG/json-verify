import verify, {
	isNumber,
	isString,
	isValue,
	isWhitespace,
	isArray,
	isObject,
} from './json-verify';

/*
const EMPTY_STRING = '';
const SPACE_STRING = ' ';
const TAB_STRING = '    ';
const NEWLINE_STRING = `
`;

const ARRAY_STRING = (content = EMPTY_STRING) => `[${content}]`;
const OBJECT_STRING = (content = EMPTY_STRING) => `{${content}}`;

const negativeTestCases = [
	EMPTY_STRING,
	SPACE_STRING,
	TAB_STRING,
	NEWLINE_STRING,
	'[',
	']',
	'][',
	'{',
	'}',
	'}{',
	'[}',
	'{]',
].map(input => [input, false]);

const positiveTestCases = [
	ARRAY_STRING(),
	ARRAY_STRING(SPACE_STRING),
	ARRAY_STRING(TAB_STRING),
	ARRAY_STRING(NEWLINE_STRING),
	OBJECT_STRING(),
	OBJECT_STRING(SPACE_STRING),
	OBJECT_STRING(TAB_STRING),
	OBJECT_STRING(NEWLINE_STRING),
].map(input => [input, true]);
*/

describe('JSON verify', () => {
	/*
	test.each([...positiveTestCases, ...negativeTestCases])(
		'given "%s", returns %p',
		(input, output) => {
			const result = verify(input);
			expect(result).toEqual(output);
		}
	);

	describe('isNumber', () => {
		it('true when 0', () => {
			expect(isNumber('0')).toEqual(true);
		});
		it('true when integer (single digit)', () => {
			expect(isNumber('9')).toEqual(true);
		});
		it('true when integer (negative)', () => {
			expect(isNumber('-9')).toEqual(true);
		});
		it('true when integer (multi digit)', () => {
			expect(isNumber('9042')).toEqual(true);
		});
		it('true when fraction', () => {
			expect(isNumber('0.1234')).toEqual(true);
		});
		it('true when exponent (positive)', () => {
			expect(isNumber('0E+4')).toEqual(true);
		});
		it('true when exponent (negative)', () => {
			expect(isNumber('1e-42')).toEqual(true);
		});
		it('true when exponent (negative)', () => {
			expect(isNumber('1e-42')).toEqual(true);
		});
		it('true when exponent (no sign)', () => {
			expect(isNumber('10e4')).toEqual(true);
		});
		it('false when empty', () => {
			expect(isNumber('')).toEqual(false);
		});
		it('false when not a digit', () => {
			expect(isNumber('A')).toEqual(false);
		});
	});
	*/

	describe('isObject', () => {
		test('', () => {
			const result = isObject('{ "alpha": "beta" }');
			console.log(result?.groups?.rest);
			expect(result).toBeDefined();
		});
		test('', () => {
			const result = isObject('[ "alpha", "beta" ]');
			console.log(result);
			expect(result).toBeDefined();
		});
	});
});
