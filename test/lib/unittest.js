// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005 Jon Tirsen (http://www.tirsen.com)
//           (c) 2005 Michael Schuerig (http://www.schuerig.de/michael/)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// experimental, Firefox-only
Event.simulateMouse = function(element, eventName) {
  var options = Object.extend({
    pointerX: 0,
    pointerY: 0,
    buttons: 0
  }, arguments[2] || {});
  var oEvent = document.createEvent("MouseEvents");
  oEvent.initMouseEvent(eventName, true, true, document.defaultView, 
    options.buttons, options.pointerX, options.pointerY, options.pointerX, options.pointerY, 
    false, false, false, false, 0, $(element));
  
  if(this.mark) Element.remove(this.mark);
  this.mark = document.createElement('div');
  this.mark.appendChild(document.createTextNode(" "));
  document.body.appendChild(this.mark);
  this.mark.style.position = 'absolute';
  this.mark.style.top = options.pointerY + "px";
  this.mark.style.left = options.pointerX + "px";
  this.mark.style.width = "5px";
  this.mark.style.height = "5px;";
  this.mark.style.borderTop = "1px solid red;"
  this.mark.style.borderLeft = "1px solid red;"
  
  if(this.step)
    alert('['+new Date().getTime().toString()+'] '+eventName+'/'+Test.Unit.inspect(options));
  
  $(element).dispatchEvent(oEvent);
};

// Note: Due to a fix in Firefox 1.0.5/6 that probably fixed "too much", this doesn't work in 1.0.6 or DP2.
// You need to downgrade to 1.0.4 for now to get this working
// See https://bugzilla.mozilla.org/show_bug.cgi?id=289940 for the fix that fixed too much
Event.simulateKey = function(element, eventName) {
  var options = Object.extend({
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    keyCode: 0,
    charCode: 0
  }, arguments[2] || {});

  var oEvent = document.createEvent("KeyEvents");
  oEvent.initKeyEvent(eventName, true, true, window, 
    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
    options.keyCode, options.charCode );
  $(element).dispatchEvent(oEvent);
};

Event.simulateKeys = function(element, command) {
  for(var i=0; i<command.length; i++) {
    Event.simulateKey(element,'keypress',{charCode:command.charCodeAt(i)});
  }
};

var Test = {}
Test.Unit = {};

// security exception workaround
Test.Unit.inspect = Object.inspect;

Test.Unit.Logger = Class.create();
Test.Unit.Logger.prototype = {
  initialize: function(log) {
    this.log = $(log);
    if (this.log) {
      this._createLogTable();
    }
  },
  start: function(testName) {
    if (!this.log) return;
    this.testName = testName;
    this.lastLogLine = document.createElement('tr');
    this.statusCell = document.createElement('td');
    this.statusCell.className = "status";
    this.nameCell = document.createElement('td');
    var humanName = testName.underscore().gsub(/_/, ' ').sub(/^test/, '').strip().capitalize();
    this.nameCell.appendChild(document.createTextNode(humanName));
    this.messageCell = document.createElement('td');
    this.lastLogLine.appendChild(this.statusCell);
    this.lastLogLine.appendChild(this.nameCell);
    this.lastLogLine.appendChild(this.messageCell);
    this.loglines.appendChild(this.lastLogLine);
  },
  finish: function(status, summary) {
    if (!this.log) return;
    this.lastLogLine.className = status;
    this.statusCell.innerHTML = status;
    this.messageCell.innerHTML = this._toHTML(summary);
  },
  message: function(message) {
    if (!this.log) return;
    this.messageCell.innerHTML = this._toHTML(message);
  },
  summary: function(summary) {
    if (!this.log) return;
    this.logsummary.innerHTML = this._toHTML(summary);
  },
  _createLogTable: function() {
    this.log.innerHTML =
    '<div id="logsummary"></div>' +
    '<table id="logtable" cellspacing="0" cellpadding="0">' +
    '<thead><tr><th>Status</th><th>Test</th><th>Message</th></tr></thead>' +
    '<tbody id="loglines"></tbody>' +
    '</table>';
    this.logsummary = $('logsummary')
    this.loglines = $('loglines');
  },
  _toHTML: function(txt) {
    return txt.escapeHTML().replace(/\n/g,"<br/>");
  }
}

