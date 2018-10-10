'use strict';

const operators = require('./operators.js');
const macroVerilog = require('./macro-verilog.js');
const vectorDim = require('./vector-dim.js');
const mimo = require('./mimo.js');
const getNodeType = require('./get-node-type.js');

const indent = '    ';

// const enPrefix  = id => 'en' + id;

const datPrefix = id => 'dat' + id;
const reqPrefix = id => 'req' + id;
const ackPrefix = id => 'ack' + id;

const datSuffix = id => id + '_dat';
const reqSuffix = id => id + '_req';
const ackSuffix = id => id + '_ack';

const assign = (lhs, rhs) => ['assign ' + lhs + ' = ' + rhs + ';'];

const instantiation = (p) => {
    const head = p.modName + ' ' + p.instName + ' (\n';
    const body = p.bindings.map(bind =>
        indent + '.' + bind[0] + '(' + bind[1] + ')'
    ).join(',\n');
    const foot = ');\n';
    return head + body + foot;
};

// function edgeIndex (g, edge) {
//     let index;
//     g.edges.some((e, i) => {
//         if (edge === e) {
//             index = i;
//             return true;
//         }
//     });
//     return index;
// }

function gLabel (g) {
    return g.label || 'g';
}

function vport (desc) {
    return Object.keys(desc).map((key, i, arr) => {
        const val = desc[key];
        const type = (val < 0) ? 'output ' : 'input  ';
        const comma = (i === (arr.length - 1)) ? '' : ',';
        return indent + type + vectorDim(val) + key + comma;
    });
}

function vlogic (desc) {
    return Object.keys(desc).map(key => {
        const val = desc[key];
        const type = 'wire ';
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
        const val = (typeof desc[key] === 'number') ? key : desc[key];
        return '    .' + key + '(' + val + ')' + comma;
    });
}

const ioReducer = (g, ocb) =>
    g.nodes.reduce((res, n, ni) => {
        const nname = n.label || ni;
        if (n.from.length === 0) { // target node
            const ewidth = edgeWidth(n.to[0]);
            return ocb.target(res, nname, ewidth);
        }
        if (n.to.length === 0) { // initiator node
            const ewidth = edgeWidth(n.from[0]);
            return ocb.initiator(res, nname, ewidth);
        }
        return res;
    }, {clk: 1, 'reset_n': 1});

const ctrlInstance = (g, macros) => {
    const glabel = gLabel(g);

    const io = ioReducer(g, {
        target: (res, nname) => {
            res[reqSuffix('t_' + nname)] = 1;
            res[ackSuffix('t_' + nname)] = 1;
            return res;
        },
        initiator: (res, nname) => {
            res[reqSuffix('i_' + nname)] = 1;
            res[ackSuffix('i_' + nname)] = 1;
            return res;
        }
    });

    g.edges.reduce((eres, e, ei) =>
        Object.assign(
            eres,
            macroVerilog.eb.ctrl2data({
                capacity: e.label.capacity,
                id: ei
            })
        ), io);

    g.nodes.reduce((nres, n, ni) => {
        const label = n.label;
        if (label && macros[label] && macros[label].ctrl2data) {
            const ctrl2data = macros[label].ctrl2data(getNodeSockets(g, n, ni));
            ctrl2data.map(sig => {
                nres[sig[1]] = sig[1];
            });
        }
        return nres;
    }, io);

    return [glabel + '_ctrl uctrl (']
        .concat(pbind(io))
        .concat([');']);
};


function dport (g) {
    return vport(ioReducer(g, {
        target: (res, nname, ewidth) => {
            res[datSuffix('t_' + nname)] = ewidth;
            res[reqSuffix('t_' + nname)] = 1;
            res[ackSuffix('t_' + nname)] = -1;
            return res;
        },
        initiator: (res, nname, ewidth) => {
            res[datSuffix('i_' + nname)] = -ewidth;
            res[reqSuffix('i_' + nname)] = -1;
            res[ackSuffix('i_' + nname)] = 1;
            return res;
        }
    }));
}


const cForks = g =>
    g.edges.reduce((res, e, ei) => (
        res
            .concat(macroVerilog.eb.ctrl({
                id: ei,
                capacity: e.label.capacity,
                t: {
                    valid: 'req' + ei,
                    ready: 'ack' + ei
                },
                i: {
                    valid: 'req' + ei + 'm',
                    ready: 'ack' + ei + 'm'
                }
            }))
            .concat(macroVerilog.fork.ctrl({id: ei, targets: e.targets}))
    ), []);

const cTargets = g =>
    g.nodes.reduce((res, n, ni) => {
        const nname = 't_' + (n.label || ni);
        return res.concat((n.from.length === 0) ? (
            ['// node:' + nname + ' target']
                .concat(n.to.reduce((eres, e) => {
                    const idx = findGlobalIndexOfEdge(g, e);
                    return eres
                        .concat(assign(reqPrefix(idx), reqSuffix(nname)))
                        .concat(assign(ackSuffix(nname), ackPrefix(idx)));
                }, []))
        ) : []);
    }, []);

