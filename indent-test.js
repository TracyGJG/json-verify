const RegExpPatterns = {
	_Null: 'null',
	_Boolean: '(false|true)',
	_Number: '-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?',
	_String: '"([^\\\\"\\x00-\\x1f]|\\\\(["\\/bfnrt]|u[\\da-fA-F]{4}))*"',
	_OpenArray: '\\[',
	_CloseArray: '\\]',
	_OpenObject: '\\{',
	_CloseObject: '\\}',
	_PropertyColon: ':',
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

/*
console.log(parse._Null(' null,'));
console.log(parse._Boolean(' true '));
console.log(parse._Boolean('false, 42'));
console.log(parse._Number('-42,'));
console.log(parse._Number('0.1234,'));
console.log(parse._Number('42e2,'));
console.log(parse._String('"",'));
console.log(parse._String('"Hello World",'));
console.log(parse._String('"\\"",'));
console.log(parse._String('"\\t",'));
console.log(parse._String('"\\"\\/\\b\\f\\n\\r\\t",'));
console.log(parse._String('"\\u0041\\u004F",'));
console.log(parse._OpenArray(' [ '));
console.log(parse._CloseArray(' ], '));
console.log(parse._OpenObject(' { '));
console.log(parse._CloseObject(' }, '));
console.log(parse._PropertyColon(' : 42, '));
console.log(parse._SeparatingComma(' , "Hello World"'));
*/

function parserTest(inputText) {
	const results = [];
	let input = inputText.trim();
	let match = true;

	while (input.length && match) {
		let result;
		match = Object.values(parsers).find(parser => {
			result = parser(input);
			return result.value !== undefined;
		});
		if (match) {
			results.push(result);
			input = `${result.remainder}`;
		}
	}
	return results;
}

const nullJson = JSON.stringify(null);
const arrayJson = JSON.stringify([-42, 0.123, 42e2, 42e-2]);
const objectJson = JSON.stringify({
	'test string': false,
	'A\tB\n\u0043"': true,
});

/*
const testString = ` ${nullJson} ${arrayJson} ${objectJson} `;
console.log(testString);

const parserResults = parserTest(testString);
console.table(parserResults);
*/

function verify(data, indentType = '\t') {
	const indent = isNaN(indentType) ? indentType : ' '.repeat(indentType);
	const state = {
		level: 0,
		json: [''],
		data: data.trim().split(/\s+/),
	};

	const parsers = {
		'[{': datum => report(datum, false, true, 1),
		'}]': datum => report(datum, true, false, -1),
		',': datum => report(datum, false, true, 0),
		':': datum => report(`${datum} `, false, false, 0),
	};

	console.log(`"${indent}"`);
	state.data.forEach(datum => {
		const parser = Object.entries(parsers).find(_parser =>
			_parser[0].includes(datum)
		);
		return parser ? parser[1](datum) : report(datum, false, false, 0);
	});

	return state.json.join('\n');

	function report(datum, preNewline, postNewline, indentDelta) {
		preNewline && newLine(indentDelta);
		append(datum);
		postNewline && newLine(indentDelta);
	}

	function append(text) {
		const lastIndex = state.json.length - 1;
		const currentValue = `${state.json[lastIndex]}${text}`;
		state.json[lastIndex] = currentValue;
	}
	function newLine(offset) {
		state.level += offset;
		state.json.push(indent.repeat(state.level));
	}
}

// function report(datum, )

console.log(verify(' { "a" : [ "b" , "c" ] , "d" : { "e" : "f" } } ', 2));
/*
	{		app	ind+	push
	[		app ind+	push
	}			ind-	push	app
	]			ind- 	push	app
	,		app		 	push
*/

// export default verify;

function verify(data, indentType = '\t') {
	const indent = /^\d+$/.test(`${indentType}`)
		? ' '.repeat(+indentType)
		: indentType;
	return `${data}${indent}${data}`;
}

// export default verify;

console.log(verify('"'));
console.log(verify('"', 4));
