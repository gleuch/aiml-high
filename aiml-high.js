DOMParser = require('xmldom').DOMParser;
fs = require('fs');

var storedVariableValues = {};
var botAttributes = {};

var lastWildCardValue = '';
var wildCardArray = [];

var domArray = [];

var isAIMLFileLoaded = false;
var findAnswerAttempts = 0;
var maxFindAnswerAttempts = 10;

var previousAnswer = '';
var previousThinkTag = false;

//botAttributes contain things like name, age, master, gender...
var aimlHigh = function(botAttributesParam, lastAnswer){
    var self = this;
    botAttributes = botAttributesParam;
    if(lastAnswer !== undefined){
      previousAnswer = lastAnswer;
    }

    this.loadFiles = function(files){
        files.forEach(function(file){
            fs.readFile(file, 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                self.loadFromString(data);
            });
        });
    };

    this.loadFromString = function(str) {
        if(str === undefined){
          return;
        }
        var dom = new DOMParser().parseFromString(str.toString());
        domArray.push(dom);
        isAIMLFileLoaded = true;
    };

    this.findAnswer = function(clientInput, cb){
        //check if all AIML files have been loaded. If not, call this method again after a delay
        if(isAIMLFileLoaded){
            wildCardArray = [];
            var result = '';
            for(var i = 0; i < domArray.length; i++){
                var nodes = cleanDom(domArray[i].childNodes);
                result = findCorrectCategory(clientInput, nodes);
                if(result){
                    break;
                }
            }

            if(result){
                result = cleanStringFormatCharacters(result);
                previousAnswer = result;
            }
            cb(result, wildCardArray, clientInput);
        }
        else if(findAnswerAttempts < maxFindAnswerAttempts){
            var findAnswerWrapper = function(clientInput, cb){
                findAnswerAttempts++;
                return function(){
                    self.findAnswer(clientInput, cb);
                };
            };

            setTimeout(findAnswerWrapper(clientInput, cb), 1000);
        }
        else {
          console.log('Too many findAnswer attempts.', findAnswerAttempts);
          cb(undefined, wildCardArray, clientInput);
        }
    };
    //restart the DOM in order to load a new AIML File
    this.restartDom = function(){
        domArray = [];
        findAnswerAttempts = 0;
    };
};


// remove string control characters (like line-breaks '\r\n', leading / trailing spaces etc.)
var cleanStringFormatCharacters = function(str){
    var cleanedStr = str.replace(/\r\n/gi, '');
    cleanedStr = cleanedStr.replace(/^\s*/, '');
    cleanedStr = cleanedStr.replace(/\s*$/,'');
    return cleanedStr;
}

var cleanDom = function(childNodes){
    for(var i = 0; i < childNodes.length; i++){
        if(childNodes[i].hasOwnProperty('nodeValue') & typeof(childNodes[i].nodeValue) === 'string'){

            // remove all nodes of type 'text' when they just contain '\r\n'. This indicates line break in the AIML file
            if(childNodes[i].nodeValue.match(/^\s*(\r)?\n\s*$/gi)){
                childNodes[i].parentNode.removeChild(childNodes[i]);
            }
        }
    }

    // traverse through whole tree by recursive calls
    for(var j = 0; j < childNodes.length; j++){
        if(childNodes[j].hasOwnProperty('childNodes')){
            childNodes[j].childNodes = cleanDom(childNodes[j].childNodes);
        }
    }

    return childNodes;
};

