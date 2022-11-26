const RegExpPatterns = {
	_Null: 'null',
	_Boolean: '(false|true)',
	_Number: '-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?',
	_String: '"([^\\\\"\\x00-\\x1f]|\\\\(["\\/bfnrt]|u[\\da-fA-F]{4}))*"',
	_OpenArray: '\\[',
	// _CloseArray: '\\]',
	_OpenObject: '\\{',
	// _CloseObject: '\\}',
	// _PropertyColon: ':',
	_SeparatingComma: ',',
};

function parser(pattern, type) {
	const regExpObject = new RegExp(
		`^\\s*(?<value>${pattern})\\s*(?<remainder>.*)$`
	);
	return function parse(input) {
		const { value = undefined, remainder = input } =
			input.match(regExpObject)?.groups || {};
		return { value, remainder, type };
	};
}

const parsers = Object.entries(RegExpPatterns).reduce(
	(_parsers, [key, val]) => ({
		..._parsers,
		[key]: parser(val, key.slice(1)),
	}),
	{}
);

function verify(input) {
	const state = {
		data: input.trim(),
		error: '',
		json: [],
	};

	let match = {};

	while (state.data.length && match) {
		match = parseValue(state, match);
	}
	if (state.data.length) state.error = 'Unexpected content encountered.';
	return state;
}

function parseValue(state, match) {
	let result;
	match = Object.values(parsers).find(parser => {
		result = parser(state.data);
		return result.value !== undefined;
	});
	if (match) {
		if (result.type === 'OpenArray') {
			parseArray(result);
		} else if (result.type === 'OpenObject') {
			parseObject(result);
		}
		state.json.push(result);
		state.data = `${result.remainder}`;
	}
	return match;
}

function parseArray(state) {
	state.value += '_ARRAY_]';
	state.remainder = state.remainder.slice(1);
}

function parseObject(state) {
	state.value += '_OBJECT_}';
	state.remainder = state.remainder.slice(2);
}

const verifyResults = verify(
	' null true false, -42, 0.123  []42e-1 42E+2 "Hello World" {_} '
);

if (verifyResults.error) {
	console.log('Error:', verifyResults.error);
} else {
	console.table(verifyResults.json);
}
