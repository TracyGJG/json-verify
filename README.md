# JSON verify

A utility to verfiy a string is truely in JavaScript Object Notation [JSON](https://www.json.org/json-en.html) and as specified in [ECMA-404](https://www.ecma-international.org/wp-content/uploads/ECMA-404_1st_edition_october_2013.pdf) standard.

## Motivation
JavaScript is already equipped with a very capable JSON parser. However, the information provided when an invalid data set is presented has several issues.

1. There is no standard for the error message the JSON parser produces so each browser 'does its own thing'.
2. Although it is an unusual and rare use case, there is no consistent way to obtain details about the nature and location of syntax errors in the data string.

### Verification v Validation
So what is the difference between verification and validation. To answer this we can use the XML data format as a guide.
* Validation confirms the data complies with an expected 'business' structure known as a schema (XSD). Data compliant with a schema can be regarded as being fit for use within an application.
* Verification confirms the data is 'well formed' according to the rules of the data format.

A dataset cannot be valid if it is not well formed so verification needs to be confirmed before validation. XML has a simple syntax but at a cost of a slightly verbose notation. JSON is less verbose but has a slightly more complicated syntax. 
I might be mistaken but I am not aware of a standardised form of JSON schema.

## JSON Verification
JSON verify is an ES Module that exposes a default function of 'verify' that expects to be provided with a single string argument and an optional indent argument.

The purpose of 'verify' is to:
* Confirm the supplied string is valid JSON
* If invalid, provide a consistent error reporting approach, independent of the browser.

The first argument is mandatory and should contain a text string that is a candidate JS object to be confirmed as well formed JSON.
The optional second argument is either a string of number.
Given a string, it will be used as the indent to present the JSON output in a readable structure. 
If a number is supplied, that number of spaces will be used as the indent string 

The 'verify' function could be regarded as a candidate function of the JSON namespace.




