const RegExpPatterns = {
	Null: 'null',
	Boolean: '(false|true)',
	Number: '-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?',
	String: '"([^\\\\"\\x00-\\x1f]|\\\\(["\\/bfnrt]|u[\\da-fA-F]{4}))*"',
	OpenArray: '\\[',
	OpenObject: '\\{',
	SeparatingComma: ',',
	CloseArray: '\\]',
	CloseObject: '\\}',
	PropertyColon: ':',
};

function parser(pattern, type) {
	const regExpObject = new RegExp(
		`^\\s*(?<value>${pattern})\\s*(?<remainder>.*)$`
	);

	return function (input) {
		const { value = undefined, remainder = input } =
			input.trim().match(regExpObject)?.groups || {};
		return { value, remainder, type: value === undefined ? '' : type };
	};
}

const parsers = Object.entries(RegExpPatterns).reduce(
	(_parsers, [key, val]) => ({
		..._parsers,
		[key]: parser(val, key),
	}),
	{}
);

function parseAll(data) {
	return (
		Object.values(parsers).find(parser => parser(data).type) ||
		(() => ({ value: data, type: 'Error' }))
	)(data);
}

function verify(input, indentType = '\t') {
	let data = input;
	let error = '';
	const tokenStack = [];
	let tokenError = '';
	const report = {
		level: 0,
		json: [''],
		indent: /^\d+$/.test(`${indentType}`)
			? ' '.repeat(+indentType)
			: indentType,
	};

	console.log(
		'TYPE'.padEnd(18, ' '),
		'VALUE'.padEnd(20, ' '),
		'DATA remaining',
		`\n${'-'.repeat(60)}`
	);
	while (data?.length && !tokenError) {
		const { type, value, remainder } = parseAll(data);
		data = remainder;
		tokenError = processToken(tokenStack, type, value, report);
		// error = type === 'Error' ? value : '';
		console.log(type.padEnd(18, ' '), value.padEnd(20, ' '), data);
	}

	return report.json.join('\n');
}

function processToken(stack, token, value, _report) {
	const fallbackTokenReport = datum => report(datum, false, false, 0);
	const openTokenReport = datum => report(datum, false, true, 1);
	const closeTokenReport = datum => report(datum, true, false, -1);
	const tokenReports = {
		OpenArray: openTokenReport,
		OpenObject: openTokenReport,
		CloseArray: closeTokenReport,
		CloseObject: closeTokenReport,
		SeparatingComma: datum => report(datum, false, true, 0),
		PropertyColon: datum => report(`${datum} `, false, false, 0),
	};
	return (tokenReports[token] || fallbackTokenReport)(value);

	// function isPrimitive(_token) {
	// 	return ['Null', 'Boolean', 'Number', 'String'].includes(_token);
	// }

	function report(datum, preNewline, postNewline, indentDelta) {
		preNewline && newLine(indentDelta);
		append(datum);
		postNewline && newLine(indentDelta);
	}

	function append(text) {
		const lastIndex = _report.json.length - 1;
		const currentValue = `${_report.json[lastIndex]}${text}`;
		_report.json[lastIndex] = currentValue;
	}
	function newLine(offset) {
		_report.level += offset;
		_report.json.push(_report.indent.repeat(_report.level));
	}
}

// export default verify;

const testData = [
	' null true false, -42: 0.123    []42e-1 42E+2 "Hello World" {} ',
	' null true false, -42, 0.123  []42e-1 42E+2 "Hello World" "unrecognisedTokenHere {} ',
	' { "a" : [ "b" , "c" ] , "d" : { "e" : "f" } } ',
];
console.log(verify(testData[2]));
