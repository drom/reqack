'use strict';

const operators = require('./operators');
const templates = require('../templates');

const indent = '    ';

const enPrefix  = id => 'en' + id;

const datPrefix = id => 'dat' + id;
const reqPrefix = id => 'req' + id;
const ackPrefix = id => 'ack' + id;

const datSuffix = id => id + '_dat';
const reqSuffix = id => id + '_req';
const ackSuffix = id => id + '_ack';

const assign = (lhs, rhs) => ['assign ' + lhs + ' = ' + rhs + ';'];

function edgeIndex (g, edge) {
    let index;
    g.edges.some((e, i) => {
        if (edge === e) {
            index = i;
            return true;
        }
    });
    return index;
}

function gLabel (g) {
    return g.label || 'g';
}

function vectorDim (size) {
    const body = (Math.abs(size) > 1) ? '[' + (Math.abs(size) - 1) + ':0]' : '';
    return ((' ').repeat(20) + body + ' ').slice(-8);
}

function vport (desc) {
    return Object.keys(desc).map((key, i, arr) => {
        const val = desc[key];
        const type = (val < 0) ? 'output logic ' : 'input        ';
        const comma = (i === (arr.length - 1)) ? '' : ',';
        return indent + type + vectorDim(val) + key + comma;
    });
}

function vlogic (desc) {
    return Object.keys(desc).map(key => {
        const val = desc[key];
        const type = 'logic ';
        return type + vectorDim(val) + key + ';';
    });
}

function edgeWidth (e) {
    if (e.label) {
        switch (typeof e.label) {
        case 'number':
            return e.label;
        case 'object':
            if (typeof e.label.width === 'number') {
                return e.label.width;
            }
        }
    }
}

function pbind (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        const comma = (i === (arr.length - 1)) ? '' : ',';
        const val = (desc[key] === 1) ? key : desc[key];
        return '    .' + key + '(' + val + ')' + comma;
    });
}

const ioReducer = (g, ocb) =>
    g.nodes.reduce((res, n, nname) => {
        if (n.from.length === 0) { // target node
            const ewidth = edgeWidth(n.to[0]);
            return ocb.target(res, nname, ewidth);
        }
        if (n.to.length === 0) { // initiator node
            const ewidth = edgeWidth(n.from[0]);
            return ocb.initiator(res, nname, ewidth);
        }
        return res;
    }, {clk: 1, reset_n: 1});

function dport (g) {
    return vport(ioReducer(g, {
        target: (res, nname, ewidth) => {
            res[datSuffix('t' + nname)] = ewidth;
            res[reqSuffix('t' + nname)] = 1;
            res[ackSuffix('t' + nname)] = -1;
            return res;
        },
        initiator: (res, nname, ewidth) => {
            res[datSuffix('i' + nname)] = -ewidth;
            res[reqSuffix('i' + nname)] = -1;
            res[ackSuffix('i' + nname)] = 1;
            return res;
        }
    }));
}

function cport (g) {
    const io = ioReducer(g, {
        target: (res, nname) => {
            res[reqSuffix('t' + nname)] = 1;
            res[ackSuffix('t' + nname)] = -1;
            return res;
        },
        initiator: (res, nname) => {
            res[reqSuffix('i' + nname)] = -1;
            res[ackSuffix('i' + nname)] = 1;
            return res;
        }
    });
    const ioEn = g.edges.reduce(function (eres, e, ei) {
        if (e.label.capacity) {
            eres[enPrefix(ei)] = -1;
        }
        return eres;
    }, io);
    return vport(ioEn);
}

const cForks = g =>
    g.edges.reduce((res, e, ei) => (
        res
            .concat(templates['eb_ctrl.macro.v']({
                id: ei,
                capacity: e.label.capacity,
                t_0_valid: 'req' + ei,
                i_0_valid: 'req' + ei + 'm',
                t_0_ready: 'ack' + ei,
                i_0_ready: 'ack' + ei + 'm'
            }))
            .concat(templates['fork.ctrl.macro.v']({id: ei, targets: e.targets}))
    ), []);

const cTargets = g =>
    g.nodes.reduce((res, n, ni) => (
        res.concat((n.from.length === 0) ? (
            ['// target node: ' + ni]
                .concat(n.to.reduce((eres, e) => {
                    const idx = findGlobalIndexOfEdge(g, e);
                    return eres
                        .concat(assign(reqPrefix(idx), reqSuffix('t' + ni)))
                        .concat(assign(ackSuffix('t' + ni), ackPrefix(idx)));
                }, []))
        ) : [])
    ), []);

const cInitiators = g =>
    g.nodes.reduce((res, n, ni) => (
        res.concat((n.to.length === 0) ? (
            ['// initiator node: ' + ni]
                .concat(n.from.reduce((eres, efrom) => {
                    const idx = findGlobalIndexOfEdge(g, efrom);
                    return eres
                        .concat(assign(reqSuffix('i' + ni), reqPrefix(idx)))
                        .concat(assign(
                            ackPrefix(idx + '_' + findIndexOfNode(g, efrom.targets, n)),
                            ackSuffix('i' + ni)
                        ));
                }, []))
        ) : [])
    ), []);

