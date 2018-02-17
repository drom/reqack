'use strict';

const fhyper = require('../lib/fhyper');
const dump = require('../lib/dump');

const perEdgeSetWidth = w => e =>
    (e.label = (typeof e.label !== 'object') ? {} : e.label).width = w;

describe('basic', () => {

    it('add2', done => {
        const g = fhyper();
        const i0 = g(), i1 = g(), o = g(), add2 = g('add');
        i0()(add2);
        i1()(add2);
        add2()(o);
        g.edges.forEach(perEdgeSetWidth(8));
        dump(g, 'add2', done);
    });

    it('radix2', done => {
        const g = fhyper('datapath');
        // construct functional nodes
        const add = g('add'), sub = g('sub');

        // construct interconnect
        g()()(add)(sub);
        g()()(add)(sub);
        add()(g());
        sub({capacity: 1})(g());
        g.edges.forEach(perEdgeSetWidth(16));

        dump(g, 'radix2', done);
    });

    it('cmul', done => {
        // x = (a * c - b * d); y = (a * d + b * c);
        const rs18 = {capacity: 1, width: 18};
        const rs36 = {capacity: 1, width: 36};
        const g = fhyper();

        const ac = g('*'), bd = g('*'), ad = g('*'), bc = g('*');
        g()(rs18)(ac)(ad);
        g()(rs18)(bd)(bc);
        g()(rs18)(ac)(bc);
        g()(rs18)(bd)(ad);

        const x = g('-'), y = g('+');
        ac(rs36)(x);
        bd(rs36)(x);
        ad(rs36)(y);
        bc(rs36)(y);

        x(rs36)(g());
        y(rs36)(g());

        dump(g, 'cmul', done);
    });

    it('retiming', done => {
        const gg = fhyper();

        // construct circuit
        const a = gg('a');
        const b = gg('b');
        const c = gg('c');
        const d = gg('d');
        const e = gg('e');
        const f = gg('f');
        const g = gg('g');
        const h = gg('h');

        a({capacity: 1})(b);
        b({capacity: 1})(c);
        c({capacity: 1})(d);
        d({capacity: 1})(e);

        b()(h);
        c()(g);
        d()(f);
        e()(f);
        f()(g);
        g()(h);
        h()(a);

        gg.edges.forEach(perEdgeSetWidth(16));

        dump(gg, 'retiming', done);
    });
});
