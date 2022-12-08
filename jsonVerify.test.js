import jsonVerify, {
	createJsonState,
	createIndentFunction,
	jsonTokenizer,
	validateToken,
	updateReport,
} from './jsonVerify';

import indentTestCases from './testing/create-indent-test-cases.json';
import tokenTestCases from './testing/extract-token-test-cases.json';
import validateTestCases from './testing/validate-token-test-cases.json';
import reportTestCases from './testing/update-report-test-cases.json';
import verifyTestCases from './testing/verify-json-test-cases.json';

const filterTest = (testCases, ...filterIndexes) =>
	testCases.filter(
		(testCase, index) => !filterIndexes.length || filterIndexes.includes(index)
	);

describe('JSON verify', () => {
	describe('Calculate Indentation', () => {
		test.each(filterTest(indentTestCases))(
			'$description',
			({ input, output }) => {
				const calculateIndentation = createIndentFunction(input);
				expect(calculateIndentation(2)).toEqual(output);
			}
		);
	});
	describe('JSON Tokenizer', () => {
		test.each(filterTest(tokenTestCases))(
			'$description',
			({ input, output }) => {
				const jsonState = createJsonState(input);
				const result = jsonTokenizer(jsonState);
				expect(result.token).toEqual(output.token);
				expect(result.value).toEqual(output.value);
			}
		);
	});
	describe('Validate Token', () => {
		test.each(filterTest(validateTestCases))(
			'$description',
			({ input, output }) => {
				validateToken(input.tokenValue, input.tokenStack, input.state);

				expect(input.tokenStack.length).toEqual(output.tokenStack.length);
				if (input.tokenStack.length) {
					expect(input.tokenStack[0].context).toEqual(
						output.tokenStack[0].context
					);
					expect(input.tokenStack[0].step).toEqual(output.tokenStack[0].step);
				}
				expect(input.state).toEqual(output.state);
			}
		);
	});
	describe('Update Report', () => {
		const indent = indentSize => '  '.repeat(indentSize);
		test.each(filterTest(reportTestCases))(
			'$description',
			({ input: { tokenValue, tokenStack, state }, output }) => {
				updateReport(tokenValue, tokenStack, state, indent);
				expect(state.report).toEqual(output.report);
				expect(state.error).toEqual(output.error);
			}
		);
	});
	describe('Verify JSON', () => {
		test.each(filterTest(verifyTestCases))(
			'$description',
			({ input: [json, indent], output }) => {
				const results = jsonVerify(json, indent);
				expect(results).toEqual(output);
			}
		);
	});
	describe.only('Complex combination', () => {
		test('complete', () => {
			const json = `[
	"test",
	null,
	true,
	42
]`;
			const results = jsonVerify(json);
			expect(results).toEqual(json);
		});
	});
});
