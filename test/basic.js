'use strict';

const fhyper = require('digraph/fhyper')
    , fs = require('fs')
    , fhyperDot = require('../lib/fhyper-dot')
    , fhyperV = require('../lib/fhyper-verilog')
    ;

describe('basic', () => {

    it('add2', done => {
        const g = fhyper();
        const i0 = g()
            , i1 = g()
            , o = g()
            , add2 = g('add');

        i0()(add2);
        i1()(add2);
        add2()(o);

        g.edges.forEach(e => e.label = {width: 8});

        fs.writeFile('add2.dot', fhyperDot(g), () => {
            fs.writeFile('add2.v', fhyperV(g), done);
        });
    });

    it('radix2', done => {
        const g = fhyper();

        // construct functional nodes
        const add = g('add'), sub = g('sub');

        // construct interconnect
        g()({})(add)(sub);
        g()({})(add)(sub);
        add({capacity: 1})(g());
        sub({capacity: 1})(g());

        // set edge width
        g.edges.forEach(e => e.label.width = 16);

        fs.writeFile('radix2.dot', fhyperDot(g), () => {
            fs.writeFile('radix2.v', fhyperV(g), done);
        });
    });
});