const cInitiators = g =>
    g.nodes.reduce((res, n, ni) => {
        const nname = 'i_' + (n.label || ni);
        return res.concat((n.to.length === 0) ? (
            ['// node:' + ni + ' initiator']
                .concat(n.from.reduce((eres, efrom) => {
                    const idx = findGlobalIndexOfEdge(g, efrom);
                    const nindex = findIndexOfNode(g, efrom.targets, n);
                    return eres
                        .concat(assign(
                            reqSuffix(nname), reqPrefix(idx + '_' + nindex)
                        ))
                        .concat(assign(
                            ackPrefix(idx + '_' + nindex), ackSuffix(nname)
                        ));
                }, []))
        ) : []);
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

const perTargetLink = (g, n) => (e, ei) => {
    const tindex = findIndexOfNode(g, e.targets, n);
    const target = e.targets[tindex] || {};
    const pname = target.headlabel || ei;
    return Object.assign({
        port: 't_' + datSuffix(pname),
        wire: datPrefix(findGlobalIndexOfEdge(g, e))
        // width: e.label.width
    }, e.label);
};

const perInitiatorLink = g => (e, ei) => (Object.assign({
    port: 'i_' + datSuffix(e.taillabel || ei),
    wire: datPrefix(findGlobalIndexOfEdge(g, e)  + (e.label.capacity ? '_nxt' : ''))
    // width: e.label.width
}, e.label));

const getNodeSockets = (g, n, ni) => ({
    t: n.from.map(perTargetLink(g, n)),
    i: n.to.map(perInitiatorLink(g)),
    id: ni
});

// function findGlobalIndexOfNode (g, node) {
//     let index;
//     g.nodes.some((n, ni) => {
//         if (node === n) {
//             index = ni;
//             return true;
//         }
//     });
//     return index;
// }

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
            let tres = [
                reqPrefix(ei),
                ackPrefix(ei)
            ];
            e.targets.forEach((t, ti) => {
                tres = tres.concat([
                    ackPrefix(ei + '_' + ti),
                    reqPrefix(ei + '_' + ti)
                ]);
            });

            eres[tres.join(', ')] = 1;
            return eres;
        }, {})
    ));

const dlogic = g => ['// per edge']
    .concat(vlogic(g.edges.reduce(function (eres, e, ei) {
        let ename = datPrefix(ei);
        if (e.label.capacity >= 1) {
            eres[[
                ename,
                ename + '_nxt'
            ].join(', ')] = e.label.width;
        } else {
            eres[ename] = e.label.width;
        }
        return eres;
    }, {})));

const dff = g => ['// per edge']
    .concat(
        g.edges.reduce((eres, e, ei) => (
            eres.concat([macroVerilog.eb.data({
                id: ei,
                capacity: e.label.capacity,
                width: e.label.width,
                t: {data: 'dat' + ei + '_nxt'},
                i: {data: 'dat' + ei}
            })])
        ), [])
    );

