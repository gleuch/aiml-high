aimlHigh = require('./aiml-high');

var interpret = new aimlHigh({name:'WireInterpreter', age:'42'});
interpret.loadFiles(['./test.aiml.xml']);

var callback = function(answer, wildCardArray, input){
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
};

var caseCallback = function(answer, wildCardArray, input){
  if (answer == this) {
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
  } else {
    console.log('ERROR:', answer);
    console.log('   Expected:', this.toString());
  }
};


// Test bot attributes
interpret.findAnswer('What is your name?', callback);

// Test setting and getting variable values
interpret.findAnswer('My name is Ben.', callback);
interpret.findAnswer('What is my name?', callback);

// Test srai tag
interpret.findAnswer('Who are you?', callback);

// Test random tag
interpret.findAnswer('Give me a letter.', callback);
interpret.findAnswer('Test srai in random.', callback);
interpret.findAnswer('Test wildcard What is my name?', callback);

// Test sr tag
interpret.findAnswer('Test sr tag', callback);
interpret.findAnswer('Test sr in random', callback);

// Test star tag
interpret.findAnswer('Test the star tag', callback);

// Test that tag
interpret.findAnswer('Test the that tag', callback)
interpret.findAnswer('Test that-tag. match',callback);
interpret.findAnswer('Test that-tag. dont match', callback);

// Test condition tag
interpret.findAnswer('What is your feeling today?', callback);
interpret.findAnswer('How are you feeling today?', callback);
interpret.findAnswer('Tell me about your feelings', callback);
interpret.findAnswer("You feel crumpy", callback);
interpret.findAnswer('What is your feeling today?', callback);
interpret.findAnswer("You feel happy", callback);
interpret.findAnswer('How are you feeling today?', callback);
interpret.findAnswer('What is your feeling today?', callback);
interpret.findAnswer('Tell me about your feelings', callback);
interpret.findAnswer("You feel sad", callback);
interpret.findAnswer('How are you feeling today?', callback);
interpret.findAnswer('What is your feeling today?', callback);
interpret.findAnswer('Tell me about your feelings', callback);

// Test wildcards
interpret.findAnswer('Explain HANA', callback);

//Test Think tag
interpret.findAnswer('I am 123', callback);
interpret.findAnswer('How old am I?', callback);
interpret.findAnswer('What do you know about me?', callback);

//Test condition and srai
interpret.findAnswer('Test condition and srai', callback);
interpret.findAnswer("You feel happy", callback);
interpret.findAnswer('Test condition and srai', callback);
interpret.findAnswer("You feel crumpy", callback);
interpret.findAnswer('Test condition and srai', callback);

// Test finding nothing
interpret.findAnswer('Test the wildcard pattern!', callback);

// Case insensitive testing
interpret.findAnswer('You feel BAD', caseCallback.bind('I feel BAD!'));
interpret.findAnswer('You feel good', caseCallback.bind('I feel good!'));
interpret.findAnswer('You feel hAPPy', caseCallback.bind('I feel HAPPy!')); // INTENTIONAL ERROR CHECKING
interpret.findAnswer('You feel FINEeeeee', caseCallback.bind('I feel FINEEEEEE!')); // INTENTIONAL ERROR CHECKING
