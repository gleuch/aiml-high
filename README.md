# aiml-high

[![npm version](https://badge.fury.io/js/aiml-high.svg)](https://badge.fury.io/js/aiml-high)


> AIML Interpreter written in node.js. Built on [aimlinterpreter](https://www.npmjs.com/package/aimlinterpreter).
>
>aiml-high is a module that allows you to parse AIML files and to find the correct answer to a given message.


## Installation

`npm install aiml-high`


## Dependencies

```
fs
xmldom
```


## Description

With `new aimlHigh(botAttributes)` one can create a new interpreter object. `botAttributes` is an JSON-Object that can contain attributes of the bot one wants to use in AIML files, e.g. `{name: "Bot", age:"42"}`. While continued messaging will store the previous answer for use with `<that>`, you can pass a previous answer like so: `new aimlHigh({}, 'last answer')`.

This object has a function called `loadFiles(fileArray)` which receives an array of AIML files. This function loads the AIML file into memory. There is also a  `loadFromString(stringContent)` that can also be passed if AIML file has been saved into a string.

Furthermore, the object has a function called `findAnswer(clientInput, cb)` which receives a message and a callback. The callback is called when an answer was found. The callback of `findAnswer` should look like this: `callback(result, wildCardArray, input)`. `Result` is the answer from the AIML file and `wildCardArray` stores the values of all wildcardInputs passed previously from the client. The original input which triggered the answer is given back via `input`.	


##### Example

```
aimlHigh = require('./aiml-high');
var interpreter = new aimlHigh({name:'Bot', age:'42'}, 'Goodbye');
interpreter.loadFiles(['./test.aiml.xml']);

var callback = function(answer, wildCardArray, input){
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
};

interpreter.findAnswer('What is your name?', callback);
interpreter.findAnswer('My name is Ben.', callback);
interpreter.findAnswer('What is my name?', callback);
```


##### Supported AIML v1.1 tags:

```
<bot name="NAME"/>
<get name="NAME"/>
<set name="NAME">TEXT</set>
<random><li>A</li><li>B</li><li>C</li></random>
<srai>PATTERN TEXT</srai>
<sr/>
<star/>
<that>TEXT</that>
<uppercase>TEXT</uppercase>
<lowercase>TEXT</lowercase>
<formal>PROPER NOUN</formal>
<sentence>THIS IS A SENTENCE</sentence>
<condition name="NAME" value="VALUE">TEXT</condition>
<condition><li name="NAME" value="VALUE">TEXT</li><li name="NAME" value="VALUE">TEXT</li><li>TEXT</li></condition>
<condition name="NAME"><li value="VALUE">TEXT</li><li value="VALUE">TEXT</li><li>TEXT</li></condition>
<think><set name="NAME">TEXT</set></think>
<anyElement/><random><li>A</li><li>B</li><li>C</li></random><anyElement/>
<random><li><think><set name="NAME">TEXT</set></think></li><li>B</li></random>
<random><li><srai>PATTERN TEXT</srai></li><li>B</li></random>
<condition name="NAME" value="VALUE"><srai>PATTERN TEXT</srai></condition>
<condition><li name="NAME" value="VALUE"><srai>PATTERN TEXT</srai></li><li name="NAME" value="VALUE">TEXT</li></condition>
<condition name="NAME"><li value="VALUE"><srai>PATTERN TEXT</srai></li><li value="VALUE">TEXT</li></condition>
```


## Copyright & License

Based on previous work by [b3nra](https://www.npmjs.com/~b3nra).

Copyright 2016 [Greg Leuch](https://gleu.ch) & [betaworks](https://betaworks.com).
Released under [MIT License](https://opensource.org/licenses/MIT).
