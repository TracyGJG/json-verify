import verify from './jsonVerify';
// import primitiveTestCases from './primitive-test-cases.json';
// import arrayTestCases from './array-test-cases.json';
import compoundTestCases from './compound-test-cases.json';

describe('JSON verify', () => {
	// describe('Primitive', () => {
	// 	test.each(primitiveTestCases)('$description', ({ input, output }) => {
	// 		const indentParam = input.indentParam || undefined;
	// 		const result = verify(input.jsonString, indentParam);
	// 		expect(result).toEqual(output);
	// 		console.log(output.error ?? JSON.parse(output.report));
	// 	});
	// });
	// describe('Array', () => {
	// 	test.each(arrayTestCases)('$description', ({ input, output }) => {
	// 		const indentParam = input.indentParam || undefined;
	// 		const result = verify(input.jsonString, indentParam);
	// 		expect(result).toEqual(output);
	// 		console.log(output.error ?? JSON.parse(output.report));
	// 	});
	// });
	describe.only('Compound', () => {
		test.each(compoundTestCases)('$description', ({ input, output }) => {
			const indentParam = input.indentParam || undefined;
			const result = verify(input.jsonString, indentParam);
			expect(result).toEqual(output);
			if (output.error) {
				console.error(output.error);
			} else {
				console.log(output.report, JSON.parse(output.report));
			}
		});
	});
});
