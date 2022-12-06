import jsonVerify, {
	createJsonState,
	createIndentFunction,
	jsonTokenizer,
	validateToken,
	updateReport,
} from './jsonVerify';

import indentTestCases from './testing/indent-test-cases.json';
import tokenTestCases from './testing/token-test-cases.json';
import validateTestCases from './testing/validate-test-cases.json';
import reportTestCases from './testing/report-test-cases.json';
import verifyTestCases from './testing/verify-test-cases.json';

describe('JSON verify', () => {
	describe('Calculate Indentation', () => {
		test.each(indentTestCases)('$description', ({ input, output }) => {
			const calculateIndentation = createIndentFunction(input);
			expect(calculateIndentation(2)).toEqual(output);
		});
	});
	describe('JSON Tokenizer', () => {
		test.each(tokenTestCases)('$description', ({ input, output }) => {
			const jsonState = createJsonState(input);
			const result = jsonTokenizer(jsonState);
			expect(result.token).toEqual(output.token);
			expect(result.value).toEqual(output.value);
		});
	});
	describe('Validate Token', () => {
		test.each(validateTestCases)('$description', ({ input, output }) => {
			validateToken(input.tokenValue, input.tokenStack, input.state);

			expect(input.tokenStack.length).toEqual(output.tokenStack.length);
			if (input.tokenStack.length) {
				expect(input.tokenStack[0].context).toEqual(
					output.tokenStack[0].context
				);
				expect(input.tokenStack[0].step).toEqual(output.tokenStack[0].step);
			}
			expect(input.state).toEqual(output.state);
		});
	});
	describe('Update Report', () => {
		const indent = indentSize => '  '.repeat(indentSize);
		test.each(reportTestCases)(
			'$description',
			({ input: { tokenValue, tokenStack, state }, output }) => {
				updateReport(tokenValue, tokenStack, state, indent);
				expect(state.report).toEqual(output.report);
				expect(state.error).toEqual(output.error);
			}
		);
	});
	describe.only('Verify JSON', () => {
		test.each(verifyTestCases)(
			'$description',
			({ input: [json, indent], output }) => {
				const results = jsonVerify(json, indent);
				expect(results).toEqual(output);
			}
		);
	});
});