var findCorrectCategory = function(clientInput, domCategories){
    //indexOfSetTagAmountWithWildCard indicates how many sets with wildcard occur so that those sets store the correct wildcard value
    var indexOfSetTagAmountWithWildCard = 0;

    var travereseThroughDomToFindMatchingPattern = function(categories){
        for(var i = 0; i < categories.length; i++){
            // sort past <aiml> document tag
            if(categories[i].tagName === 'aiml'){
              return travereseThroughDomToFindMatchingPattern(categories[i].childNodes);
            }
            else if(categories[i].tagName === 'category'){
                //traverse through the dom
                //text gets the value of the current pattern node
                var text = travereseThroughDomToFindMatchingPattern(categories[i].childNodes);

                //check if the input of the user matches the pattern text
                var matches = checkIfMessageMatchesPattern(clientInput, text);
                if(matches){
                    //check if a 'that' tag is existing. If yes, check if the text of the that tag matches the previous given answer.
                    //If it does not match, continue the traversion through the AIML file
                    var isMatchingThat = checkForThatMatching(categories[i].childNodes);
                    if(isMatchingThat){
                        var text = findFinalTextInTemplateNode(categories[i].childNodes);
                        if(text){
                            return text;
                        }
                        break;
                    }
                }
            }
            else if(categories[i].tagName === 'pattern'){
                var text = resolveChildNodesInPatternNode(categories[i].childNodes);
                return text;
            }
        }
    }

    var checkForThatMatching = function(categoryChildNodes){
        for(var i = 0; i < categoryChildNodes.length; i++){
            if(categoryChildNodes[i].tagName === 'that'){
                //if the previous answer of the bot does not match the that-tag text, then return undefined!
                if(categoryChildNodes[i].childNodes[0].nodeValue != previousAnswer){
                    return false;
                }
                else{
                    return true;
                }
            }
        }
        //if no that tag was found, everything 'fits'
        return true;
    }

    var resolveChildNodesInPatternNode = function(patternChildNodes){
        var text = '';

        for(var i = 0; i < patternChildNodes.length; i++){
            if(patternChildNodes[i].tagName === 'bot'){
                // console.log(patternChildNodes[i].getAttribute('name'),botAttributes)
                text = text + (botAttributes[patternChildNodes[i].getAttribute('name')] || '').toUpperCase();
            }
            else if(patternChildNodes[i].tagName === 'get'){
                text = text + (storedVariableValues[patternChildNodes[i].getAttribute('name')] || '').toUpperCase();
            }
            else if(patternChildNodes[i].tagName === 'set'){
                text = text + patternChildNodes[i].childNodes[0].nodeValue;
            }
            else{
                text = text + patternChildNodes[i].nodeValue;
            }
        }

        return text;
    }

    var findFinalTextInTemplateNode = function(childNodesOfTemplate){
        var text = '';

        //traverse through template nodes until final text is found
        //return it then to very beginning
        for(var i = 0; i < childNodesOfTemplate.length; i++){
            if(childNodesOfTemplate[i].tagName === 'template'){
                //traverse as long through the dom until final text was found
                //final text -> text after special nodes (bot, get, set,...) were resolved
                return findFinalTextInTemplateNode(childNodesOfTemplate[i].childNodes);
            }
            else if(childNodesOfTemplate[i].tagName === 'condition'){
                return resolveSpecialNodes(childNodesOfTemplate);
            }
            else if(childNodesOfTemplate[i].tagName === 'random'){
                //if random node was found, its children are 'li' nodes.
                return resolveSpecialNodes(childNodesOfTemplate);
            }
            else if(childNodesOfTemplate[i].tagName === 'srai'){
                //take pattern text of srai node to get answer of another category
                var sraiText = '' + findFinalTextInTemplateNode(childNodesOfTemplate[i].childNodes);
                //call findCorrectCategory again to find the category that belongs to the srai node
                var text = findCorrectCategory(sraiText, domCategories);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'li'){
                return findFinalTextInTemplateNode(childNodesOfTemplate[i].childNodes);
            }
            else if(childNodesOfTemplate[i].tagName === 'br'){
                //br elements are used for putting '\n' into the text
                return resolveSpecialNodes(childNodesOfTemplate);
            }
            else if(childNodesOfTemplate[i].tagName === 'pattern'){
                //(here it is already checked that this is the right pattern that matches the user input)
                //make use of the functions of the special nodes - bot, set, get...
                resolveSpecialNodes(childNodesOfTemplate[i].childNodes);
                continue;
            }
            else if(childNodesOfTemplate[i].tagName === 'think'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'bot'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'set'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'get'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'sr'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'star'){
                text = resolveSpecialNodes(childNodesOfTemplate);
                return text;
            }
            else if(childNodesOfTemplate[i].tagName === 'that'){

            }
            else{
                //this is the text of template node
                //after all special functions (bot, get, set,...) were resolved
                //return that text
                text = resolveSpecialNodes(childNodesOfTemplate);
                if((text.match('[\\n|\\t]*[^A-Z|^a-z|^!|^?]*')[0] === '') && (text.indexOf('function ()') === -1)){
                    return (text);
                }
            }
        }
    };

    var resolveSpecialNodes = function(innerNodes){
        var text = '';
        //concatenate string of all node children - normal text, bot tags, get tags, set tags...
        for(var i = 0; i < innerNodes.length; i++){
            if(innerNodes[i].tagName === 'bot'){
                //replace bot tags by the belonging bot attribute value
                text = text + botAttributes[innerNodes[i].getAttribute('name')];
            }
            else if(innerNodes[i].tagName === 'get'){
                //replace get tag by belonging variable value
                var getAux = storedVariableValues[innerNodes[i].getAttribute('name')];
                if(getAux === undefined){
                    text = text + '';
                }else{
                    text = text + getAux;
                }
            }
            else if(innerNodes[i].tagName === 'set'){
                //store value of set tag text into variable (variable name = attribute of set tag)
                //replace than set tag by the text value
                var aux='';
                var nameAttribute = innerNodes[i].getAttribute('name');
                if(innerNodes[i].childNodes[0].tagName === 'star'){
                    aux = resolveSpecialNodes(innerNodes[i].childNodes);
                    storedVariableValues[nameAttribute] = aux;
                    if(!previousThinkTag){
                        text = text + aux;
                    }
                }
                else if(innerNodes[i].childNodes[0].nodeValue === '*'
                    || innerNodes[i].childNodes[0].nodeValue === '_'){
                    //the first set-Tag with wildCard gets the first wildCardValue, the second set-Tag with wildCard gets the second wildCardValue etc.
                    storedVariableValues[nameAttribute] = wildCardArray[indexOfSetTagAmountWithWildCard];
                    indexOfSetTagAmountWithWildCard++;
                }else{
                    storedVariableValues[nameAttribute] = innerNodes[i].childNodes[0].nodeValue;
                }

                //If this set tag is a think tag's child
                if(previousThinkTag){
                    previousThinkTag = false;
                    text = text + '';
                }else{
                    text = text + resolveSpecialNodes(innerNodes[i].childNodes);
                }
            }
            else if (innerNodes[i].tagName === 'uppercase') {
              text = text + resolveSpecialNodes(innerNodes[i].childNodes).toUpperCase();
              return text;
            }
            else if (innerNodes[i].tagName === 'lowercase') {
              text = text + resolveSpecialNodes(innerNodes[i].childNodes).toLowerCase();
            }
            else if (innerNodes[i].tagName === 'sentence') {
              var formalText = resolveSpecialNodes(innerNodes[i].childNodes);
              text = text + formalText.charAt(0).toUpperCase() + formalText.slice(1);
            }
            else if (innerNodes[i].tagName === 'formal') {
              var formalText = resolveSpecialNodes(innerNodes[i].childNodes);
              text = text + formalText.split(' ').map(function(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
              }).join(' ');
            }
            else if(innerNodes[i].tagName === 'br'){
                text = text + '\n';
            }
            else if(innerNodes[i].tagName === 'think'){
                previousThinkTag = true;
                text = text + resolveSpecialNodes(innerNodes[i].childNodes);
            }
            else if(innerNodes[i].tagName === 'sr'){
                var result;

                //for-loop to go through all loaded AIML files
                for(var j = 0; j < domArray.length; j++){
                    result = findCorrectCategory(lastWildCardValue, domArray[j].childNodes);
                    //if in one of the dom trees a matching pattern was found, exit this inner loop
                    if(result){
                        text = text + result;
                        break;
                    }
                }
            }
            else if(innerNodes[i].tagName === 'random'){
                //Get a random number and find the li tag chosen
                var randomSeed = (function(s) {s = Math.sin(s) * 10000; return s - Math.floor(s);})(Math.random());
                var randomNumber = Math.floor(randomSeed * (innerNodes[i].childNodes.length));
                text = text + findFinalTextInTemplateNode([innerNodes[i].childNodes[randomNumber]]);
            }
            else if(innerNodes[i].tagName === 'star'){
                text = text + lastWildCardValue;
            }
            else if(innerNodes[i].tagName === 'srai'){
                //take pattern text of srai node to get answer of another category
                var sraiText = '' + findFinalTextInTemplateNode(innerNodes[i].childNodes);
                //call findCorrectCategory again to find the category that belongs to the srai node
                text = text + findCorrectCategory(sraiText, domCategories);
            }
            else if(innerNodes[i].tagName === 'condition') {
                // condition tag specification: list condition tag
                if(!innerNodes[i].hasAttribute('name')){
                    if(innerNodes[i].childNodes.length == 0){
                        return undefined;
                    }
                    var child;
                    for(var c in innerNodes[i].childNodes){
                        child = innerNodes[i].childNodes[c];
                        if(child.tagName === 'li'){
                            if(!child.hasAttribute('value')
                                || storedVariableValues[child.getAttribute('name')] === child.getAttribute('value')){
                                return findFinalTextInTemplateNode(child.childNodes);
                            }
                        }
                    }
                }
                // condition tag specification: multi condition tag
                else if(innerNodes[i].hasAttribute('value')){
                    if (storedVariableValues[innerNodes[i].getAttribute('name')] === innerNodes[i].getAttribute('value')) {
                        text = text + resolveSpecialNodes(innerNodes[i].childNodes);
                    }
                }
                // condition tag specification: single name list condition tags
                else if(innerNodes[i].childNodes.length > 0){
                    var child;
                    for(var c in innerNodes[i].childNodes){
                        child = innerNodes[i].childNodes[c];
                        if(child.tagName === 'li'){
                            if(!child.hasAttribute('value')
                                || storedVariableValues[innerNodes[i].getAttribute('name')] === child.getAttribute('value')){
                                return resolveSpecialNodes(child.childNodes);
                            }
                        }
                    }

                    return undefined;
                }
            }
            else if(innerNodes[i].tagName === undefined){
                //normal text (no special tag)
                text = text + innerNodes[i].nodeValue;
            }
            else {
              text = text + innerNodes[i].toString()
            }
        }

        text = cleanStringFormatCharacters(text);
        return text;
    }

    return travereseThroughDomToFindMatchingPattern(domCategories);
}

