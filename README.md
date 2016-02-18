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

With `new aimlHigh(botAttributes)` one can create a new interpreter object. `botAttributes` is an JSON-Object that can contain attributes of the bot one wants to use in AIML files, e.g. `{name: "Bot", age:"42"}`.

This object has a function called `loadFiles(fileArray)` which receives an array of AIML files. This function loads the AIML file into memory. There is also a  `loadString(stringContent)` that can also be passed if AIML file has been saved into a string.

Furthermore, the object has a function called `findAnswer(clientInput, cb)` which receives a message and a callback. The callback is called when an answer was found. The callback of `findAnswer` should look like this: `callback(result, wildCardArray, input)`. `Result` is the answer from the AIML file and `wildCardArray` stores the values of all wildcardInputs passed previously from the client. The original input which triggered the answer is given back via `input`.	


##### Example

```
aimlHigh = require('./aiml-high');
var interpreter = new aimlHigh({name:'Bot', age:'42'});
interpreter.loadFiles(['./test.aiml.xml']);

var callback = function(answer, wildCardArray, input){
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
};

interpreter.findAnswer('What is your name?', callback);
interpreter.findAnswer('My name is Ben.', callback);
interpreter.findAnswer('What is my name?', callback);
```


##### Supported AIML tags:

```
<bot name="<i>NAME</i>"/>
<get name="<i>NAME</i>"/>
<set name="<i>NAME</i>">TEXT</set>
<random><li><i>A</i></li><li><i>B</i></li><li><i>C</i></li></random>
<srai><i>PATTERN TEXT</i></srai>
<sr/>
<star/>
<that><i>TEXT</i></that>
<condition name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i></condition>
<condition><li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i></li><li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i></li><li><i>TEXT</i></li></condition>
<condition name="<i>NAME</i>"><li value="<i>VALUE</i>"><i>TEXT</i></li><li value="<i>VALUE</i>"><i>TEXT</i></li><li><i>TEXT</i></li></condition>
<think><set name="<i>NAME</i>">TEXT</set></think>
<anyElement/><random><li><i>A</i></li><li><i>B</i></li><li><i>C</i></li></random><anyElement/>
<random><li><think><set name="<i>NAME</i>">TEXT</set></think></li><li><i>B</i></li></random>
<random><li><srai><i>PATTERN TEXT</i></srai></li><li><i>B</i></li></random>
<condition name="<i>NAME</i>" value="<i>VALUE</i>"><srai><i>PATTERN TEXT</i></srai></condition>
<condition><li name="<i>NAME</i>" value="<i>VALUE</i>"><srai><i>PATTERN TEXT</i></srai></li><li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i></li></condition>
<condition name="<i>NAME</i>"><li value="<i>VALUE</i>"><srai><i>PATTERN TEXT</i></srai></li><li value="<i>VALUE</i>"><i>TEXT</i></li></condition>
```


## Copyright & License

Based on previous work by [b3nra](https://www.npmjs.com/~b3nra).

Copyright 2016 [Greg Leuch](https://gleu.ch) & [betaworks](https://betaworks.com).
Released under [MIT License](https://opensource.org/licenses/MIT).
