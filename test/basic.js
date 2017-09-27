'use strict';

const fhyper = require('digraph/fhyper')
    , fs = require('fs')
    , fhyperDot = require('../lib/fhyper-dot');

describe('basic', () => {

    it('add2', done => {
        const g = fhyper();
        const i0 = g()
            , i1 = g()
            , o = g()
            , add2 = g();

        i0()(add2);
        i1()(add2);
        add2()(o);
        fs.writeFile('add2.dot', fhyperDot(g), done);
    });

    it('radix2', done => {
        const g = fhyper();
        const add = g(), sub = g();

        g()()(add)(sub);
        g()()(add)(sub);
        add()(g());
        sub()(g());
        fs.writeFile('radix2.dot', fhyperDot(g), done);
    });
});
