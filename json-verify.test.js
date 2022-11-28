import verify from './json-verify';
import primitiveTestCases from './primitive-test-cases.json';
import arrayTestCases from './array-test-cases.json';

describe('JSON verify', () => {
	describe('Primitive', () => {
		test.each(primitiveTestCases)('$description', ({ input, output }) => {
			const indentParam = input.indentParam || undefined;
			const result = verify(input.jsonString, indentParam);
			expect(result).toEqual(output);
			console.log(output.error ?? JSON.parse(output.report));
		});
	});
	describe.only('Array', () => {
		test.each(arrayTestCases)('$description', ({ input, output }) => {
			const indentParam = input.indentParam || undefined;
			const result = verify(input.jsonString, indentParam);
			expect(result).toEqual(output);
			console.log(output.error ?? JSON.parse(output.report));
		});
	});
});
