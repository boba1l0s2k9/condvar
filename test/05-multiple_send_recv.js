var test = require("tap").test;

var CondVar = require('../CondVar.js');

test("multiple send recv", function (t) {
    t.plan(3);

    var cv1 = new CondVar(),
        cv2 = new CondVar(),
        cv3 = new CondVar();
    setTimeout(function(){ cv1.send("asdf1"); }, 200);
    setTimeout(function(){ cv2.send("asdf2"); }, 100);
    setTimeout(function(){ cv3.send("asdf3"); }, 100);
    t.equal(cv1.recv(), "asdf1");
    t.equal(cv2.recv(), "asdf2");
    t.equal(cv3.recv(), "asdf3");
});

