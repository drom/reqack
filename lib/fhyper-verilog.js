'use strict';

const operators = require('./operators');
const macroVerilog = require('./macro-verilog');

const indent = '    ';

const enPrefix  = id => 'en' + id;

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
    return ((' ').repeat(20) + body + ' ').slice(-12);
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

    g.edges.reduce(function (eres, e, ei) {
        if (e.label.capacity === 1) {
            eres[enPrefix(ei)] = 1;
        } else
        if (e.label.capacity === 1.5) {
            eres[enPrefix(ei) + '_0'] = 1;
            eres[enPrefix(ei) + '_1'] = 1;
            eres['sel' + ei] = 1;
        }
        return eres;
    }, io);

    g.nodes.reduce((nres, n, ni) => {
        const label = n.label;
        if (label && macros[label] && macros[label].ctrl2data) {
            const ctrl2data = macros[label].ctrl2data({id: ni});
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
                    return eres
                        .concat(assign(reqSuffix(nname), reqPrefix(idx)))
                        .concat(assign(
                            ackPrefix(idx + '_' + findIndexOfNode(g, efrom.targets, n)),
                            ackSuffix(nname)
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
        if (e.label.capacity === 1) {
            eres[[
                ename,
                ename + '_nxt'
            ].join(', ')] = e.label.width;
            eres[enPrefix(ei)] = 1;
        } else
        if (e.label.capacity === 1.5) {
            eres[[
                ename,
                ename + '_nxt',
                ename + '_r0',
                ename + '_r1'
            ].join(', ')] = e.label.width;
            eres[[
                enPrefix(ei) + '_0',
                enPrefix(ei) + '_1',
                'sel' + ei
            ].join(', ')] = 1;
        } else {
            eres[ename] = e.label.width;
        }
        return eres;
    }, {})));

// const dcomb = g => ['// per edge']
//     .concat(g.edges.reduce((eres, e, ei) => {
//         const n = e.source.node;
//         const op = n.label;
//         const dat = datPrefix(ei);
//         const ename = dat + (e.label.capacity ? '_nxt' : '    ');
//         if (e.label.capacity === 2) {
//             eres = eres.concat(assign(
//                 dat,
//                 `sel${ei} ? ${dat}_r1 : ${dat}_r0`
//             ));
//         }
//         const args = n.from.map(ee => {
//             let eeeres = 'x';
//             g.edges.some((eee, eeei) => {
//                 if (ee === eee) {
//                     eeeres = datPrefix(eeei);
//                     return true;
//                 }
//             });
//             return {name: eeeres, width: ee.label.width};
//         });
//
//         // if (op) {
//         //     if (operators[op]) {
//         //         const expr = (args.length === 0)
//         //             ? datSuffix('t_' + findGlobalIndexOfNode(g, n))
//         //             : operators[op](args);
//         //         eres = eres.concat(assign(ename, expr));
//         //     } else {
//         //         eres = eres.concat(
//         //             [op + '_' + n.from.length + '_' + n.to.length + ' #(']
//         //                 .concat(
//         //                     n.from.map((e, ei) => ({
//         //                         name: 'T_' + ei,
//         //                         width: e.label.width
//         //                     })).concat(n.to.map((e, ei) => ({
//         //                         name: 'I_' + ei,
//         //                         width: e.label.width
//         //                     }))).map(e =>
//         //                         indent + '.' + e.name + '_WIDTH(' + e.width + ')'
//         //                     ).join(',\n')
//         //                 )
//         //                 .concat(') u' + ei + ' (')
//         //                 .concat(
//         //                     n.from.map((e, ei) => ({
//         //                         port: 't_' + ei + '_data',
//         //                         sig: datPrefix(findGlobalIndexOfEdge(g, e))
//         //                     })).concat(n.to.map((e, ei) => ({
//         //                         port: 'i_' + ei + '_data',
//         //                         sig: datPrefix(findGlobalIndexOfEdge(g, e)) + (e.label.capacity ? '_nxt' : '')
//         //                     }))).map(e =>
//         //                         indent + '.' + e.port + '(' + e.sig + ')'
//         //                     ).join(',\n')
//         //                 )
//         //                 .concat(');')
//         //         );
//         //     }
//         // } else {
//         //     const expr = (args.length === 0)
//         //         ? datSuffix('t_' + findGlobalIndexOfNode(g, n))
//         //         : operators[op](args);
//         //     eres = eres.concat(assign(ename, expr));
//         // }
//         return eres;
//     }, []))
//     .concat(g.edges.reduce((eres, e, ei) => {
//         const ename = datPrefix(ei);
//         return eres.concat(e.targets.reduce((nres, n) => {
//             return nres.concat((n.node.to.length === 0)
//                 ? assign(
//                     'i_' + datSuffix(findGlobalIndexOfNode(g, n.node)),
//                     ename
//                 ) : []
//             );
//         }, []));
//     }, []));

















const dff = g => ['// per edge']
    .concat(
        g.edges.reduce(function (eres, e, ei) {
            const edgeNname = datPrefix(ei);
            if (e.label.capacity == 1) {
                return eres.concat([
                    'always_ff @(posedge clk) if (' + enPrefix(ei) + ') ' + edgeNname + ' <= ' + edgeNname + '_nxt;'
                ]);
            } else
            if (e.label.capacity == 1.5) {
                return eres.concat([
                    'always_ff @(posedge clk) if (' + enPrefix(ei) + '_0) ' + edgeNname + '_r0 <= ' + edgeNname + '_nxt;',
                    'always_ff @(posedge clk) if (' + enPrefix(ei) + '_1) ' + edgeNname + '_r1 <= ' + edgeNname + '_nxt;',
                    assign(edgeNname, 'sel' + ei + ' ? ' + edgeNname + '_r1 : ' + edgeNname + '_r0')
                ]);
            }
            return eres;
        }, [])
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
        return p => {
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
                ' unode' + p.id + ' (\n' +
                ports.map(pair => `    .${pair[0]}(${pair[1]})`).join(',\n') +
                '\n);'
            );
        };
    };

    const perMacroNode = (n, ni, label) => {
        const dataPathGen = standardDataPathInstance(label, macros);
        const insert = dataPathGen({
            t: n.from.map((e, ei) => {
                const tindex = findIndexOfNode(g, e.targets, n);
                const target = e.targets[tindex] || {};
                const pname = target.headlabel || ei;
                return {
                    port: 't_' + datSuffix(pname),
                    wire: datPrefix(findGlobalIndexOfEdge(g, e))
                };
            }),
            i: n.to.map((e, ei) => ({
                port: 'i_' + datSuffix(e.taillabel || ei),
                wire: datPrefix(findGlobalIndexOfEdge(g, e)  + (e.label.capacity ? '_nxt' : ''))
            })),
            id: ni
        });
        return `// node:${ni} macro ${label}
${insert}`;
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
        if (n.to.length === 1 && n.from.length === 1) {
            return perEqualityNode(n, ni);
        }
        return `// node:${ni} with strange label ${label}`;
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
            if (e.label.capacity === 1) {
                eres[enPrefix(ei)] = -1;
            } else
            if (e.label.capacity === 1.5) {
                eres[enPrefix(ei) + '_0'] = -1;
                eres[enPrefix(ei) + '_1'] = -1;
                eres['sel' + ei] = -1;
            }
            return eres;
        }, io);

        g.nodes.reduce((nres, n, ni) => {
            const label = n.label;
            if (label && macros[label] && macros[label].ctrl2data) {
                const ctrl2data = macros[label].ctrl2data({id: ni});
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
                const label = n.label;
                const ml = macros[label];
                if (ml && ml.ctrl) {
                    return res.concat(ml.ctrl({
                        id: ni,
                        t: n.from.map(e => findGlobalIndexOfEdge(g, e)),
                        i: n.to.map(e => findGlobalIndexOfEdge(g, e))
                    }));
                }
                if (ml && (ml.ctrl2data || (n.to.length > 1))) { // need custom controller
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

                    const extra = (macros[label].ctrl2data || (() => []))({
                        id: ni
                    });

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

    function topModule () {
        const glabel = gLabel(g);
        return ['module ' + glabel + ' (']
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
