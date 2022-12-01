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
		Error: jsonString,
		remainder: '',
	};
	const extractTokens = (obj, [key, val]) =>
		key === 'remainder'
			? { ...obj, [key]: val }
			: val?.length
			? { ...obj, type: key, value: val }
			: obj;
	return Object.entries(tokenMatches).reduce(extractTokens, {});
}

function jsonVerify(sourceData, indentText = '\t') {
	let jsonData = sourceData.trim();
	const report = [];

	while (jsonData.length) {
		const result = jsonTokenize(jsonData);
		report.push(result);
		jsonData = result.remainder.trim();
	}
	return report;
}

export default jsonVerify;
