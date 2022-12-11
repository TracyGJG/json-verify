//#region Preparation functions
/**
 * A function to generate and initilise the JSON state object
 * @param {String} sourceData is the initial input string to be verified.
 * @returns An object conatining the JSON State to be used during verification.
 */
export function createJsonState(sourceData) {
	return {
		report: '',
		error: '',
		remainder: sourceData.trim(),
	};
}

/**
 * A Construtor function that prepares the default indent fragment and returns a function to apply it.
 * @param {string|number} indent the string frangent or the number of space characters to be used as the indent for the report.
 * @returns The indent function that, given a number of indents, produces the text to be presented.
 */
export function createIndentFunction(indent = '\t') {
	const indentText = `${indent}`;
	const indentSpaces = +indentText > -1 ? ' '.repeat(+indentText) : '\t';
	return numIntents =>
		(/^-?\d+$/.test(indentText) ? indentSpaces : indent).repeat(numIntents);
}
//#endregion

//#region create jsonTokeniser
/**
 * Constructor function that compbines the token patterns into a single RegExp and supplies a function to parse the input string.
 * @param {object} jsonTokenPatterns contains a list of properties, one for each leagle token, along with the Regular Expression pattern used to detect it.
 * @returns The JSON tokenizer used to parse the input string
 */
function createJsonTokeniser(jsonTokenPatterns) {
	const jsonRegExpObject = new RegExp(
		`^(${Object.entries(jsonTokenPatterns)
			.map(([_token, _value]) => `(?<${_token.replace(' ', '_')}>${_value})`)
			.join('|')})\\s*(?<remainder>.*)$`
	);

	return function (jsonString) {
		const tokenMatches = jsonString.remainder.match(jsonRegExpObject)
			?.groups || {
			Error: 'Unrecognised content encountered',
			remainder: jsonString.remainder,
		};
		const tokenValue = Object.entries(tokenMatches).reduce(extractTokens, {});
		jsonString.remainder = tokenMatches.remainder;
		return tokenValue;
	};

	function extractTokens(obj, [key, value]) {
		return key === 'remainder'
			? { ...obj, remainder: value }
			: value?.length
			? { ...obj, token: key.replace('_', ' '), value }
			: obj;
	}
}

/**
 * The generated JSON Tokenizer supplied with Regular Expression patterns for each leagle token.
 */
export const jsonTokenizer = createJsonTokeniser({
	Null: 'null',
	Boolean: '(false|true)',
	Number: '-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?',
	String: '"([^\\\\"\\x00-\\x1f]|\\\\(["\\\\/bfnrt]|u[\\da-fA-F]{4}))*"',
	'Array opening': '\\[',
	'Object opening': '\\{',
	Comma: ',',
	Colon: ':',
	'Array closure': '\\]',
	'Object closure': '\\}',
});
//#endregion

//#region validateToken
/**
 * A collection of composite values and utility functions.
 */
const OPENERS = ['Array opening', 'Object opening'];
const CLOSURES = ['Array closure', 'Object closure'];
const PRIMITIVES = ['Null', 'Boolean', 'Number', 'String'];

const STACK_POPULATED = stack => !!stack.length;
const NEW_CONTEXT = token =>
	token === 'Array opening'
		? { context: 'ARRAY', step: 0 }
		: { context: 'OBJECT', step: 0, properties: [] };
const PUSH_STACK = (token, stack) =>
	OPENERS.includes(token) && stack.unshift(NEW_CONTEXT(token));
const POP_STACK = (token, stack) =>
	CLOSURES.includes(token) &&
	STACK_POPULATED(stack) &&
	(stack[0].step = stack[0].step * -1 - 2);
const UPDATE_STACK = (token, stack) =>
	STACK_POPULATED(stack) && stack[0].step++;
const RESET_STACK = (token, stack) =>
	STACK_POPULATED(stack) && (stack[0].step = 1);
const CLOSE_CONTEXT = (token, stack) => {
	POP_STACK(token, stack);
	UPDATE_STACK(token, stack);
	PUSH_STACK(token, stack);
};

/**
 * The list of token validation rules and actions to be performed when valid.
 */
export const tokenValidators = {
	TOP_LEVEL: { validTokens: [...PRIMITIVES, ...OPENERS], action: PUSH_STACK },
	ARRAY_0: {
		validTokens: ['Array closure', ...PRIMITIVES, ...OPENERS],
		action: CLOSE_CONTEXT,
	},
	ARRAY_1: {
		validTokens: ['Array closure', 'Comma'],
		action: CLOSE_CONTEXT,
	},
	ARRAY_2: {
		validTokens: [...PRIMITIVES, ...OPENERS],
		action: (token, stack) => {
			UPDATE_STACK(token, stack);
			RESET_STACK(token, stack);
			PUSH_STACK(token, stack);
		},
	},
	OBJECT_0: {
		validTokens: ['Object closure', 'String'],
		action: CLOSE_CONTEXT,
	},
	OBJECT_1: { validTokens: ['Colon'], action: UPDATE_STACK },
	OBJECT_2: {
		validTokens: [...PRIMITIVES, ...OPENERS],
		action: (token, stack) => {
			UPDATE_STACK(token, stack);
			PUSH_STACK(token, stack);
		},
	},
	OBJECT_3: {
		validTokens: ['Object closure', 'Comma'],
		action: CLOSE_CONTEXT,
	},
	OBJECT_4: { validTokens: ['String'], action: RESET_STACK },
};

