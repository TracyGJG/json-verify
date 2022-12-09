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

export function validateToken({ token, value }, tokenStack, state) {
	if (token === 'Error') return;

	const tokenIndex = tokenStack.length
		? `${tokenStack[0].context}_${tokenStack[0].step}`
		: 'TOP_LEVEL';

	if (tokenValidators[tokenIndex].validTokens.includes(token)) {
		if (
			token === 'String' &&
			!(tokenStack[0].step % 4) &&
			tokenStack[0].context === 'OBJECT'
		) {
			if (tokenStack[0].properties.includes(value)) {
				state.error = `Duplicate property ${value} encountered`;
			} else {
				tokenStack[0].properties.push(value);
			}
		}
		tokenValidators[tokenIndex].action(token, tokenStack);
	} else {
		state.error = `Unexpected ${token} encountered`;
	}
}
//#endregion

export function updateReport(tokenValue, tokenStack, jsonState, indent) {
	if (jsonState.error) return;

	const isColon = tokenValue.token === 'Colon';
	const colonSpace = indent(+isColon);

	const isEmptyContext = tokenStack[0]?.step === -1;
	const emptySpace = indent(+isEmptyContext);

	const isFirstPrimitive = tokenStack[0]?.step === 1;
	const isContextTerminated = tokenStack[0]?.step < -1;

	const newLine =
		isFirstPrimitive || (isContextTerminated && !isEmptyContext) ? '\n' : '';
	const indentText = indent(
		+!!newLine * tokenStack.length - +isContextTerminated
	);

	jsonState.report += `${newLine}${indentText}${emptySpace}${tokenValue.value}${colonSpace}`;

	if (tokenStack[0]?.step < 0) tokenStack.shift();
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
