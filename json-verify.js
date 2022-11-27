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
	const tokenStack = [];
	let tokenError = '';
	const report = {
		level: 0,
		json: [''],
		indent: /^\d+$/.test(`${indentType}`)
			? ' '.repeat(+indentType)
			: indentType,
	};

	// console.log(
	// 	'TYPE'.padEnd(18, ' '),
	// 	'VALUE'.padEnd(20, ' '),
	// 	'DATA remaining',
	// 	`\n${'-'.repeat(60)}`
	// );
	while (data?.length && !tokenError) {
		const { type, value, remainder } = parseAll(data);
		data = remainder;
		tokenError =
			type === 'Error'
				? value
				: processToken(tokenStack, type, value, report);
		// console.log(type.padEnd(18, ' '), value.padEnd(20, ' '), data);
	}
	if (!tokenError && (data?.length || tokenStack.length)) {
		tokenError = 'Unexpected end of source data';
	}
	return [...report.json, tokenError].join('\n');
}

function processToken(stack, token, value, _report) {
	const STACK_IS_EMPTY = !stack.length;
	const STACK_TYPE = {
		ARRAY: 'ARRAY',
		OBJECT: 'OBJECT',
	};
	const isStep = (...steps) => !steps.length || steps.includes(stack[0].step);
	const isARRAY = (...steps) =>
		isStep(...steps) && stack.length && stack[0].type === STACK_TYPE.ARRAY;
	const isOBJECT = (...steps) =>
		isStep(...steps) && stack.length && stack[0].type === STACK_TYPE.OBJECT;
	let tokenError = '';
	const fallbackTokenReport = datum => report(datum, false, false, 0);
	const openTokenReport = datum => report(datum, false, true, 1);
	const closeTokenReport = datum => report(datum, true, false, -1);
	const commaTokenReport = datum => report(datum, false, true, 0);
	const colonTokenReport = datum => report(`${datum} `, false, false, 0);
	const tokenReports = {
		OpenArray: openTokenReport,
		OpenObject: openTokenReport,
		CloseArray: closeTokenReport,
		CloseObject: closeTokenReport,
		SeparatingComma: commaTokenReport,
		PropertyColon: colonTokenReport,
	};

	const primitiveVerifier = () => STACK_IS_EMPTY || isStep(2) || isARRAY(0);
	const propertyVerifier = () => STACK_IS_EMPTY || isStep(0, 2);
	const tokenVerifiers = {
		Null: primitiveVerifier,
		Boolean: primitiveVerifier,
		Number: primitiveVerifier,
		String: propertyVerifier,
		OpenArray: primitiveVerifier,
		CloseArray: () => isARRAY(0, 1),
		PropertyColon: () => isOBJECT(1),
		SeparatingComma: () => isARRAY(1) || isOBJECT(3),
		OpenObject: primitiveVerifier,
		CloseObject: () => isOBJECT(0, 3),
	};

	const incStep = (restStr = '') => (
		stack.length && stack[0].step++, restStr
	);
	const tokenErrors = {
		Null: isVerified =>
			isVerified ? incStep() : 'Unexpected Null encountered',
		Boolean: isVerified =>
			isVerified ? incStep() : 'Unexpected Boolean encountered',
		Number: isVerified =>
			isVerified ? incStep() : 'Unexpected Number encountered',
		String: isVerified =>
			isVerified ? incStep() : 'Unexpected String encountered',
		OpenArray: isVerified => {
			if (isVerified) {
				incStep();
				stack.unshift({ type: STACK_TYPE.ARRAY, step: 0 });
				return '';
			}
			return 'Unexpected Array start';
		},
		CloseArray: isVerified =>
			isVerified ? (stack.shift(), '') : 'Unexpected Array end',
		PropertyColon: isVerified =>
			isVerified ? incStep() : 'Unexpected colon encountered',
		SeparatingComma: isVerified =>
			isVerified
				? ((stack[0].step = 0), '')
				: 'Unexpected comma encountered',
		OpenObject: isVerified => {
			if (isVerified) {
				incStep();
				stack.unshift({ type: STACK_TYPE.OBJECT, step: 0 });
				return '';
			}
			return 'Unexpected Object start';
		},
		CloseObject: isVerified =>
			isVerified ? (stack.shift(), '') : 'Unexpected Object end',
	};

	// console.log(
	// 	`\n${stack.length}: ${
	// 		stack.length ? JSON.stringify(stack[0]) : 'STACK EMPTY'
	// 	}`
	// );
	const verificationResult = tokenVerifiers[token]();
	// console.log('>', token, verificationResult);
	tokenError = tokenErrors[token](verificationResult);
	// console.log(stack.length ? JSON.stringify(stack[0]) : 'STACK EMPTY');

	return tokenError || (tokenReports[token] || fallbackTokenReport)(value);

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
	' { "a" : [ false , true ] , "b" : { "c" : 42, "d" : "Hello World" }, "e": null } ',
	' { "a" : [ false , true ] , "b" : { "c" : 42, "d" : "Hello World" }, "e": null } ',
	' { "a" : [ false , true ] , "b" : { "c" : 42, "d" : "Hello World" }, "e": null  ',
	' { "a" : [ "b" , "c" ] , "d" : { "e" : "f" } } ',
	'{ "a": null, "_": {"b": true, "c": false }, "d": 42, "e": "Hello World" }',
	'{ "a": null, "b": true, "c": false, "d": 42, "e": "Hello World" }',
	'[ null, [ true, false], 42, "Hello World" ]',
	'[ null, true, false, 42, "Hello World" ]',
	' null true false, -42, 0.123  []42e-1 42E+2 "Hello World" "unrecognisedTokenHere {} ',
	' null true false, -42: 0.123    []42e-1 42E+2 "Hello World" {} ',
];

console.log(verify(testData[0], 2));