const cJoins = g =>
    g.nodes.reduce((res, n, ni) => {
        if (n.from.length > 0 && n.to.length > 0) { // not IO node
            res = res.concat(['// join node:' + ni]);
            // req path
            n.to.forEach(eto => {
                res = res.concat(assign(
                    reqPrefix(findGlobalIndexOfEdge(g, eto)),
                    n.from.map(efrom =>
                        reqPrefix(
                            findGlobalIndexOfEdge(g, efrom) + '_' + findIndexOfNode(g, efrom.targets, n)
                        )
                    ).join(' & ')
                ));
            });

            n.to.forEach(to => {
                const iEdgeTo = edgeIndex(g, to);
                n.from.forEach((from, ifrom) => {
                    const idFrom = edgeIndex(g, from) + '_' + findIndexOfNode(g, from.targets, n);
                    const rest = n.from.reduce((res2, from2, ifrom2) => {
                        if (ifrom === ifrom2) {
                            res2 = res2.concat([
                                reqPrefix(edgeIndex(g, from2) + '_' + findIndexOfNode(g, from2.targets, n))
                            ]);
                        }
                        return res2;
                    }, []).join(' & ');
                    res = res.concat(assign(
                        ackPrefix(idFrom),
                        ackPrefix(iEdgeTo) + ' & (' + rest + ')'
                    ));
                });
            });
        }
        return res;
    }, []);


function findIndexOfNode (g, nodes, node) {
    let index;
    nodes.some((n, ni) => {
        if (node === n.node) {
            index = ni;
            return true;
        }
    });
    return index;
}

function findGlobalIndexOfNode (g, node) {
    let index;
    g.nodes.some((n, ni) => {
        if (node === n) {
            index = ni;
            return true;
        }
    });
    return index;
}

function findGlobalIndexOfEdge (g, edge) {
    let index;
    g.edges.some((e, ei) => {
        if (edge === e) {
            index = ei;
            return true;
        }
    });
    return index;
}

const clogic = g =>
    ['// per edge'].concat(vlogic(
        g.edges.reduce(function (eres, e, ei) {
            eres[reqPrefix(ei)] = 1;
            eres[ackPrefix(ei)] = 1;
            eres = e.targets.reduce((res, t, ti) => {
                res[ackPrefix(ei + '_' + ti)] = 1;
                res[ackPrefix(ei + '_' + ti + '_r')] = 1;
                res[reqPrefix(ei + '_' + ti)] = 1;
                return res;
            }, eres);
            return eres;
        }, {})
    ));

const dlogic = g =>
    ['// per edge'].concat(vlogic(
        g.edges.reduce(function (eres, e, ei) {
            if (e.label.capacity) {
                eres[enPrefix(ei)] = 1;
            }
            return eres;
        },
        g.edges.reduce(function (eres, e, ei) {
            let ename = datPrefix(ei);
            ename += (e.label.capacity ? (', ' + ename + '_nxt') : '');
            eres[ename] = e.label.width;
            return eres;
        },
        {}))
    ));

const dcomb = g => ['// per edge']
    .concat(g.edges.reduce((eres, e, ei) => {
        const n = e.source.node;
        const op = n.label;
        const ename = datPrefix(ei) + (e.label.capacity ? '_nxt' : '    ');
        const args = n.from.map(ee => {
            let eeeres = 'x';
            g.edges.some((eee, eeei) => {
                if (ee === eee) {
                    eeeres = datPrefix(eeei);
                    return true;
                }
            });
            return eeeres;
        });
        const expr = (args.length === 0)
            ? datSuffix('t' + findGlobalIndexOfNode(g, n))
            : (operators[op] || operators.xor)(args);
        return eres.concat(assign(ename, expr));
    }, []))
    .concat(g.edges.reduce((eres, e, ei) => {
        const ename = datPrefix(ei);
        return eres.concat(e.targets.reduce((nres, n) => {
            return nres.concat((n.node.to.length === 0)
                ? assign(
                    'i' + datSuffix(findGlobalIndexOfNode(g, n.node)),
                    ename
                ) : []
            );
        }, []));
    }, []));

const dff = g => ['// per edge']
    .concat(['always_ff @(posedge clk) begin'])
    .concat(
        g.edges.reduce(function (eres, e, ei) {
            const edgeNname = datPrefix(ei);
            if (e.label.capacity) {
                return eres.concat(indent + 'if (' + enPrefix(ei) + ') ' + edgeNname + ' <= ' + edgeNname + '_nxt;');
            }
            return eres;
        }, [])
    )
    .concat('end\n');

function ctrlInstance (g) {
    const glabel = gLabel(g);

    const io = ioReducer(g, {
        target: (res, nname) => {
            res[reqSuffix('t' + nname)] = 1;
            res[ackSuffix('t' + nname)] = 1;
            return res;
        },
        initiator: (res, nname) => {
            res[reqSuffix('i' + nname)] = 1;
            res[ackSuffix('i' + nname)] = 1;
            return res;
        }
    });

    const ioEn = g.edges.reduce(function (eres, e, ei) {
        if (e.label.capacity) {
            eres[enPrefix(ei)] = 1;
        }
        return eres;
    }, io);

    return [glabel + '_ctrl uctrl (']
        .concat(pbind(ioEn))
        .concat([');']);
}

function topModule (g) {
    const glabel = gLabel(g);
    return ['module ' + glabel + ' (']
        .concat([indent + '// per node (target / initiator)'])
        .concat(dport(g))
        .concat(');')
        .concat(dlogic(g))
        .concat(dcomb(g))
        .concat(dff(g))
        .concat(ctrlInstance(g))
        .concat('endmodule // ' + glabel + '\n');
}

function ctrlModule (g) {
    const glabel = gLabel(g);
    return ['module ' + glabel + '_ctrl (']
        .concat([indent + '// per node (target / initiator)'])
        .concat(cport(g))
        .concat(');')
        .concat(clogic(g))
        .concat(cTargets(g))
        .concat(cForks(g))
        .concat(cJoins(g))
        .concat(cInitiators(g))
        // .concat(cBuffers(g));
        .concat('endmodule // ' + glabel + '_ctrl\n');
}

module.exports = function (g) {
    return topModule(g)
        .concat(ctrlModule(g))
        .join('\n');
};
