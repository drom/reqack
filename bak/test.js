'use strict';

var onml = require('onml'),
    // lib = require('../lib'),
    digraph = require('digraph'),
    expect = require('chai').expect;

describe('test', function () {
    it('t1', function (done) {

        var g = digraph();
        var a = g.add.node();
        var b = g.add.node();
        var c = g.add.node(); c.label = 'c';
        var d = g.add.node();
        g.add.edge(a, b);
        g.add.edge(b, c);
        g.add.edge(c, a);
        g.add.edge(b, d);

        // var res = lib.export.svg(g);
        // console.log(onml.s(res));
        done();
    });
});