Test.Unit.Runner = Class.create();
Test.Unit.Runner.prototype = {
  initialize: function(testcases) {
    this.options = Object.extend({
      testLog: 'testlog'
    }, arguments[1] || {});
    this.options.resultsURL = this.parseResultsURLQueryParameter();
    if (this.options.testLog) {
      this.options.testLog = $(this.options.testLog) || null;
    }
    if(this.options.tests) {
      this.tests = [];
      for(var i = 0; i < this.options.tests.length; i++) {
        if(/^test/.test(this.options.tests[i])) {
          this.tests.push(new Test.Unit.Testcase(this.options.tests[i], testcases[this.options.tests[i]], testcases["setup"], testcases["teardown"]));
        }
      }
    } else {
      if (this.options.test) {
        this.tests = [new Test.Unit.Testcase(this.options.test, testcases[this.options.test], testcases["setup"], testcases["teardown"])];
      } else {
        this.tests = [];
        for(var testcase in testcases) {
          if(/^test/.test(testcase)) {
            this.tests.push(new Test.Unit.Testcase(testcase, testcases[testcase], testcases["setup"], testcases["teardown"]));
          }
        }
      }
    }
    this.currentTest = 0;
    this.logger = new Test.Unit.Logger(this.options.testLog);
    Event.observe(window, "load", function() { 
      setTimeout(this.runTests.bind(this), 100);
    }.bind(this));
  },
  parseResultsURLQueryParameter: function() {
    return window.location.search.parseQuery()["resultsURL"];
  },
  // Returns:
  //  "ERROR" if there was an error,
  //  "FAILURE" if there was a failure, or
  //  "SUCCESS" if there was neither
  getResult: function() {
    var results = {
      tests: this.tests.length,
      assertions: 0,
      failures: 0,
      errors: 0
    };
    
    return this.tests.inject(results, function(results, test) {
      results.assertions += test.assertions;
      results.failures   += test.failures;
      results.errors     += test.errors;
      return results;
    });
  },
  
  postResults: function() {
    if (this.options.resultsURL) {
      new Ajax.Request(this.options.resultsURL, 
        { method: 'get', parameters: this.getResult(), asynchronous: false });
    }
  },
  runTests: function() {
    var test = this.tests[this.currentTest];
    if (!test) {
      // finished!
      this.postResults();
      this.logger.summary(this.summary());
      return;
    }
    if(!test.isWaiting) {
      this.logger.start(test.name);
    }
    test.run();
    if(test.isWaiting) {
      this.logger.message("Waiting for " + test.timeToWait + "ms");
      setTimeout(this.runTests.bind(this), test.timeToWait || 1000);
    } else {
      this.logger.finish(test.status(), test.summary());
      var actionButtons = test.actionButtons();
      if (actionButtons) 
        $(this.logger.lastLogLine).down('td', 2).appendChild(actionButtons);
        
      this.currentTest++;
      // tail recursive, hopefully the browser will skip the stackframe
      this.runTests();
    }
  },
  
  summary: function() {
    return '#{tests} tests, #{assertions} assertions, #{failures} failures, #{errors} errors'
      .interpolate(this.getResult());
  }
}

