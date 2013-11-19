(function(){
"use strict";

var runOnce = require('uvrun').runOnce;

var global = {
     total_cv_count: 0,
      open_cv_count: 0,
    timer_keepalive: null,
            waiting: 0
};

function CondVar () {
    this.__proto__.int_data   = undefined;
    this.__proto__.int_cb     = undefined;
    this.__proto__.int_end_cb = undefined;
    this.__proto__.int_croak  = undefined;
    this.__proto__.int_ready  = false;
    this.__proto__.int_begin  = 0;
    this.__proto__.int_id     = global.total_cv_count++;

    if (arguments.length
            && typeof arguments[0]['cb'] !== 'undefined')
        this.__proto__.int_cb = arguments[0]['cb'];

    var cb = function () {
        this.__proto__.send(null);
    }.bind(this);

    cb.__proto__ = this.__proto__;

    if (!global.open_cv_count++)
        global.timer_keepalive = setInterval(function(){}, 4e9);

    return cb;
}

CondVar.prototype.send = function (data) {
    this.int_data  = data;

    if (this.int_ready)
        return;

    this.int_ready = true;
    if (this.int_cb)
        this.int_cb(this);
};

CondVar.prototype.recv = function () {
    var recursive_wait = false;

    if (!this.int_ready) {
        global.waiting++;
        if (global.waiting > 1)
            recursive_wait = true;
        else
            do {
                var have_events = runOnce();
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

CondVar.prototype._stop = function () {
    clearInterval(global.timer_keepalive);
};

CondVar.prototype.ready = function () {
    return this.int_ready;
};

CondVar.prototype.cb = function (cb) {
    if (typeof cb === 'undefined') return this.int_cb;
    return this.int_cb = cb;
};

CondVar.prototype.croak = function (err) {
    this.int_croak = err;
    this.send();
};

CondVar.prototype.begin = function (cb) {
    if (typeof cb !== 'undefined') this.int_end_cb = cb;
    this.int_begin++;
}

CondVar.prototype.end = function (cb) {
    this.int_begin--;

    if (this.int_begin !== 0)
        return;

    this.int_ready = true;

    if (this.int_end_cb)
        this.int_end_cb(this);
    else
        this.send();
}

module.exports = CondVar;
}())
