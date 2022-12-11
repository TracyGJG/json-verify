# JSON verify

A utility to verfiy a string is truely in JavaScript Object Notation [JSON](https://www.json.org/json-en.html) and compliant with the [ECMA-404](https://www.ecma-international.org/wp-content/uploads/ECMA-404_1st_edition_october_2013.pdf) standard.

## Motivation
JavaScript is already equipped with a very capable JSON parser. However, the information provided when an invalid dataset is presented has several issues.

1. There is no standard for the error message the JSON parser produces so each browser 'does its own thing'.
2. Although it is an unusual and rare use case, there is no consistent way to obtain details about the nature and location of syntax errors in the data string.

### Verification v Validation
So what is the difference between verification and validation. To answer this we can use the XML data format as a guide.
* Validation confirms the data complies with an expected 'business' structure known as a schema (XSD). Data compliant with a schema can be regarded as being fit for use within an application.
* Verification confirms the data is 'well formed' according to the rules of the data format.

A dataset cannot be valid if it is not well formed so verification needs to be confirmed before validation. 
XML has a simple syntax but at a cost of a slightly more verbose notation. JSON is less verbose but has a slightly more complicated syntax. 
I might be mistaken but I am not aware of a standardised form of JSON schema. There are tools available to define a JSON schema and validation a data string but they are independent solutions to a common problem. If you know different, please let me know.

## JSON Verification
JSON verify is an ES Module that exposes a default function of 'verify' that expects to be provided with a single string argument and an optional indent argument.

The purpose of 'verify' is to:
* Confirm the supplied string is valid JSON
* If invalid, provide a consistent error reporting approach, independent of the browser.

The first argument is mandatory and should contain a text string that is a candidate JS object to be confirmed as well formed JSON.

The optional second argument is either a string or number.
Given a string, it will be used as the indent to present the JSON output in a readable structure. 
If a number is supplied, that number of spaces will be used as the indent string.

In response the function returns an object containing the following properties:
* error: a string containing an error message should an issue have been detected, empty string if it passes
* report: a string containing the initial section of the JSON data that conforms with the specifciation, up to the point a fault was detected. If no fault is detected this property will contain a formatted version of the input dataset, ready for validation/use.
* remainder: a string containing the section of the JSON data from the point of failure to the end of the JSON data. If the dataset is verified as conformant, this property will be empty.

The process of token validation (described below) also detects objects containing properties with the same name that would cause an error when (JSON.)parse(d) in the form of data loss.

e.g. The following JSON string will lose data when parsed

`{"test": true, "test": 42}`

yielding the following object 

`{ test: 42 }`

but, importantly, will not report the error.

The 'verify' function could be regarded as a candidate function of the JSON namespace.

### Is it production ready
Very nearly. I have applied the same coding and testing conventions I mandate in my professional role as a software engineer. However,
1. This project started out as a personal project, thus the use of vanilla JS instead of TypeScript.
1. I am the only developer on this project so it has not received the code review I would expect in my professional life.
1. The module has been quite extensively unit tested (there will always be edge cases I missed).

The inspiration for the project was the observation there as no standard or commercially available product to meet this somewhat niche requirement. If my prject were to utilise this code I would insist on the following.
1. The code needs to be reviewed and revised accordingly.
1. Confirm the MIT licence the project is released under is suiteable.
1. The project would have to take ownership of (fork) the project (preferably feeding back improvements) as I cannot guarantee a prompt response to issues.

If I had been developing this for production I would probably have used TypeScript and would only expose the default export, but I would have kept everything else the same.

## Future contributions
I would welcome constructive comments on the project (via the repo [issues page](https://github.com/TracyGJG/json-verify/issues)) and pull requests containing suggested changes, but I reserve the right the deal with them as I see fit. I ask any contributors to read the following section on "How the module works" for the technical details.

### How the module works

The module breaks down to three steps repeated until the input is fully verified or a fault is detected.
1. Parse the input for a recognised TOKEN.
1. Confirm the TOKEN is valid at the location it was discovered in the input 'stream'.
1. Build a report from the valid tokens.

In addition the module genertes;
* a data structure in which to maintain the current state of processing (jsonState),
* a function for producing the indents in the outpur report,
* the function for identifying the tokens that make up a valid JSON string.

#### The Process
1. Generate the jsonState object
2. Generate the indent function
3. Prepare a token stack (empty array) for validation
4. While there is data to process and no error detected:

    - Extract the next token and value from the front of the json string, retaining the 'remainder' of the string.
    - Confirm the token is valid in the context of current processing of the JSON string.
    - Update the report using the value, context (token stack) and indent function. 

#### Extracting the token/value

The official <a href="https://www.json.org/json-en.html">JSON</a> website clearly illustrates the syntactical structure supported by the JSON data format. There are six 'train track' diagrams showing how key elements of the structure are composed including 'whitespace'. However, the official <a href="https://www.ecma-international.org/publications-and-standards/standards/ecma-404/">ECMA-404 specification</a> also defines whitesapce and states it can be found in between all other tokens and can be ignored.

The other five elements can be further decomposed into just ten tokens that can be defined using Regular Expressions. At the top level, a JSON data structure can be a primitive value, an array or an object; as defined below.

A primitive value is defiend as 'null', Boolean values 'true' or 'false', a number in a variety of forms, or string with all of its complexity. See the JSON website for specific details.

An array is a collection of zero, one or many primitive values, arrays and/or obejcts. They are delimited by square brakets '[' and ']' with each item in the array separted with a comma ','. Again as illistrated on the JSON website.

Objects are another form of collection but each element (primitive, array or object) is assigned a key, the combination known as a Property. So, an object can contain zero, one or more Properties, separated with a comma. A Property comprises of a key (that has to be a string) followed by a colon separator and ending with a value.

* Primitive:
    - null, 
    - true, false, _Boolean_
    - _Number_
    - _String_
* Array: 
    - open array _[_,
    - value(s),
    - comma separator _,_,
    - close array _]_
* Object:
    - open object _{_,
    - properties:
        - key (_String_), 
        - colon separator _:_,
        - value,
    - comma separator _,_,
    - close object _}_

#### Validating the token in context (token stack)

At any given point in the processing of a JSON string the next valid token is of a restricted (predefined) set as stipulated in the specificiation. For example, after an opening curly brace _{_ we only exepct the following:
* A closing brace _}_ for an empty object
* A _String_ for the name of a property

Everything else is unexpected and will result in an error being reported.
This stage of the process contains all the rules required to ensure a "well formed" JavaScript object can be produced from the input or an error is reported at the location it is detected. When an error is found processing of the JSON string is terminated with the redisual text provided in the `remainder` property.

As stated earlier, validation also includes ensuring potential data loss through the provision of duplicate properties is guarded against.

#### Building the report

The context and type of token will determine how and where the value is to be presented in the output report, which mimics a `JSON.stringify` output.

Some tokens such as colon and comma need to remain on the same line as the preceeding value. Closing brackets, curly and square, usually appear on a new line, unless the object/array they represent is empty, then they appear on the same line as the openning bracket but with an indent between them.

All the rules for presentation are captured in the `updateReport` function called to complete the processing of a token.