var CondVar = require('./CondVar.js');

console.log("starting\n");



/********************************************
 * EXAMPLE1: Explicit example of basic cv use
 */
var cv = new CondVar;
console.log("created a cv");

setTimeout(function(){
    console.log("calling cv.send('asdf')");
    cv.send("asdf");
}, 1000);

console.log("blocking on cv.recv() waiting for data");
var got = cv.recv();

console.log("cv.recv() finished, got: '" + got + "'\n");



/********************************************
 * EXAMPLE2: Multiple cv's at once
 */
var cv1 = new CondVar;
var cv2 = new CondVar;
var cv3 = new CondVar;

// Note that cv2 and cv3 will have send() called first
setTimeout(function(){ cv1.send("asdf1") }, 200);
setTimeout(function(){ cv2.send("asdf2") }, 100);
setTimeout(function(){ cv3.send("asdf3") }, 100);

// Though that doesn't matter because cv1 blocks on recv()
console.log("cv1 got: '" + cv1.recv() + "'");
console.log("cv2 got: '" + cv2.recv() + "'");
console.log("cv3 got: '" + cv3.recv() + "'\n");



/********************************************
 * EXAMPLE3: Using begin()/end() to wait for a group of cv's
 */
var cv_nest = new CondVar;
cv_nest.begin(function(cv){ console.log("called last end"); cv.send("x") });
cv_nest.begin();
cv_nest.begin();
setTimeout(function(){ console.log("calling end"); cv_nest.end(); },  100);
setTimeout(function(){ console.log("calling end"); cv_nest.end(); },  200);
setTimeout(function(){ console.log("calling end"); cv_nest.end(); },  300);
console.log("cv_nest got: '" + cv_nest.recv() + "'\n");



/********************************************
 * EXAMPLE4: Using a cv as a callback
 */
var cv_as_cb = new CondVar;
setTimeout(cv_as_cb, 100);
console.log("cv_as_cb got: " + cv_as_cb.recv() + "\n");



/********************************************
 * EXAMPLE5: Using cb() to trigger callback instead of blocking recv()
 */
var cv_cb = new CondVar;

// In most cases you can't use CondVar stuff in the main node.js event loop 
// because internally it calls uv_run(), and most calls to CondVar.recv() also 
// call uv_run() which to be safe would require uv_run() to support reentrancy 
// (which it does not).  This particular use is okay, though, because even 
// though the recv() won't return until the main loop is running, it won't 
// call uv_run() because the result is already available.
cv_cb.cb(function(cv){ console.log("cv_cb got: '" + cv.recv() + "'\n") });

setTimeout(function(){ cv_cb.send("cb result") },  1000);

console.log("waiting on callback cv to finish");

