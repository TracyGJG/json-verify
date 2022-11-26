# JSON verify

A utility to verfiy a string is truely in JavaScript Object Notation [JSON](https://www.json.org/json-en.html) and as specified in [ECMA-404](https://www.ecma-international.org/wp-content/uploads/ECMA-404_1st_edition_october_2013.pdf) standard.

## Motivation
JavaScript is already equipped with a very capable JSON parser. However, the information provided when an invalid data set is presented has several issues.

1. There is no standard for the error message the JSON parser produces so each browser 'does its own thing'.
2. Although it is an unusual and rare use case, there is no way to obtain details about the nature and location of syntax errors in the data set.

## Verification
JSON verify is an ES Module that exposes a default function of 'verify' that expects to be provided with a single string argument.