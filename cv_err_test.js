var assert = require('assert');
var Cv     = require('./CondVar.js');

console.log("starting\n");

var cv;

/********************************************
 * EXAMPLE1: Trigger recursive blocking error
 */
console.log("EXAMPLE1");
var cv1 = new Cv,
    cv2 = new Cv;

// Try to wait for cv2 before sending cv1 (cv2 recv will fail).
setTimeout(function(){
    assert.throws( function(){ cv2.recv() },
        /^recursive blocking wait attempted$/
    );
    cv1.send("cv1value");
}, 100);

// Send cv2, which you might imagine would unblock cv1 above, except that this 
// timer is set to go off after the one above.
setTimeout(function(){ cv2.send("cv2value"); }, 200);

// Wait on cv1 (which waits on cv2).  Note that the setTimeout() calls don't 
// block execution so this cv1.recv() call is the first one to get executed. 
// After the first timer fires cv2.recv() will be called and throw an 
// exception which is caught, then cv1.send() is called and this completes.
console.log("cv1.recv() finished, got: '" + cv1.recv() + "'\n");

assert.strictEqual(cv2.ready(), false);
assert.strictEqual(cv1.recv(), 'cv1value');



/********************************************
 * EXAMPLE2: Use croak() to propogate an error
 */
console.log("EXAMPLE2");
cv = new Cv;
setTimeout(function(){
    console.log("calling cv.croak('cv2value')\n");
    cv.croak("cv2value");
}, 100);

assert.throws( function(){ cv.recv() },
    /^cv2value$/
);



/********************************************
 * EXAMPLE3: Verify cv properties / behavior
 */
console.log("EXAMPLE3");
cv = new Cv;

assert.strictEqual(typeof cv.cb(),             'undefined', 'cb should be undef')
assert.strictEqual(typeof cv.cb(function(){}), 'function',  'should be func')
assert.strictEqual(typeof cv.cb(),             'function',  'should be func')
assert.ifError(cv.cb(null),                                 'should be false')
assert.strictEqual(cv.ready(),                  false,      'should be false');

setTimeout(function(){
    cv.send("cv3value");
}, 100);

var result1 = cv.recv(),
    result2 = cv.recv();

assert.strictEqual(cv.ready(),                  true,       'should be true');
assert.strictEqual(result1,                     'cv3value', 'should be equal');
assert.strictEqual(result1,                     result2,    'should be equal');

console.log("cv.recv() finished, got: '" + result1 + "'\n");



/********************************************
 * EXAMPLE4: Show what doesn't work: using CondVar in the main loop
 */
console.log("EXAMPLE4");

setTimeout(function(){
    assert(1 == 2, 'exception should have fired and prevented this')
},  500);

process.once('uncaughtException', function (e) {
    console.log("exception because ev_run() isn't reentrant:\n\n" + e.stack + "\n");
    process.exit();
});

// Ask for something to be run in the main node.js loop (i.e. after the rest of 
// this script has ended)
process.nextTick(function(){
    var cv = new Cv;

    // Ask for something additional to be run in the main node.js loop at the 
    // next turn of the loop (i.e. not now)
    process.nextTick(function(){ console.log("this does print, second") });

    // This runs even later
    setTimeout(function(){ cv.send("nextTick result") },  100);

    console.log("this gets printed first");

    // This causes node to reenter uv_run(), corrupting the stack.  On my 
    // system it does still call the second nextTick and even the following
    // recv() does return.  But right after that it generates an exception
    // about a nextTick() callback being undefined.
    console.log("nextTick cv got: '" + cv.recv() + "'");
});

console.log("nextTick stuff gets run after this");