/**
 * ValidateToken applies a set of predefined rules to ensure the tokens appear is a valid sequence as prescibed in the specification.
 * 		It also checks to guard against data loss by keeping track of the property names used in an object to protect against duplicates.
 * @param {object} param0 contains two string arguments, the token and its value.
 * @param {array} tokenStack is an array that retains the current context of compound tokens such as arrays and objects.
 * @param {object} jsonState contains the current state of processing.
 * 		It is an object that holds the report to date, an error message if one has been detected and the remainder of the sourceData.
 * @returns void
 */
export function validateToken({ token, value }, tokenStack, state) {
	if (token === 'Error') {
		state.error = value;
		return;
	}

	const tokenIndex = tokenStack.length
		? `${tokenStack[0].context}_${tokenStack[0].step}`
		: 'TOP_LEVEL';

	if (tokenValidators[tokenIndex].validTokens.includes(token)) {
		if (
			token === 'String' &&
			tokenStack.length &&
			tokenStack[0].context === 'OBJECT' &&
			!(tokenStack[0].step % 4)
		) {
			if (tokenStack[0].properties.includes(value)) {
				state.error = `Duplicate property ${value}\ encountered`;
			} else {
				tokenStack[0].properties.push(value);
			}
		}
		tokenValidators[tokenIndex].action(token, tokenStack);
	} else {
		state.error = `Unexpected ${token}\ encountered`;
	}
}
//#endregion

/**
 * The Update Report function updates the `report` property of the `jsonState` object as long as no error has been detected.
 * @param {object} tokenValue is a combination of strings, the token and the value of the token.
 * @param {array} tokenStack is an array that retains the current context of compound tokens such as arrays and objects.
 * @param {object} jsonState contains the current state of processing.
 * 		It is an object that holds the report to date, an error message if one has been detected and the remainder of the sourceData.
 * @param {string} indent is a fragment of text to be used to indent values for presentation.
 * @returns void
 */
export function updateReport(tokenValue, tokenStack, jsonState, indent) {
	if (jsonState.error) return;

	const isComma = tokenValue.token === 'Comma';
	const isColon = tokenValue.token === 'Colon';
	const isOpenner = OPENERS.includes(tokenValue.token);
	const isClosure = CLOSURES.includes(tokenValue.token);
	const isProperty =
		(tokenStack.length > 1 && tokenStack[1].step === 3 && isOpenner) ||
		(tokenStack.length > 0 &&
			tokenStack[0].step === 3 &&
			!(isOpenner || isClosure));
	const isEmptyContext = tokenStack[0]?.step === -1;

	const isPrimaryOpenner = isOpenner && tokenStack.length === 1;
	const outdent = (isOpenner || isClosure) && !isEmptyContext;

	const newLine =
		isComma ||
		isColon ||
		isEmptyContext ||
		isPrimaryOpenner ||
		isProperty ||
		!tokenStack.length
			? ''
			: '\n';
	const indentText = indent(+!!newLine * (tokenStack.length - +outdent));
	const emptySpace = indent(+isEmptyContext);
	const colonSpace = indent(+isColon);

	jsonState.report += `${newLine}${indentText}${emptySpace}${tokenValue.value}${colonSpace}`;

	if (tokenStack[0]?.step < 0) {
		tokenStack.shift();
	}
	if (!tokenStack.length && jsonState.remainder) {
		jsonState.error = `Data remaining after complete JSON block.`;
		return;
	}
	if (!!tokenStack.length && !jsonState.remainder) {
		jsonState.error = `Incomplete JSON block${
			tokenStack.length > 1 ? 's' : ''
		}.`;
	}
}

/**
 * The primary (default) function of the module processes the JSON string nd produces a report.
 * @param {string} sourceData is the JSON string to be verified and confirmed as 'well formed' and fit for parsing.
 * @param {string|number} indentText is an optional parameter defaulted to a tab character.
 * 		It can supply a number of spaces to be used as an indent (min 0) or a fragment of text to be used.
 * @returns {object} A report containing three properties
 * 	- {string} - report: the formatted output, akin to the JSON.stringify operation
 * 	- {string} - error: an error message for the first detected issue
 * 	- {string} - remainder: any text remaining at the end of processing
 */
export default function jsonVerify(sourceData, indentText) {
	const jsonState = createJsonState(sourceData);
	const indent = createIndentFunction(indentText);
	const tokenStack = [];

	while (jsonState.remainder && !jsonState.error) {
		const tokenValue = jsonTokenizer(jsonState);
		validateToken(tokenValue, tokenStack, jsonState);
		updateReport(tokenValue, tokenStack, jsonState, indent);
	}
	return jsonState;
}