var checkIfMessageMatchesPattern = function(userInput, patternText){
    //convert wildcards in of the pattern node into a regex that matches every char
    var regexPattern = convertWildcardToRegex(patternText);

    //add one with the text in function 'convertWildcardToRegex' here a space is added before and after the user input
    //to prevent false matching
    if(userInput.charAt(0) != " "){
        userInput = " " + userInput;
    }

    var lastCharacterPosition  = userInput.length - 1;
    var lastCharacter = userInput.charAt(lastCharacterPosition);
    if(lastCharacter != " "){
        userInput = userInput + " ";
    }

    //match userInput with the regex pattern
    //if it matches, matchedString is defined
    var matchedString = userInput.toUpperCase().match(regexPattern);

    if(matchedString){
        //the matched pattern must be at least as long as the user input or must contain the regex
        if(matchedString[0].length >= userInput.length || regexPattern.indexOf('[A-Z|0-9|\\s]*[A-Z|0-9|-]*[A-Z|0-9]*[!|.|?|\\s]*') > -1){
            //if patternText contained a wild card, get the user input that were put into this wild card
            //use original patternText (* is not replaced by regex!)
            var information = getWildCardValue(userInput, patternText);

            return true;
        }
    }
    else{
        return false;
    }
}

var convertWildcardToRegex = function(text){
    var firstCharacter = text.charAt(0);
    //add a space before and after the pattern text (THIS IS LATER ALSO DONE FOR THE USER INPUT)
    //prevents false matchings
    //e.g. (HI as regex also matches HIM or HISTORY, but <space>HI</space> does only match <space>HI</space>)
    if(firstCharacter != "*" && firstCharacter != "_"){
        var text = " " + text;
    }
    var lastCharacterPosition = text.length - 1;
    var lastCharacter = text.charAt(lastCharacterPosition);

    //replace space before wildcard
    var modifiedText = text.replace(' _', '*').replace(' *', '*');
    //replace wildcard (*) by regex
    modifiedText = modifiedText.replace(/\*/g, '[A-Z|0-9|\\s]*[A-Z|0-9|\*|-]*[A-Z|0-9]*[!|.|?|\\s]*');

    if(lastCharacter != "*"){
//        text = text + " ";
        //pattern should also match when user inputs ends with a space, ?, ! or .
        modifiedText = modifiedText + '[\\s|?|!|.]*';
    }

    return modifiedText;
}

