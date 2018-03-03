'use strict';

const hls = require('../lib/hls');
const expect = require('chai').expect;
const dump = require('../lib/dump');

const perEdgeSetWidth = w => e =>
    (e.label = (typeof e.label !== 'object') ? {} : e.label).width = w;

describe('hls', () => {

    it('a+b-c', done => {
        const fn = hls(
            (a, b, c) => (a + b) - ((5 + 7) + c)
        );

        expect(fn(1, 2, 3)).to.eq(-12);

        const resEdge = fn('a', 'b', 'c');
        // resEdge(_g({name: '_res'}));
        const g = resEdge.state.root;
        resEdge();
        g.edges.forEach(perEdgeSetWidth(8));
        // expect(g).to.deep.equal(['_sub', ['_add', 'a', 'b'], ['_add', 12, 'c']]);
        // console.log(fhyperDot(g));
        dump(g, 'hls1', {}, done);
    });

    // it('hls-cmul', done => {
    //     const fn = hls(
    //         (a, b, c, d) => [(a * c - b * d), (a * d + b * c)]
    //     );
    //
    //     expect(fn(1, 2, 3, 4)).to.eq([1, 2]);
    //
    //     const resEdge = fn('a', 'b', 'c', 'd');
    //     // resEdge(_g({name: '_res'}));
    //     const g = resEdge.state.root;
    //     // expect(g).to.deep.equal(['_sub', ['_add', 'a', 'b'], ['_add', 12, 'c']]);
    //     // console.log(fhyperDot(g));
    //     dump(g, 'hls-cmul', done);
    // });
});
