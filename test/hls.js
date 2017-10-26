'use strict';

const hls = require('../lib/hls');
const expect = require('chai').expect;

describe('hls', () => {
    it('a+b-c', done => {
        const fn = hls(
            (a, b, c) => (a + b) - ((5 + 7) + c)
        );
        const g = fn('a', 'b', 'c');
        expect(g).to.deep.equal(['_sub', ['_add', 'a', 'b'], ['_add', 12, 'c']]);
        done();
    });
});