var getWildCardValue = function(userInput, patternText){
    //get all strings of the pattern that are divided by a *
    //e.g. WHAT IS THE RELATION BETWEEN * AND * -> [WHAT IS THE RELATION BETWEEN , AND ]
    var replaceArray = patternText.split('*');
    var wildCardInput = userInput;

    if(replaceArray.length > 1){
        //replace the string of the userInput which is fixed by the pattern
        for(var i = 0; i < replaceArray.length; i++){
            wildCardInput = wildCardInput.replace(new RegExp(replaceArray[i], 'i'), '|');
        }
        //split the wildCardInput string by | to differentiate multiple * inputs
        //e.g. userInput = WHAT IS THE RELATION BETWEEN TIM AND STRUPPI?
        //-> | TIM | STRUPPI
        //-> [TIM, STRUPPI]
        wildCardInput = wildCardInput.split('|');
        //split function can create an array which also includes spaces etc. -> e.g. [TIM, " ", "", STRUPPI, " "]
        //we just want the information
        var wildCardArrayIndex = 0;
        for(var i = 0; i < wildCardInput.length; i++){
            if(wildCardInput[i] != '' && wildCardInput[i] != ' ' && wildCardInput != undefined){
                var wildCard = wildCardInput[i];
                var wildCardLastCharIndex = wildCard.length - 1;
                var firstCharOfWildCard = wildCard.charAt(0);
                var lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);

                try{
                    //harmonize the wildcard string
                    //remove first char if it is a space.
                    //calculate the last index again since the length of the string changed
                    if(firstCharOfWildCard === ' '){
                        wildCard = wildCard.splice(0);
                        wildCardLastCharIndex = wildCard.length - 1;
                        lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                    }
                    //if the last char is a space, remove it
                    //calculate the last index again since the length of the string changed
                    if(lastCharOfWildCard === ' '){
                        wildCard = wildCard.substr(0, wildCardLastCharIndex);
                        wildCardLastCharIndex = wildCard.length - 1;
                        lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                    }
                    if(lastCharOfWildCard === '?'){
                        wildCard = wildCard.substr(0, wildCardLastCharIndex);
                    }
                }
                catch(e){

                }
                wildCardArray[wildCardArrayIndex] = wildCard;
                wildCardArrayIndex++;
            }
        }
    }
    if(wildCardArray.length - 1 >= 0){
        lastWildCardValue = wildCardArray[wildCardArray.length - 1];
    }

    return wildCardArray;
}

module.exports = aimlHigh;
