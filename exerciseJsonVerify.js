import jsonVerify, { jsonTokenize } from './jsonVerify.js';

const tokenTestCases = [
	'nothing and the rest',
	'null and the rest',
	'true and the rest',
	'false and the rest',
	'-42 and the rest',
	'4.2 and the rest',
	'42e+2 and the rest',
	'42E-2 and the rest',
	'"testing" and the rest',
	'"testing"',
	'[ and the rest',
	'{ and the rest',
	', and the rest',
	'] and the rest',
	'} and the rest',
	': and the rest',
];
// console.table(tokenTestCases.map(testCase => jsonTokenize(testCase)));

const jsonTestCases = [
	' null false true 42 -4.2 42e-2 42E+2 "Forty Two" ',
	' null false true 42 -4.2 42e-2 42E+2 "Forty Two" xxx ',
	' null false true 42 yyy-4.2 42e-2 42E+2 "Forty Two" ',
];

jsonTestCases.forEach(jsonTestCase =>
	console.log(jsonVerify(jsonTestCase, '  ').report)
);
