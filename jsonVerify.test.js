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
	describe('Complex combination', () => {
		test('Complete simple array', () => {
			const testJson = ['test', true, 42, null, {}, []];
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Complete simple object', () => {
			const testJson = {
				propStr: 'test',
				propBool: true,
				propNum: 42,
				propNull: null,
				propObj: {},
				propArr: [],
			};
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Complete nested array', () => {
			const testJson = [['test', true, 42, null, {}]];
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Complete nested object', () => {
			const testJson = {
				propObj: {
					propStr: 'test',
					propBool: true,
					propNum: 42,
					propNull: null,
					propArr: [],
				},
			};
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Complete object in array', () => {
			const testJson = [
				{
					propStr: 'test',
					propBool: true,
					propNum: 42,
					propNull: null,
					propArr: [],
				},
			];
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Complete array in object', () => {
			const testJson = {
				propObj: ['test', true, 42, null, {}],
			};
			const json = JSON.stringify(testJson);
			const results = jsonVerify(json);
			const resultObject = JSON.parse(results.report);
			expect(resultObject).toEqual(testJson);
		});
		test('Array with duplicate properties in same object', () => {
			const json = '[ { "prop": true, "prop": false } ]';
			const results = jsonVerify(json);
			expect(results.error).toBe('Duplicate property "prop" encountered');
		});
		test('Array with duplicate properties in differnt objects', () => {
			const json = '[ { "prop": true}, {"prop": false } ]';
			const results = jsonVerify(json);
			expect(results.error).toBe('');
		});
		test('Simple Ad-hoc', () => {
			const json = ' "forty-two" ';
			const results = jsonVerify(json);
			expect(results.error).toBe('');
			expect(results.report).toBe('"forty-two"');
		});
		test('Complex Ad-hoc', () => {
			const json =
				'[ null, true, [{"test3": null, "test4": true}], { "test1": {}, "test2": []}, 42, "test"]';
			const results = jsonVerify(json);
			expect(results.error).toBe('');
			expect(results.report).toBe(`[
	null,
	true,
	[
		{
			"test3":	null,
			"test4":	true
		}
	],
	{
		"test1":	{	},
		"test2":	[	]
	},
	42,
	"test"
]`);
		});
	});
});
