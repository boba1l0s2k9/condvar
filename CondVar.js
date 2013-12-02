/* jshint strict:true, proto:true, -W093 */

(function(){
"use strict";

var runOnce = require('uvrun').runOnce;

var global = {
     total_cv_count: 0,
      open_cv_count: 0,
    timer_keepalive: null,
            waiting: 0
};

/**
 * @module CondVar
 * @exports CondVar
 */

/**
 * A function that will be called when a conditional variable is triggered.
 * @callback CondVar.condvar_callback
 * @param {CondVar} cv - A conditional variable that is ready.
 */

/**
 * Object that can be passed to the constructor to set options.
 * @typedef CondVar.condvar_options
 * @type {object}
 * @property {condvar_callback} cb - Callback when the conditional variable is
 * triggered.
 */

/**
 * The object returned by requesting a new instance from this module has
 * several methods as described below.  You can optionally provide an object as
 * the constructor argument with a field named "cb" containing a function: if
 * you do it will behave as though you provided that function as an argument to
 * the `cb()` method.  Independent of using the conditional variable to
 * generating callbacks, the variable itself can be used **as** a callback
 * function.  Conditional variables start out "not ready", and become "ready"
 * by calling `send()` or `croak()` on them, or using them as a callback.
 * See example using a conditional variable as a callback.
 * @example
 *  var CondVar = require('condvar');
 *  var cv = new CondVar;
 *
 *  setTimeout(cv, 1000);
 *  cv.recv();
 *  console.log("This will be printed after 1 second of waiting");
 * @constructor module:CondVar
 * @param {condvar_options} [options] - Arguments, can set callback.
 * @returns {CondVar|function} Returns a conditional variable that can also be
 * used as a callback (e.g. calling it causes the conditional variable to be
 * triggered).
 */
function CondVar () {
    this.constructor.prototype.int_data   = undefined;
    this.constructor.prototype.int_cb     = undefined;
    this.constructor.prototype.int_end_cb = undefined;
    this.constructor.prototype.int_croak  = undefined;
    this.constructor.prototype.int_ready  = false;
    this.constructor.prototype.int_begin  = 0;
    this.constructor.prototype.int_id     = global.total_cv_count++;

    if (arguments.length &&
            typeof arguments[0].cb !== 'undefined')
        this.constructor.prototype.int_cb = arguments[0].cb;

    var cb = function () {
        this.constructor.prototype.send(null);
    }.bind(this);

    /* TODO cleaner solution */
    cb.__proto__ = this.constructor.prototype;

    if (!(global.open_cv_count++))
        global.timer_keepalive = setInterval(function(){}, 4e9);

    return cb;
}

/**
 * Place a value in the conditional variable.  If elsewhere code is waiting on
 * `recv()`, it will now return this result.  Or if a callback is set via
 * `cb()` then it will be called now.  If you don't provide a value, the
 * default value will be `undefined`.  {@link module:CondVar#recv|recv()}.
 * @example
 *  var CondVar = require('condvar');
 *  var cv = new CondVar;
 *
 *  cv.cb(function (cv_contains_hello) {
 *      console.log("This will be printed after calling send()");
 *      console.log("recv() value: " + cv_contains_hello.recv() "\n");
 *  });
 *
 *  cv.send('hello');
 * @method module:CondVar#send
 * @param {*} data - Value to store, makes conditional variable ready.
 * @returns Nothing.
 */
CondVar.prototype.send = function (data) {
    this.int_data  = data;

    if (this.int_ready)
        return;

    this.int_ready = true;
    if (this.int_cb)
        this.int_cb(this);
};

/**
 * Return the value given to a corresponding `send()` call.  Your script won't
 * proceed past the invocation of `recv()` until the conditional variable
 * becomes ready, e.g. by calling `send()`.   Note that while waiting event
 * loop stuff continues to happen.  Once `recv()` returns it's okay to call it
 * many times (the same value will be returned).  Also note that doing a
 * blocking wait in a callback is not supported, that is, recursive invocation
 * of a blocking `recv()` is not allowed, and the `recv()` call will throw an
 * exception if you try.  {@link module:CondVar#send|send()}.
 * @example
 *  var CondVar = require('condvar');
 *  // Example: basic use
 *  var cv = new CondVar;
 *  setTimeout(function(){ cv.send('hello') }, 1000);
 *  var this_contains_hello = cv.recv();
 *  console.log("This will be printed after 1 second of waiting");
 * @example
 *  // Example: send() before recv(), also multiple recv() calls
 *  var cv2 = new CondVar;
 *  cv2.send('foo');
 *  var result1 = cv2.recv() // This will not wait at all, returns immediately.
 *  var result2 = cv2.recv() // This returns the same value, immediately.
 * @example
 *  // Example: recursive blocking throws exception
 *  var cv1 = new CondVar,
 *      cv2 = new CondVar;
 *  // The call to cv2.recv() will throw an exception
 *  setTimeout(function(){ cv2.recv(); cv1.send(); }, 1000);
 *  setTimeout(function(){ cv2.send();             }, 2000);
 *  cv1.recv(); // Because we're already waiting here on cv1
 * @method module:CondVar#recv
 * @returns {*} Whatever was stored by {@link module:CondVar#send|send()}
 */
CondVar.prototype.recv = function () {
    var recursive_wait = false,
        have_events;

    if (!this.int_ready) {
        global.waiting++;
        if (global.waiting > 1)
            recursive_wait = true;
        else
            do {
                have_events = runOnce();
            } while (have_events && !this.int_ready);
        global.waiting--;
    }

    if (--global.open_cv_count === 0)
        clearInterval(global.timer_keepalive);

    if (recursive_wait) throw "recursive blocking wait attempted";

    if (typeof this.int_croak !== 'undefined')
        throw this.int_croak;

    return this.int_data;
};

/**
 * Forcibly cause all {CondVar#recv} to return.
 * @private
 */
CondVar.prototype._stop = function () {
    clearInterval(global.timer_keepalive);
};

/**
 * If `send()` or `croak()` has been called this returns `true`, else `false`.
 * @method module:CondVar#ready
 * @returns {boolean}
 */
CondVar.prototype.ready = function () {
    return this.int_ready;
};

/**
 * Gets and optionally sets the callback associated with this conditional
 * variable.  If the argument is `undefined` this will return the current
 * callback, else it sets it.  No error checking is done to ensure the argument
 * is a function.  The callback will have the conditional variable as its only
 * argument, and any calls to `recv()` on that object will return their value
 * immediately.
 * @method module:CondVar#cb
 * @property {condvar_callback} [cb] - Callback when conditional variable is
 * ready.
 * @returns {condvar_callback}
 */
CondVar.prototype.cb = function (cb) {
    if (typeof cb === 'undefined') return this.int_cb;
    return this.int_cb = cb;
};

/**
 * This works similarly to `send()`, including supporting `cb()`, except that
 * when `recv()` is called an exception will be thrown with the value of the
 * `error` argument.  This provides a way for the sending side of a conditional
 * variable to throw an exception on the receiving side.
 * {@link module:CondVar#send|send()}
 * @example
 *  var CondVar = require('condvar'),
 *           cv = new CondVar;
 *
 *  // Just like send(), you can call it before/after recv() or from a callback
 *  cv.croak('this is an error message');
 *
 *  try {
 *      cv.recv(); // This will throw an exception
 *  } catch (e) {
 *      console.log("This will get printed: " + e);
 *  }
 * @method module:CondVar#croak
 * @property {*} [err] - Error value.
 * @returns Nothing.
 */
CondVar.prototype.croak = function (err) {
    this.int_croak = (typeof err === 'undefined') ? null : err;
    this.send();
};

/**
 * Increment an internal counter that provides a kind of reference counting
 * mechanism whereby the conditional variable will not be ready until that
 * counter is decremented back down to zero via `end()`.  The optional callback
 * will be called when the counter goes to zero.  There is only one callback
 * per conditional variable, and the last one set wins.
 * {@link module:CondVar#end|end()}.
 * @example
 *  var CondVar = require('condvar'),
 *           cv = new CondVar;
 *
 *  cv.begin();
 *  cv.begin();
 *  setInterval(function(){ cv.end() }, 1000);
 *  cv.recv(); // This will return after two seconds
 *
 *  // Better example: do some parallel work
 *  cv2 = new CondVar;
 *  cv2.begin();
 *  ['host1', 'host2', 'host3'].forEach(function(host) {
 *      cv2.begin();
 *      ping_host(host, function (result) {
 *          cv2.end();
 *          console.log("print ping_host() result...");
 *      });
 *  });
 *  cv2.end();
 *
 *  cv2.recv();
 *  console.log("This won't get printed until all hosts have bene pinged");
 * @method module:CondVar#begin
 * @property {condvar_callback} [cb] - Callback when conditional variable is
 * ready.
 * @returns Nothing.
 */
CondVar.prototype.begin = function (cb) {
    if (typeof cb !== 'undefined') this.int_end_cb = cb;
    this.int_begin++;
};

/**
 * Decrement an internal counter.  If the counter becomes zero and a callback
 * was provided to `begin()` then it is called now, else `send()` is called
 * without a value. {@link module:CondVar#begin|begin()}.
 * @method module:CondVar#end
 * @returns Nothing.
 */
CondVar.prototype.end = function () {
    this.int_begin--;

    if (this.int_begin !== 0)
        return;

    this.int_ready = true;

    if (this.int_end_cb)
        this.int_end_cb(this);
    else
        this.send();
};

module.exports = CondVar;
}());
