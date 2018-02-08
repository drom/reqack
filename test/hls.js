'use strict';

const fs = require('fs-extra');
const path = require('path');
const hls = require('../lib/hls');
const fhyperDot = require('../lib/fhyper-dot');
const expect = require('chai').expect;

describe('hls', () => {
    it('a+b-c', done => {
        const fn = hls(
            (a, b, c) => (a + b) - ((5 + 7) + c)
        );

        expect(fn(1, 2, 3)).to.eq(-12);

        const resEdge = fn('a', 'b', 'c');
        // resEdge(_g({name: '_res'}));
        const g = resEdge.state.root;
        // expect(g).to.deep.equal(['_sub', ['_add', 'a', 'b'], ['_add', 12, 'c']]);
        // console.log(fhyperDot(g));
        fs.outputFile(path.resolve('build', 'hls1.dot'), fhyperDot(g), done);
    });
});
