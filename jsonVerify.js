const jsonTokens = {
	Null: { pattern: 'null' },
	Boolean: { pattern: '(false|true)' },
	Number: { pattern: '-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?' },
	String: {
		pattern: '"([^\\\\"\\x00-\\x1f]|\\\\(["\\/bfnrt]|u[\\da-fA-F]{4}))*"',
	},
	OpenArray: { pattern: '\\[' },
	OpenObject: { pattern: '\\{' },
	SeparatingComma: { pattern: ',' },
	CloseArray: { pattern: '\\]' },
	CloseObject: { pattern: '\\}' },
	PropertyColon: { pattern: ':' },
};

const jsonRegExpString = `^(${Object.entries(jsonTokens)
	.map(([_token, _value]) => `(?<${_token}>${_value.pattern})`)
	.join('|')})\\s*(?<remainder>.*)$`;

const jsonRegExpObject = new RegExp(jsonRegExpString);

export function jsonTokenize(jsonString) {
	const tokenMatches = jsonString.match(jsonRegExpObject)?.groups || {
		Error: 'Unrecognised content encountered',
		remainder: jsonString,
	};
	const extractTokens = (obj, [key, val]) =>
		key === 'remainder'
			? { ...obj, [key]: val }
			: val?.length // key other than remainder but value has length
			? { ...obj, type: key, value: val }
			: obj;
	return Object.entries(tokenMatches).reduce(extractTokens, {});
}

function jsonVerify(sourceData, indentText = '\t') {
	const retValue = { report: [], error: '', remainder: sourceData.trim() };

	while (retValue.remainder.length && !retValue.error) {
		const result = jsonTokenize(retValue.remainder);
		retValue.report += `${result.type} = ${result.value}\n`;
		retValue.error = result.type === 'Error' ? result.value : '';
		retValue.remainder = result.remainder.trim();
	}
	return retValue;
}

export default jsonVerify;