module.exports = function (g, macros) {

    // data

    const perTargetPort = (n, ni) => {
        const e = n.to[0];
        const ename = datPrefix(findGlobalIndexOfEdge(g, e) + (e.label.capacity ? '_nxt' : ''));
        const nname = datSuffix(n.label || ni);
        return `// node:${ni} is target port
assign ${ename} = t_${nname};
`;
    };

    const perInitiatorPort = (n, ni) => {
        const e = n.from[0];
        const ename = datPrefix(findGlobalIndexOfEdge(g, e));
        const nname = datSuffix(n.label || ni);
        return `// node:${ni} is initiator port
assign i_${nname} = ${ename};
`;
    };

    const perEqualityNode = (n, ni) => {
        const statements = n.to.map(e => {
            const lhs = datPrefix(findGlobalIndexOfEdge(g, e) + (e.label.capacity ? '_nxt' : ''));
            const rhs = n.from.map(te => datPrefix(findGlobalIndexOfEdge(g, te)));
            return `assign ${lhs} = ${rhs};`;
        });

        return `// node:${ni} equality
${statements.join('\n')}
`;
    };

    const perOperatorNode = (n, ni, label) => {
        const statements = n.to.map(e => {
            const ename = datPrefix(findGlobalIndexOfEdge(g, e) + (e.label.capacity ? '_nxt' : ''));
            const expr = operators[label](n.from.map(te => ({
                name: datPrefix(findGlobalIndexOfEdge(g, te)),
                width: te.label.width
            })));
            return `assign ${ename} = ${expr};`;
        });

        return `// node:${ni} operator ${label}
${statements.join('\n')}
`;
    };

    const standardDataPathInstance = (label, macros) => {
        const descriptor = macros[label] || {};
        if (descriptor.data) { return descriptor.data; }
        const ctrl2data = descriptor.ctrl2data || (() => []);
        const parameters = descriptor.parameters;
        return p => {
            const paramInterface = parameters ? (
                ' #(\n' + Object.keys(parameters).map(param =>
                    indent + '.' + param + '(NODE' + p.id + '_' + param + ')')
                    .join(',\n') + '\n)'
            ) : '';
            const ctrl2dataWires = ctrl2data(p);
            const extra = Object.keys(ctrl2dataWires).map(sig =>
                [ctrl2dataWires[sig][0], ctrl2dataWires[sig][1]]);
            const localLogic = ctrl2dataWires.reduce((res, sig) => {
                res[sig[1]] = sig[2];
                return res;
            }, {});
            const targets = p.t.map(b => [b.port, b.wire]);
            const initiators = p.i.map(b => [b.port, b.wire]);
            const ports = targets
                .concat(initiators)
                .concat(extra)
                .concat([['clk', 'clk'], ['reset_n', 'reset_n']]);
            return (
                vlogic(localLogic).join('\n') + '\n' +
                datSuffix(label) + '_' + targets.length + '_' + initiators.length +
                paramInterface + ' unode' + p.id + ' (\n' +
                ports.map(pair => `    .${pair[0]}(${pair[1]})`).join(',\n') +
                '\n);'
            );
        };
    };

    const perMacroNode = (n, ni, label) => {
        const dataPathGen = standardDataPathInstance(label, macros);
        const insert = dataPathGen(getNodeSockets(g, n, ni));
        const inserta = (Array.isArray(insert)) ? insert.join('\n') : insert.toString();
        return `// node:${ni} macro ${label}
${inserta}`;
    };


    const perNode = (n, ni) => {
        const label = n.label;
        if (n.from.length === 0) {
            return perTargetPort(n, ni);
        }
        if (n.to.length === 0) {
            return perInitiatorPort(n, ni);
        }
        if (label && operators[label]) {
            return perOperatorNode(n, ni, label);
        }
        if (label && macros[label]) {
            return perMacroNode(n, ni, label);
        }
        // if (n.to.length === 1 && n.from.length === 1) {
        return perEqualityNode(n, ni);
        // }
        // return `// node:${ni} with strange label ${label}`;
    };

    const dcombNodes = () => ['// per node']
        .concat(
            g.nodes.reduce((nres, n, ni) => {
                return nres.concat(perNode(n, ni));
            }, [])
        );

    // ctrl

    const cport = () => {
        const io = ioReducer(g, {
            target: (res, nname) => {
                res[reqSuffix('t_' + nname)] = 1;
                res[ackSuffix('t_' + nname)] = -1;
                return res;
            },
            initiator: (res, nname) => {
                res[reqSuffix('i_' + nname)] = -1;
                res[ackSuffix('i_' + nname)] = 1;
                return res;
            }
        });

        g.edges.reduce((eres, e, ei) => {
            const ctrl2data = macroVerilog.eb.ctrl2data({
                capacity: e.label.capacity,
                id: ei
            });
            Object.keys(ctrl2data).map(key => {
                eres[key] = -ctrl2data[key];
            });
            return eres;
        }, io);

        g.nodes.reduce((nres, n, ni) => {
            const label = n.label;
            if (label && macros[label] && macros[label].ctrl2data) {
                const ctrl2data = macros[label].ctrl2data(getNodeSockets(g, n, ni));
                ctrl2data.map(sig => {
                    nres[sig[1]] = -sig[2];
                });
            }
            return nres;
        }, io);

        return vport(io);
    };


    const cJoins = () =>
        g.nodes.reduce((res, n, ni) => {
            if (n.from.length > 0 && n.to.length > 0) { // not IO node
                const label = getNodeType(n);
                const ml = macros[label] || {};
                if (ml.ctrl) {
                    return res.concat(ml.ctrl({
                        id: ni,
                        t: n.from.map(e =>
                            findGlobalIndexOfEdge(g, e) + '_' + findIndexOfNode(g, e.targets, n)
                        ),
                        i: n.to.map(e =>
                            findGlobalIndexOfEdge(g, e)
                        )
                    }));
                }
                if (ml.ctrl2data) { // need custom controller
                    res = res.concat(['// node:' + ni + ' custom controller ' + label]);

                    const bindTargets = n.from.reduce((eres, e, ei) => {
                        const tindex = findIndexOfNode(g, e.targets, n);
                        const target = e.targets[tindex] || {};
                        const pname = target.headlabel || ei;
                        const ename = findGlobalIndexOfEdge(g, e) + '_' + 0;
                        return eres.concat([
                            [reqSuffix('t_' + pname), reqPrefix(ename)],
                            [ackSuffix('t_' + pname), ackPrefix(ename)]
                        ]);
                    }, []);

                    const bindInitiators = n.to.reduce((eres, e, ei) => eres.concat([
                        [reqSuffix('i_' + (e.taillabel || ei)), reqPrefix(findGlobalIndexOfEdge(g, e))],
                        [ackSuffix('i_' + (e.taillabel || ei)), ackPrefix(findGlobalIndexOfEdge(g, e))]
                    ]), []);

                    // t: n.from.map(e => ({
                    //     name: datPrefix(findGlobalIndexOfEdge(g, e))
                    // })),
                    // i: n.to.map(e => ({
                    //     name: datPrefix(findGlobalIndexOfEdge(g, e)  + (e.label.capacity ? '_nxt' : ''))
                    // })),

                    const extra = (ml.ctrl2data || (() => []))(getNodeSockets(g, n, ni));

                    return res.concat(instantiation({
                        modName: label + '_ctrl_' + n.from.length + '_' + n.to.length,
                        instName: 'unode' + ni,
                        bindings: bindTargets
                            .concat(bindInitiators)
                            .concat(extra)
                            .concat([
                                ['clk', 'clk'],
                                ['reset_n', 'reset_n']
                            ])
                    }));
                    // return res.concat(macros[label].ctrl({
                    //     id: ni
                    // }));
                }

                res = res.concat(['// node:' + ni + ' join ' + label]);

                res = res.concat(mimo({
                    t: n.from.map(efrom => {
                        const i = findGlobalIndexOfEdge(g, efrom);
                        const j = findIndexOfNode(g, efrom.targets, n);
                        return {
                            req: reqPrefix(i + '_' + j),
                            ack: ackPrefix(i + '_' + j)
                        };
                    }),
                    i: n.to.map(eto => {
                        const i = findGlobalIndexOfEdge(g, eto);
                        return {
                            req: reqPrefix(i),
                            ack: ackPrefix(i)
                        };
                    })
                }));

                // // req path
                // n.to.forEach(eto => {
                //     res = res.concat(assign(
                //         reqPrefix(findGlobalIndexOfEdge(g, eto)),
                //         n.from.map(efrom =>
                //             reqPrefix(
                //                 findGlobalIndexOfEdge(g, efrom) + '_' + findIndexOfNode(g, efrom.targets, n)
                //             )
                //         ).join(' & ')
                //     ));
                // });
                //
                // n.to.forEach(to => {
                //     const iEdgeTo = edgeIndex(g, to);
                //     n.from.forEach((from, ifrom) => {
                //         const idFrom = edgeIndex(g, from) + '_' + findIndexOfNode(g, from.targets, n);
                //         const rest = n.from.reduce((res2, from2, ifrom2) => {
                //             if (ifrom !== ifrom2) {
                //                 res2 = res2.concat([
                //                     reqPrefix(edgeIndex(g, from2) + '_' + findIndexOfNode(g, from2.targets, n))
                //                 ]);
                //             }
                //             return res2;
                //         }, [ackPrefix(iEdgeTo)]).join(' & ');
                //         res = res.concat(assign(
                //             ackPrefix(idFrom),
                //             rest
                //         ));
                //     });
                // });
            }
            return res;
        }, []);

    function topModule () {
        const glabel = gLabel(g);
        const parameters = g.nodes.reduce((res, n, ni) => {
            if (macros[n.label] && macros[n.label].parameters) {
                const params = macros[n.label].parameters;
                Object.keys(params).map(param => {
                    res = res.concat([
                        indent + 'parameter NODE' + ni + '_' + param + ' = ' + JSON.stringify(params[param](ni))
                    ]);
                });
            }
            return res;
        }, []).join(',\n');
        const paramInterface = parameters.length ? ' #(\n' + parameters + '\n)' : '';
        return ['module ' + glabel + paramInterface + ' (']
            .concat([indent + '// per node (target / initiator)'])
            .concat(dport(g))
            .concat(');')
            .concat(dlogic(g))
            // .concat(dcomb(g))
            .concat(dcombNodes())
            .concat(dff(g))
            .concat(ctrlInstance(g, macros))
            .concat('endmodule // ' + glabel + '\n');
    }

    function ctrlModule () {
        const glabel = gLabel(g);
        return ['module ' + glabel + '_ctrl (']
            .concat([indent + '// per node (target / initiator)'])
            .concat(cport())
            .concat(');')
            .concat(clogic(g))
            .concat(cTargets(g))
            .concat(cForks(g))
            .concat(cJoins())
            .concat(cInitiators(g))
            // .concat(cBuffers(g));
            .concat('endmodule // ' + glabel + '_ctrl\n');
    }

    return topModule()
        .concat(ctrlModule())
        .join('\n');
};