Test.Unit.Assertions = Class.create();
Test.Unit.Assertions.prototype = {
  initialize: function() {
    this.assertions = 0;
    this.failures   = 0;
    this.errors     = 0;
    this.messages   = [];
    this.actions    = {};
  },
  summary: function() {
    return (
      this.assertions + " assertions, " + 
      this.failures   + " failures, " +
      this.errors     + " errors" + "\n" +
      this.messages.join("\n"));
  },
  actionButtons: function() {
    if (!Object.keys(this.actions).any()) return false;
    var div = $(document.createElement("div"));
    div.addClassName("action_buttons");
  
    for (var title in this.actions) {
      var button = $(document.createElement("input"));
      button.value = title;
      button.type = "button";
      button.observe("click", this.actions[title]);
      div.appendChild(button);
    }
    return div;
  },
  pass: function() {
    this.assertions++;
  },
  fail: function(message) {
    this.failures++;

    var line = "";
    try {
      throw new Error("stack");
    } catch(e){
      line = (/\.html:(\d+)/.exec(e.stack || '') || ['',''])[1];
    }

    this.messages.push("Failure: " + message + (line ? " Line #" + line : ""));
  },
  info: function(message) {
    this.messages.push("Info: " + message);
  },
  error: function(error, test) {
    this.errors++;
    this.actions['retry with throw'] = function() { test.run(true) };
    this.messages.push(error.name + ": "+ error.message + "(" + Test.Unit.inspect(error) + ")");
  },
  status: function() {
    if (this.failures > 0) return 'failed';
    if (this.errors > 0) return 'error';
    return 'passed';
  },
  isRunningFromRake: (function() {
    return window.location.port == 4711;
  })(),
  assert: function(expression) {
    var message = arguments[1] || 'assert: got "' + Test.Unit.inspect(expression) + '"';
    try { expression ? this.pass() : 
      this.fail(message); }
    catch(e) { this.error(e); }
  },
  assertEqual: function(expected, actual) {
    var message = arguments[2] || "assertEqual";
    try { (expected == actual) ? this.pass() :
      this.fail(message + ': expected "' + Test.Unit.inspect(expected) + 
        '", actual "' + Test.Unit.inspect(actual) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNotEqual: function(expected, actual) {
    var message = arguments[2] || "assertNotEqual";
    try { (expected != actual) ? this.pass() : 
      this.fail(message + ': got "' + Test.Unit.inspect(actual) + '"'); }
    catch(e) { this.error(e); }
  },
  assertEnumEqual: function(expected, actual) {
    var message = arguments[2] || "assertEnumEqual";
    expected = $A(expected);
    actual = $A(actual);
    try { expected.length == actual.length && 
      expected.zip(actual).all(function(pair) { return pair[0] == pair[1] }) ?
        this.pass() : this.fail(message + ': expected ' + Test.Unit.inspect(expected) + 
          ', actual ' + Test.Unit.inspect(actual)); }
    catch(e) { this.error(e); }
  },
  assertEnumNotEqual: function(expected, actual) {
    var message = arguments[2] || "assertEnumEqual";
    expected = $A(expected);
    actual = $A(actual);
    try { expected.length != actual.length || 
      expected.zip(actual).any(function(pair) { return pair[0] != pair[1] }) ?
        this.pass() : this.fail(message + ': ' + Test.Unit.inspect(expected) + 
          ' was the same as ' + Test.Unit.inspect(actual)); }
    catch(e) { this.error(e); }
  },
  assertHashEqual: function(expected, actual) {
    var message = arguments[2] || "assertHashEqual";
    expected = $H(expected);
    actual = $H(actual);
    var expected_array = expected.toArray().sort(), actual_array = actual.toArray().sort();
    // from now we recursively zip & compare nested arrays
    try { expected_array.length == actual_array.length && 
      expected_array.zip(actual_array).all(function(pair) {
        return pair.all(function(i){ return i && i.constructor == Array }) ?
          pair[0].zip(pair[1]).all(arguments.callee) : pair[0] == pair[1];
      }) ?
        this.pass() : this.fail(message + ': expected ' + Test.Unit.inspect(expected) + 
          ', actual ' + Test.Unit.inspect(actual)); }
    catch(e) { this.error(e); }
  },
  assertHashNotEqual: function(expected, actual) {
    var message = arguments[2] || "assertHashEqual";
    expected = $H(expected);
    actual = $H(actual);
    var expected_array = expected.toArray().sort(), actual_array = actual.toArray().sort();
    // from now we recursively zip & compare nested arrays
    try { !(expected_array.length == actual_array.length && 
      expected_array.zip(actual_array).all(function(pair) {
        return pair.all(function(i){ return i && i.constructor == Array }) ?
          pair[0].zip(pair[1]).all(arguments.callee) : pair[0] == pair[1];
      })) ?
        this.pass() : this.fail(message + ': ' + Test.Unit.inspect(expected) + 
          ' was the same as ' + Test.Unit.inspect(actual)); }
    catch(e) { this.error(e); }
  },
  assertIdentical: function(expected, actual) { 
    var message = arguments[2] || "assertIdentical"; 
    try { (expected === actual) ? this.pass() : 
      this.fail(message + ': expected "' + Test.Unit.inspect(expected) +  
        '", actual "' + Test.Unit.inspect(actual) + '"'); } 
    catch(e) { this.error(e); } 
  },
  assertNotIdentical: function(expected, actual) { 
    var message = arguments[2] || "assertNotIdentical"; 
    try { !(expected === actual) ? this.pass() : 
      this.fail(message + ': expected "' + Test.Unit.inspect(expected) +  
        '", actual "' + Test.Unit.inspect(actual) + '"'); } 
    catch(e) { this.error(e); } 
  },
  assertNull: function(obj) {
    var message = arguments[1] || 'assertNull'
    try { (obj===null) ? this.pass() : 
     this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNotNull: function(obj) {
    var message = arguments[1] || 'assertNotNull'
    try { (obj!==null) ? this.pass() : 
     this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertUndefined: function(obj) {
    var message = arguments[1] || 'assertUndefined'
    try { (typeof obj=="undefined") ? this.pass() :
      this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNotUndefined: function(obj) {
    var message = arguments[1] || 'assertNotUndefined'
    try { (typeof obj != "undefined") ? this.pass() :
      this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNullOrUndefined: function(obj){
    var message = arguments[1] || 'assertNullOrUndefined'
    try { (obj==null) ? this.pass() :
      this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNotNullOrUndefined: function(obj){
    var message = arguments[1] || 'assertNotNullOrUndefined'
    try { (obj!=null) ? this.pass() :
      this.fail(message + ': got "' + Test.Unit.inspect(obj) + '"'); }
    catch(e) { this.error(e); }
  },
  assertMatch: function(expected, actual) {
    var message = arguments[2] || 'assertMatch';
    var regex = new RegExp(expected);
    try { regex.exec(actual) ? this.pass() :
      this.fail(message + ' : regex: "' +  Test.Unit.inspect(expected) + ' did not match: ' + Test.Unit.inspect(actual) + '"'); }
    catch(e) { this.error(e); }
  },
  assertNoMatch: function(expected, actual) {
    var message = arguments[2] || 'assertMatch';
    var regex = new RegExp(expected);
    try { !regex.exec(actual) ? this.pass() :
      this.fail(message + ' : regex: "' +  Test.Unit.inspect(expected) + ' matched: ' + Test.Unit.inspect(actual) + '"'); }
    catch(e) { this.error(e); }
  },
  assertHidden: function(element) {
    var message = arguments[1] || 'assertHidden';
    this.assertEqual("none", element.style.display, message);
  },
  assertInstanceOf: function(expected, actual) {
    var message = arguments[2] || 'assertInstanceOf';
    try { 
      (actual instanceof expected) ? this.pass() : 
      this.fail(message + ": object was not an instance of the expected type"); }
    catch(e) { this.error(e); } 
  },
  assertNotInstanceOf: function(expected, actual) {
    var message = arguments[2] || 'assertNotInstanceOf';
    try { 
      !(actual instanceof expected) ? this.pass() : 
      this.fail(message + ": object was an instance of the not expected type"); }
    catch(e) { this.error(e); } 
  },
  assertRespondsTo: function(method, obj) {
    var message = arguments[2] || 'assertRespondsTo';
    try {
      (obj[method] && typeof obj[method] == 'function') ? this.pass() : 
      this.fail(message + ": object doesn't respond to [" + method + "]"); }
    catch(e) { this.error(e); }
  },
  assertRaise: function(exceptionName, method) {
    var message = arguments[2] || 'assertRaise';
    try { 
      method();
      this.fail(message + ": exception expected but none was raised"); }
    catch(e) {
      (e.name==exceptionName) ? this.pass() : this.error(e); 
    }
  },
  assertNothingRaised: function(method) {
    var message = arguments[1] || 'assertNothingRaised';
    try {
      method();
      this.pass();
    } catch (e) {
      this.fail(message + ": " + e.toString());
    }
  },
  _isVisible: function(element) {
    element = $(element);
    if(!element.parentNode) return true;
    this.assertNotNull(element);
    if(element.style && Element.getStyle(element, 'display') == 'none')
      return false;
    
    return this._isVisible(element.parentNode);
  },
  assertNotVisible: function(element) {
    this.assert(!this._isVisible(element), Test.Unit.inspect(element) + " was not hidden and didn't have a hidden parent either. " + ("" || arguments[1]));
  },
  assertVisible: function(element) {
    this.assert(this._isVisible(element), Test.Unit.inspect(element) + " was not visible. " + ("" || arguments[1]));
  },
  assertElementsMatch: function() {
    var expressions = $A(arguments), elements = $A(expressions.shift());
    if (elements.length != expressions.length) {
      this.fail('assertElementsMatch: size mismatch: ' + elements.length + ' elements, ' + expressions.length + ' expressions (' + expressions.inspect() + ')');
      return false;
    }
    elements.zip(expressions).all(function(pair, index) {
      var element = $(pair.first()), expression = pair.last();
      if (element.match(expression)) return true;
      this.fail('assertElementsMatch: (in index ' + index + ') expected ' + expression.inspect() + ' but got ' + element.inspect());
    }.bind(this)) && this.pass();
  },
  assertElementMatches: function(element, expression) {
    this.assertElementsMatch([element], expression);
  },
  benchmark: function(operation, iterations) {
    var startAt = new Date();
    (iterations || 1).times(operation);
    var timeTaken = ((new Date())-startAt);
    this.info((arguments[2] || 'Operation') + ' finished ' + 
       iterations + ' iterations in ' + (timeTaken/1000)+'s' );
    return timeTaken;
  }
}

Test.Unit.Testcase = Class.create();
Object.extend(Object.extend(Test.Unit.Testcase.prototype, Test.Unit.Assertions.prototype), {
  initialize: function(name, test, setup, teardown) {
    Test.Unit.Assertions.prototype.initialize.bind(this)();
    this.name           = name;
    this.test           = test || function() {};
    this.setup          = setup || function() {};
    this.teardown       = teardown || function() {};
    this.isWaiting      = false;
    this.timeToWait     = 1000;
  },
  wait: function(time, nextPart) {
    this.isWaiting = true;
    this.test = nextPart;
    this.timeToWait = time;
  },
  run: function(rethrow) {
    try {
      try {
        if (!this.isWaiting) this.setup.bind(this)();
        this.isWaiting = false;
        this.test.bind(this)();
      } finally {
        if(!this.isWaiting) {
          this.teardown.bind(this)();
        }
      }
    }
    catch(e) { 
      if (rethrow) throw e;
      this.error(e, this); 
    }
  }
});