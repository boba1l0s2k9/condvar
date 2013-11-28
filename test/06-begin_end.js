var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("basic begin end", function (t) {
    t.plan(1);

    var cv_nest = new CondVar();
    cv_nest.begin(function(cv){ cv.send("x"); });
    cv_nest.begin();
    cv_nest.begin();
    setTimeout(function(){ cv_nest.end(); },  100);
    setTimeout(function(){ cv_nest.end(); },  200);
    setTimeout(function(){ cv_nest.end(); },  300);
    t.equal(cv_nest.recv(), "x");
});

