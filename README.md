aiml-high
=======

AIML Interpreter written in node.js<br/>
<br/>
aiml-high is a module that allows you to parse AIML files and to find the correct answer to a given message.<br/>
Previously based on AIML.js (aimlinterpreter).

<b>Installation</b>
<pre>$ npm install aiml-high</pre>
<br/>
<b>Dependencies</b><pre>
fs
xmldom
</pre>
<br/>
<b>Description</b><br/>
With <i>new AIMLInterpreter(botAttributes)</i> one can create a new interpreter object. <i>botAttributes</i> is an JSON-Object that 
can contain attributes of the bot one wants to use in AIML files, e.g. ({name: "Bot", age:"42"}).<br/>
This object has a function called <i>loadFiles(fileArray)</i> which receives an array of AIML files. 
This function loads the AIML file into memory.<br/>
Furthermore, the object has a function called <i>findAnswer(clientInput, cb)</i> which receives 
a message and a callback. The callback is called when an answer was found. 
The callback of <i>findAnswer</i> should look like this: <i>callback(result, wildCardArray, input)</i>.
<i>Result</i> is the answer from the AIML file and <i>wildCardArray</i> stores the values of all wildcardInputs passed previously from the client. The original input which triggered the answer is given back via <i>input</i>.	
<br/><br/>
<b>Example:</b><br/>
<pre><code>
AIMLInterpreter = require('./AIMLInterpreter');
var aimlInterpreter = new AIMLInterpreter({name:'WireInterpreter', age:'42'});
aimlInterpreter.loadFiles(['./test.aiml.xml']);

var callback = function(answer, wildCardArray, input){
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
};

aimlInterpreter.findAnswer('What is your name?', callback);
aimlInterpreter.findAnswer('My name is Ben.', callback);
aimlInterpreter.findAnswer('What is my name?', callback);
</code></pre><br/>
<b>Supported AIML tags:</b><pre>
&lt;bot name="<i>NAME</i>"/>
&lt;get name="<i>NAME</i>"/>
&lt;set name="<i>NAME</i>">TEXT&lt;/set>
&lt;random>&lt;li><i>A</i>&lt;/li>&lt;li><i>B</i>&lt;/li>&lt;li><i>C</i>&lt;/li>&lt;/random>
&lt;srai><i>PATTERN TEXT</i>&lt;/srai>
&lt;sr/>
&lt;star/>
&lt;that><i>TEXT</i>&lt;/that>
&lt;condition name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i>&lt;/condition>
&lt;condition>&lt;li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;li><i>TEXT</i>&lt;/li>&lt;/condition>
&lt;condition name="<i>NAME</i>">&lt;li value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;li value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;li><i>TEXT</i>&lt;/li>&lt;/condition>

&lt;think>&lt;set name="<i>NAME</i>">TEXT&lt;/set>&lt;/think>
&lt;anyElement/>&lt;random>&lt;li><i>A</i>&lt;/li>&lt;li><i>B</i>&lt;/li>&lt;li><i>C</i>&lt;/li>&lt;/random>&lt;anyElement/>
&lt;random>&lt;li>&lt;think>&lt;set name="<i>NAME</i>">TEXT&lt;/set>&lt;/think>&lt;/li>&lt;li><i>B</i>&lt;/li>&lt;/random>
&lt;random>&lt;li>&lt;srai><i>PATTERN TEXT</i>&lt;/srai>&lt;/li>&lt;li><i>B</i>&lt;/li>&lt;/random>
&lt;condition name="<i>NAME</i>" value="<i>VALUE</i>">&lt;srai><i>PATTERN TEXT</i>&lt;/srai>&lt;/condition>
&lt;condition>&lt;li name="<i>NAME</i>" value="<i>VALUE</i>">&lt;srai><i>PATTERN TEXT</i>&lt;/srai>&lt;/li>&lt;li name="<i>NAME</i>" value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;/condition>
&lt;condition name="<i>NAME</i>">&lt;li value="<i>VALUE</i>">&lt;srai><i>PATTERN TEXT</i>&lt;/srai>&lt;/li>&lt;li value="<i>VALUE</i>"><i>TEXT</i>&lt;/li>&lt;/condition>
</pre>

<br/>
<b>Contributors</b><br/>
Special thanks go to Sergio Rodriguez (https://github.com/sergiorodez), who contributed to the interpreter and enhanced its functionalities
