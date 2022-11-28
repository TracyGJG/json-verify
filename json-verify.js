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
		`^(?<value>${pattern})\\s*(?<remainder>.*)$`
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
		(() => ({ remainder: data, type: 'Error' }))
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

	while (data?.length && !tokenError) {
		const { type, value, remainder } = parseAll(data);
		data = remainder;
		tokenError =
			type === 'Error'
				? 'Unrecognised content'
				: processToken(tokenStack, type, value, report);
		if (!tokenError && data?.length && !tokenStack.length) {
			tokenError = 'Unrecognised content';
		}
	}
	if (!tokenError && (data?.length || tokenStack.length)) {
		tokenError = 'Unexpected end of JSON';
	}
	return {
		error: tokenError || null,
		remainder: data,
		report: report.json.join('\n'),
	};
}

function processToken(stack, token, value, _report) {
	const STACK_IS_EMPTY = !stack.length;
	const STACK_TYPE = {
		ARRAY: 'ARRAY',
		OBJECT: 'OBJECT',
	};
	const isStep = (...steps) =>
		!steps.length || (stack.length && steps.includes(stack[0].step));
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

	const verificationResult = tokenVerifiers[token]();
	tokenError = tokenErrors[token](verificationResult);

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

export default verify;
