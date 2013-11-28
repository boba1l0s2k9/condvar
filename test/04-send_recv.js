var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("basic send recv", function (t) {
    t.plan(1);

    var got, cv = new CondVar();
    setTimeout(function(){ cv.send("asdf"); }, 1000);
    got = cv.recv();
    t.equal(got, "asdf", "should be asdf");
});

