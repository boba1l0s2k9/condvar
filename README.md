# NAME

CondVar - Conditional variables like AnyEvent::CondVar for node.js.

# SYNOPSIS

```js
var CondVar = require('CondVar');

var cv = new CondVar;
console.log("created a conditional variable");

// Imagine we used XMLHttpRequest() to do something interesting instead.
setTimeout(function(){
    console.log("1 second has passed, calling cv.send('asdf')");
    cv.send("asdf");
}, 1000);

console.log("wait here on cv.recv() until cv.send() is called");
var got = cv.recv();

// This won't get executed until cv.recv() returns.
console.log("cv.recv() finished, got: '" + got + "'\n");
```

# DESCRIPTION

Conditional variables provide a framework to make it easier to read and write 
asynchronous code.  In this general way this module is related to the likes 
of [async.js][] and the [Q][].

Although the high-level goal of this module is shared by many, conditional 
variables enable you to think about asynchronous code in a way that's simpler 
for at least some uses.  This is not a new API for promises, or ES6 
generators, or coroutines, etc -- it's an alternative way of thinking about 
and servings needs in the same problem space.

So what are conditional variables?  You can think about them in several ways, 
all reasonable (the following list is copied from [AnyEvent][AE::CV], with 
permission):

   * Condition variables are like callbacks - you can call them (and pass them 
     instead of callbacks). Unlike callbacks however, you can also wait for 
     them to be called.
   * Condition variables are signals - one side can emit or send them, the 
     other side can wait for them, or install a handler that is called when 
     the signal fires.
   * Condition variables are like "Merge Points" - points in your program 
     where you merge multiple independent results/control flows into one.
   * Condition variables represent a transaction - functions that start some 
     kind of transaction can return them, leaving the caller the choice 
     between waiting in a blocking fashion, or setting a callback.
   * Condition variables represent future values, or promises to deliver some 
     result, long before the result is available.

The most important way in which conditional variables are different from other 
async control flow modules for node.js is their ability to give the appearance 
of blocking / linear execution without actually stopping the event loop, and 
also without requiring changes to node.js, as in [node-fibers][].  I have 
nothing bad to say about other approaches to simplifying asynchronous control 
flow: if it works well for your needs, use it!

## new CondVar ( [ {"cb": function} ] )

The object returned by requesting a new instance from this module has several 
methods as described below.  You can optionally provide an object as the 
constructor argument with a field named "cb" containing a function: if you do 
it will behave as though you provided that function as an argument to the 
`cb()` method.  Independent of using the conditional variable to generating 
callbacks, the variable itself can be used **as** a callback function. 
Conditional variables start out "not ready", and become "ready" by calling 
`send()` or `croak()` on them, or using them as a callback.  Example using a 
conditional variable as a callback:

    var CondVar = require('CondVar');
    var cv = new CondVar;

    setTimeout(cv, 1000);
    cv.recv();
    console.log("This will be printed after 1 second of waiting");

## recv ()

Return the value given to a corresponding `send()` call.  Your script won't 
proceed past the invocation of `recv()` until the conditional variable becomes 
ready, e.g. by calling `send()`.   Note that while waiting event loop stuff 
continues to happen.  Once `recv()` returns it's okay to call it many times 
(the same value will be returned).  Also note that doing a blocking wait in a 
callback is not supported, that is, recursive invocation of a blocking 
`recv()` is not allowed, and the `recv()` call will throw an exception if you 
try.  Examples:

    var CondVar = require('CondVar');

    // Example: basic use
    var cv = new CondVar;
    setTimeout(function(){ cv.send('hello') }, 1000);
    var this_contains_hello = cv.recv();
    console.log("This will be printed after 1 second of waiting");

    // Example: send() before recv(), also multiple recv() calls
    var cv2 = new CondVar;
    cv2.send('foo');
    var result1 = cv2.recv() // This will not wait at all, returns immediately.
    var result2 = cv2.recv() // This returns the same value, immediately.

    // Example: recursive blocking throws exception
    var cv1 = new CondVar,
        cv2 = new CondVar;
    // The call to cv2.recv() will throw an exception
    setTimeout(function(){ cv2.recv(); cv1.send(); }, 1000);
    setTimeout(function(){ cv2.send();             }, 2000);
    cv1.recv(); // Because we're already waiting here on cv1


## send ( [ value ] )

Place a value in the conditional variable.  If elsewhere code is waiting on 
`recv()`, it will now return this result.  Or if a callback is set via `cb()` 
then it will be called now.  If you don't provide a value, the default value 
will be `undefined`.  Example:

    var CondVar = require('CondVar');
    var cv = new CondVar;

    cv.cb(function (cv_contains_hello) {
        console.log("This will be printed after calling send()");
        console.log("recv() value: " + cv_contains_hello.recv() "\n");
    });

    cv.send('hello');

## croak ( [ error ] )

This works similarly to `send()`, including supporting `cb()`, except that when 
`recv()` is called an exception will be thrown with the value of the `error` 
argument.  This provides a way for the sending side of a conditional variable 
to throw an exception on the receiving side.  Example:

    var CondVar = require('CondVar'),
             cv = new CondVar;

    // Just like send(), you can call it before/after recv() or from a callback
    cv.croak('this is an error message');

    try {
        cv.recv(); // This will throw an exception
    } catch (e) {
        console.log("This will get printed: " + e);
    }

## cb ( [ callback ] )

Set or get the callback associated with this conditional variable.  If the 
argument is `undefined` this will return the current callback, else it sets 
it.  No error checking is done to ensure the argument is a function.  The 
callback will have the conditional variable as its only argument, and 
any calls to `recv()` on that object will return their value immediately.

## begin ( [ callback ] )

