//#region Preparation functions
export function createJsonState(sourceData) {
	return {
		report: '',
		error: '',
		remainder: sourceData.trim(),
	};
}

export function createIndentFunction(indent = '\t') {
	const indentText = `${indent}`;
	const indentSpaces = +indentText > -1 ? ' '.repeat(+indentText) : '\t';
	return numIntents =>
		(/^-?\d+$/.test(indentText) ? indentSpaces : indent).repeat(numIntents);
}
//#endregion

//#region create jsonTokeniser
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
			remainder: jsonString,
		};
		const tokenValue = Object.entries(tokenMatches).reduce(extractTokens, {});
		console.log('tokenized', { tokenValue });
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
const OPENERS = ['Array_open', 'Object_open'];
const CLOSURES = ['Array_close', 'Object_close'];
const PRIMITIVES = ['Null', 'Boolean', 'Number', 'String'];
const NEW_CONTEXT = token =>
	token === 'Array_open'
		? { context: 'ARRAY', step: 0 }
		: { context: 'OBJECT', step: 0, properties: [] };
const MATCHING_CONTEXT = (token, stack) =>
	stack.length &&
	CLOSURES.includes(token) &&
	(stack[0].context === (token === 'Array_close') ? 'ARRAY' : 'OBJECT');
const PUSH_STACK = (token, stack) =>
	OPENERS.includes(token) && stack.unshift(NEW_CONTEXT(token));
const POP_STACK = (token, stack) =>
	MATCHING_CONTEXT(token, stack) && stack.shift();
const UPDATE_STACK = (token, stack) => stack.length && stack[0].step++;
const RESET_STACK = (token, stack) => stack.length && (stack[0].step = 1);

export const tokenValidators = {
	TOP_LEVEL: { validTokens: [...PRIMITIVES, ...OPENERS], action: PUSH_STACK },
	ARRAY_0: {
		validTokens: ['Array_close', ...PRIMITIVES, ...OPENERS],
		action: (token, stack) => {
			POP_STACK(token, stack);
			UPDATE_STACK(token, stack);
			PUSH_STACK(token, stack);
		},
	},
	ARRAY_1: {
		validTokens: ['Array_close', 'Comma'],
		action: (token, stack) => {
			UPDATE_STACK(token, stack);
			POP_STACK(token, stack);
		},
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
		validTokens: ['Object_close', 'String'],
		action: (token, stack) => {
			UPDATE_STACK(token, stack);
			POP_STACK(token, stack);
		},
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
		validTokens: ['Object_close', 'Comma'],
		action: (token, stack) => {
			UPDATE_STACK(token, stack);
			POP_STACK(token, stack);
		},
	},
	OBJECT_4: { validTokens: ['String'], action: RESET_STACK },
};

export function validateToken({ token }, tokenStack, state) {
	if (token === 'Error') return;

	const tokenIndex = tokenStack.length
		? `${tokenStack[0].context}_${tokenStack[0].step}`
		: 'TOP_LEVEL';

	if (tokenValidators[tokenIndex].validTokens.includes(token)) {
		tokenValidators[tokenIndex].action(token, tokenStack);
	} else {
		state.error = 'Error';
		state.value = `Unexpected ${token.replace('_', ' ')} encountered`;
	}
}
//#endregion

export function updateReport(tokenValue, tokenStack, jsonState, indent) {
	if (jsonState.error) return;
	const TOKEN_STACK_POPULATED = !!tokenStack.length;

	const isComma = tokenValue.token === 'Comma';
	const isContextStart = TOKEN_STACK_POPULATED && !tokenStack[0].step;
	const isFirstPrimitive = TOKEN_STACK_POPULATED && tokenStack[0].step === 1;
	const isContextTerminated = CLOSURES.includes(tokenValue.token);
	const emptyContext = +(isContextTerminated && isContextStart);
	const newLine = isFirstPrimitive ? '\n' : '';
	const indentText = indent(+!!newLine * tokenStack.length + emptyContext);
	const colonSpace = indent(+isComma);

	jsonState.report += `${newLine}${indentText}${tokenValue.value}${colonSpace}`;

	if (!TOKEN_STACK_POPULATED && jsonState.remainder) {
		jsonState.error = `Data remaining after complete JSON block.`;
		return;
	}
	if (TOKEN_STACK_POPULATED && !jsonState.remainder) {
		jsonState.error = `Incomplete JSON block${
			tokenStack.length > 1 ? 's' : ''
		}.`;
	}
}

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
