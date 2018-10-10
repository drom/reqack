'use strict';

const dump = require('../lib/dump');
const reqack = require('../lib');

const circuit = reqack.circuit;
const nodeMacros = reqack.macros;

const perEdgeSetWidth = w => e =>
    (e.label = (typeof e.label !== 'object') ? {} : e.label).width = w;

describe('basic', () => {

    it('wire', done => {
        const g = circuit();
        g()({width: 1})();
        dump(g, 'wire', {}, done);
    });

    it('eb1', done => {
        const g = circuit();
        g()({width: 4, capacity: 1})();
        dump(g, 'eb1', {}, done);
    });

    it('eb15', done => {
        const g = circuit();
        g()({width: 4, capacity: 1.5})();
        dump(g, 'eb15', {}, done);
    });

    it('eb17', done => {
        const g = circuit();
        g()({width: 11, capacity: 1.7})();
        dump(g, 'eb17', {}, done);
    });

    it('ebfifo', done => {
        const g = circuit();
        g()({width: 32, capacity: 60})();
        dump(g, 'ebfifo', {}, done);
    });

    it('add2', done => {
        const g = circuit();
        const i0 = g(), i1 = g(), add2 = g('add');
        i0()(add2);
        i1()(add2);
        add2()();
        g.edges.forEach(perEdgeSetWidth(8));
        dump(g, 'add2', {}, done);
    });

    it('add3', done => {
        const g = circuit();
        g('add', g()(), g()(), g()())()(g());
        g.edges.forEach(perEdgeSetWidth(8));
        dump(g, 'add3', {}, done);
    });

    it('add5', done => {
        const g = circuit();
        g('add', [0, 1, 2, 3, 4].map(() => g()()))()(g());
        g.edges.forEach(perEdgeSetWidth(8));
        dump(g, 'add5', {}, done);
    });

    it('tree', done => {
        const g = circuit();
        const t0 = g();
        const t1 = g();
        const t2 = g();
        const t3 = g();
        const t4 = g();
        const t5 = g();
        g()()(t0)(t1);
        t0()(t2)(t3);
        t1()(t4)(t5);
        g.edges.forEach(perEdgeSetWidth(8));
        dump(g, 'tree', {}, done);
    });

    it('headtail', done => {
        const g = circuit();
        const f1 = g('f1');
        const f2 = g('f2');
        const u8 = {width: 8};
        g('aa')(u8)(f1)(f2, 42);
        g()(u8)(f1, 'a')(f2);
        f1(u8, 55)(g('xx'));
        f2(u8)();
        dump(g, 'mul2', {
            f1: {ctrl2data: () => []},
            f2: {ctrl2data: () => []}
        }, done);
    });

    it('custom', done => {

        const macros = {
            custom: {
                data: p =>
                    p.i.map(lhs =>
                        `assign ${lhs.wire} = ${ p.t.map(e => e.wire).join(' ^ ') };`)
            }
        };

        const g = circuit();
        const fn = g('custom');
        g()()(fn);
        g()({capacity: 1})(fn);
        g()()(fn);
        fn({capacity: 1})();
        g.edges.forEach(perEdgeSetWidth(12));
        dump(g, 'custom', macros, done);
    });

    it('custom2', done => {
        const macros = {
            '3 - x': {data: p => `assign ${p.i[0].wire} = 3 - ${ p.t[0].wire };`},
            'x << 2': {data: p => `assign ${p.i[0].wire} = ${ p.t[0].wire } << 2;`}
        };
        const g = circuit();
        const n0 = g('3 - x');
        const n1 = g('x << 2');
        g()()(n0);
        n0({capacity: 1})(n1);
        n1({capacity: 1})(g());
        g.edges.forEach(perEdgeSetWidth(12));
        dump(g, 'custom2', macros, done);
    });

    it('custom3', done => {
        const macros = {
            'floor': {
                data: params => {
                    const t = params.t[0];
                    const i = params.i[0];
                    const mask = t.width + '\'b' + '1'.repeat(t.m) + '0'.repeat(t.width - t.m);
                    return `assign ${i.wire} = ${t.wire} & ${mask};`;
                }
            }
        };
        const q3f12 = {width: 16, m: 3};
        const g = circuit();
        const n0 = g('floor');
        g()(q3f12)(n0);
        n0(q3f12)(g());
        dump(g, 'custom3', macros, done);
    });

    it('customMIMO', done => {

        const macros = {
            mimo: {data: p => p.i.map((lhs, i) =>
                `assign ${lhs.wire} = ${
                    p.t.map(e => e.wire)
                        .concat(i + 1)
                        .join(' ^ ')
                };`
            )}
        };

        const g = circuit();
        const fn = g('mimo'); // 3x2
        g()()(fn);
        g()()(fn);
        g()()(fn);
        fn({capacity: 1})();
        fn({capacity: 1})();
        g.edges.forEach(perEdgeSetWidth(16));
        dump(g, 'customMIMO', macros, done);
    });

    it('concat', done => {
        const i16 = {width: 16};
        const i12 = {width: 12};
        const g = circuit();
        const fn = g({}, g()(i16), g()(i16), g()(i16));
        fn(i12)(g());
        fn(i12)(g());
        fn(i12)(g());
        fn(i12)(g());
        dump(g, 'concat', {}, done);
    });

    it('custom parameters', done => {

        const macros = {
            custom: {
                parameters: {
                    PARAM1: () => 42,
                    PARAM2: index => 'filename' + index + '.mif'
                }
            }
        };

        const g = circuit();
        const fn = g('custom');
        g()()(fn);
        g()({capacity: 1})(fn);
        g()()(fn);
        fn({capacity: 1})();
        g.edges.forEach(perEdgeSetWidth(12));
        dump(g, 'custom_params', macros, done);
    });

    it('radix2', done => {
        const g = circuit('datapath');
        // construct functional nodes
        const add = g('add'), sub = g('sub');

        // construct interconnect
        g()()(add)(sub);
        g()()(add)(sub);
        add()();
        sub({capacity: 1})();
        g.edges.forEach(perEdgeSetWidth(16));

        dump(g, 'radix2', {}, done);
    });

    it('cmul', done => {
        // x = (a * c - b * d); y = (a * d + b * c);
        const rs18 = {capacity: 1, width: 18};
        const rs36 = {capacity: 1, width: 36};
        const g = circuit();

        const ac = g('mul'), bd = g('mul'), ad = g('mul'), bc = g('mul');

        g()(rs18)(ac)(ad);
        g()(rs18)(bd)(bc);
        g()(rs18)(ac)(bc);
        g()(rs18)(bd)(ad);

        g('sub',
            ac(rs36),
            bd(rs36)
        )(rs36)();

        g('add',
            ad(rs36),
            bc(rs36)
        )(rs36)();

        dump(g, 'cmul', {}, done);
    });

    it('cmul_concat', done => {
        // x = (a * c - b * d); y = (a * d + b * c);
        const s18  = {width: 18};
        // const rs18 = {capacity: 1, width: 18};
        const s36  = {width: 36};
        const rs36 = {width: 36, capacity: 1};
        const rs72 = {width: 72, capacity: 1};
        const r2s72 = {width: 72, capacity: 1.5};
        const g = circuit();

        const ac = g({}), bd = g({}), ad = g({}), bc = g({});

        g()(s18)(ac)(ad);
        g()(s18)(bd)(bc);
        g()(s18)(ac)(bc);
        g()(s18)(bd)(ad);

        g({},
            g('sub',
                g({},
                    g('mul', ac(rs36))(s36),
                    g('mul', bd(rs36))(s36)
                )(rs72)
            )(rs36),
            g('add',
                g({},
                    g('mul', ad(rs36))(s36),
                    g('mul', bc(rs36))(s36)
                )(rs72)
            )(rs36)
        )(r2s72)();

        dump(g, 'cmul_concat', {}, done);
    });

    it('retiming', done => {
        const gg = circuit();

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

        dump(gg, 'retiming', {}, done);
    });

    it('deconcat', done => {
        const g = circuit();

        const dut0 = g('deconcat');
        const filler = g();
        const dut2 = g('deconcat');

        const source = g()({width: 32, capacity: 1});
        source(dut0);
        source(filler);
        source(dut2);

        dut0({width: 16})(g());
        dut0({width: 8})(g());
        dut0({width: 4})(g());
        dut0({width: 4})(g());

        dut2({width: 16})(g());
        dut2({width: 16})(g());

        dump(g, 'deconcat', nodeMacros, done);
    });

});