Increment an internal counter that provides a kind of reference counting 
mechanism whereby the conditional variable will not be ready until that 
counter is decremented back down to zero via `end()`.  The optional callback 
will be called when the counter goes to zero.  There is only one callback per 
conditional variable, and the last one set wins.  Example of basic use:

    var CondVar = require('CondVar'),
             cv = new CondVar;

    cv.begin();
    cv.begin();
    setInterval(function(){ cv.end() }, 1000);
    cv.recv(); // This will return after two seconds

    // Better example: do some parallel work
    cv2 = new CondVar;
    cv2.begin();
    ['host1', 'host2', 'host3'].forEach(function(host) {
        cv2.begin();
        ping_host(host, function (result) {
            cv2.end();
            console.log("print ping_host() result...");
        });
    });
    cv2.end();

    cv2.recv();
    console.log("This won't get printed until all hosts have bene pinged");

## end ()

Decrement an internal counter.  If the counter becomes zero and a callback was 
provided to `begin()` then it is called now, else `send()` is called without a 
value.

## ready ()

If `send()` or `croak()` has been called this returns `true`, else `false`.

# EXAMPLES

TODO: insert example showing simple use of HTTP client.

# DETAILS

## How does the node.js event loop work?

When you start node.js it goes through a process roughly like this:

   1. Initialize the [V8][] JavaScript engine, and the [libuv][] event loop.
   2. Execute your script.
   3. Run the main event loop.
   4. Exit / cleanup (this happens if the main event loop ever ends).

If during step #2 your script set up some timers, or started listening on a 
socket, or did anything else that uses the event loop, then after your script 
is executed and node.js enters the main event loop (step #3) it will stay 
there processing events in a loop until there are no more timers, no more IO 
handles, etc.  As soon as there's no more possibility of event loop work 
because all your listeners are closed, timers are stopped, etc, then node.js 
proceeds to step #4 and exits.  You can see this by writing a script that just 
prints "hello world": immediately after printing the output node.js will exit 
(because the event loop has nothing to do).

## How can recv() block while still allowing the event loop to continue?

When you call `recv()` it runs the event loop until the conditional variable 
becomes ready.  If you have timers, IO events, etc, happening asynchronously 
they will get processed (and callbacks fired and whatnot) just the same as the 
regular node.js event loop (it's literally calling the same API: 
[uv_run()][]).

## Are you saying this module runs the event loop from JavaScript?

Yes.  In particular this module uses [UVRun][] which exposes the required part 
of the libuv API to JavaScript.

This module (or your code) **must** run the event loop so long as you're using 
conditional variables: execution can't be allowed to proceed into the main 
node.js event loop until there's no chance of anything else calling `recv()`, 
because libuv does not support reentrancy (nested/recurisve calls) for most of 
its API, see [issue 758][].  i.e. if you're in a callback that was fired by 
libuv you can't call uv_run() to cause the event loop to process more work -- 
doing so would corrupt the stack and very likely cause node.js to crash.

# DEPENDENCIES

   * [UVRun][]: exposes the [uv_run()][] function from [libuv][], allowing 
     JavaScript code to control the main event loop.
   * Node.js: tested on v0.8.12 for Linux x86 and v0.10.22 for Windows x64. 
     It depends on libuv so it can't work before v0.5.6 (though that might be 
     too old).

# SEE ALSO

   * Same idea and API in Perl: [AnyEvent][AE], [AnyEvent::CondVar][AE::CV]
   * Ideas in the same category, for JavaScript:
       * [async.js][async.js]
       * [Q promises][Q]
       * [Many more][node-wiki-async]

# CREDITS

This module was originally written by [boba1l0s2k9@outlook.com][author] with 
the intent to create a node.js module that provides the same behavior and API 
as [AnyEvent::CondVar][AE::CV] does for Perl.

The code in this module is trivial, so really all the credit goes to
[Marc Lehmann][marc], the author of the Perl module of which this is just a 
clone of a small subset.  So all the good credit goes to Marc.  If you find 
any bugs, those are my fault -- not Marc's.  Marc was also generous enough to 
let me copy and adapt some of his documentation for conditional variables. 
Thank you!

[Tim Caswell][tim] also deserves credit because this module wouldn't be 
possible without [UVRun][].  Thanks Tim!

# LICENSE

This module is licensed under [CC0][], a kind of internationally-aware "public 
domain" license, or more properly said: a declaration of my affirmative intent 
to waive the rights normally reserved under copyright law.  You're free to 
copy, modify, sell for profit, etc, without any need to contact me, give me 
attribution, reproduce the license text, etc.  See [COPYING][] for the full 
license text.

[AE]: http://search.cpan.org/~mlehmann/AnyEvent-7.05/lib/AnyEvent.pm
[AE::CV]: http://search.cpan.org/~mlehmann/AnyEvent-7.05/lib/AnyEvent.pm#CONDITION_VARIABLES
[CC0]: http://creativecommons.org/publicdomain/zero/1.0/legalcode
[async.js]: https://github.com/caolan/async
[Q]: https://github.com/kriskowal/q
[node-wiki-async]: https://github.com/joyent/node/wiki/Modules#wiki-async-flow
[UVRun]: https://github.com/creationix/uvrun
[author]: mailto:boba1l0s2k9@outlook.com
[marc]: http://software.schmorp.de/
[tim]: http://creationix.com/
[uv_run()]: https://github.com/joyent/libuv/blob/v0.10/include/uv.h#L273
[libuv]: https://github.com/joyent/libuv
[node-fibers]: https://github.com/laverdet/node-fibers
[V8]: http://code.google.com/p/v8/
[issue 758]: https://github.com/joyent/libuv/issues/758
[COPYING]: [./COPYING]

