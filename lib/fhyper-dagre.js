'use strict';

const dagre = require('dagre');
const stringify = require('onml/lib/stringify.js');

const getNodeType = require('./get-node-type.js');

const margin = 4;
const sNode = {w: 8, h: 20}; // width per character
const sSock = {w: 32, h: 16};
const sBuffer = {w: 32, h: 8};

const isTarget = n => n.from.length === 0;
const isInitiator = n => n.to.length === 0;

const t = (x, y) => ({transform: 'translate(' + (x || 0) + ',' + (y || 0) + ')'});

const findGlobalIndexOfEdge = (g, edge) => {
    let index;
    g.edges.some((e, ei) => {
        if (edge === e) {
            index = ei;
            return true;
        }
    });
    return index;
};

const ci2g = (ci, opt) => {
    const topDown = opt.topDown || false; // else leftRight
    const g = new dagre.graphlib.Graph();

    g.setGraph({rankdir: topDown ? 'TD' : 'LR', nodesep: 4, ranksep: 32});

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() { return {}; });

    ci.edges.map((e, ei) => {
        const label = e.label || {};
        const eWidth = (label.width || '').toString();
        const capacity = (label.capacity || '').toString();
        if (e.label && e.label.capacity > 0) {
            g.setNode('edge:' + ei, {
                type: 'buffer',
                label: 'edge:' + ei,
                width:  topDown ? 24 : 0,
                height: topDown ? 0 : 24,
                eWidth: eWidth, capacity: capacity
            });
        } else {
            g.setNode('edge:' + ei, {
                type: 'wire',
                label: 'edge:' + ei,
                width:  topDown ? 24 : 0, // 20 * eWidth.length + 8,
                height: topDown ? 0 : 24,
                eWidth: eWidth
            });
        }
    });

    ci.nodes.map((n, ni) => {
        if (isTarget(n)) {
            g.setNode('node:' + ni, {
                label: n.label || ni,
                width: (getNodeType(n).length + 1) * sNode.w, // sSock.w,
                height: sSock.h,
                type: 'target'
            });
        } else
        if (isInitiator(n)) {
            g.setNode('node:' + ni, {
                label: n.label || ni,
                width: (getNodeType(n).length + 1) * sNode.w, // sSock.w ,
                height: sSock.h,
                type: 'initiator'
            });
        } else {
            g.setNode('node:' + ni, {
                label: ni.toString(),
                width: (getNodeType(n).length + 1) * sNode.w,
                height: sNode.h,
                type: getNodeType(n)
            });
        }
        n.to.map(e => {
            g.setEdge('node:' + ni, 'edge:' + findGlobalIndexOfEdge(ci, e));
        });
        n.from.map(e => {
            g.setEdge('edge:' + findGlobalIndexOfEdge(ci, e), 'node:' + ni);
        });
    });

    dagre.layout(g);
    return g;
};

const render = (pg, opt) => {
    const topDown = opt.topDown || false; // else leftRight
    const w = pg.graph().width + 2 * margin + 1;
    const h = pg.graph().height + 2 * margin + 1;
    return ['svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: w, height: h
        // viewBox: [0, 0, w, h].join(' ')
    },
    ['style', {}, `
text { fill: black; stroke: none; font-family: Roboto,Helvetica; font-size: 11pt; }
.center { alignment-baseline: middle; text-anchor: middle; }
`],
    ['g', t(margin + 0.5, margin + 0.5)]
        .concat(pg.edges().map((e) => {
            const desc = pg.edge(e);
            return ['g', {
                fill: 'none',
                stroke: 'black'
            }, ['path', {
                d: 'M' + desc.points.map(point =>
                    point.x + ' ' + point.y
                ).join('L')
            }]];
        }))
        .concat(pg.nodes().map((n) => {
            const desc = pg.node(n);
            if (desc.type === 'wire') {
                return ['g', t(desc.x, desc.y),
                    ['circle', {r: 3, fill: '#000'}],
                    // ['rect', {
                    //     x: -desc.width / 2, width: desc.width,
                    //     y: -desc.height / 2, height: desc.height,
                    //     fill: 'hsla(120, 0%, 50%, 0.05)'
                    // }],
                    ['text', {'text-anchor': 'end', x: -2, y: -2}, desc.eWidth]
                ];
            }
            if (desc.type === 'buffer') {
                return ['g', t(desc.x, desc.y),

                    ['rect', topDown ? {
                        x: -sBuffer.w / 2, width: sBuffer.w,
                        y: -sBuffer.h, height: sBuffer.h,
                        fill: '#ddd', stroke: 'black'
                    } : {
                        x: -sBuffer.h, width: sBuffer.h,
                        y: -sBuffer.w / 2, height: sBuffer.w,
                        fill: '#ddd', stroke: 'black'
                    }],


                    ['text', topDown ? {
                        x: -2, y: -(sBuffer.h + 2), 'text-anchor': 'end'
                    } : {
                        x: -(sBuffer.h + 2), y: -2, 'text-anchor': 'end'
                    }, desc.eWidth],

                    ['text', topDown ? {
                        x: 2, y: -(sBuffer.h + 2), 'text-anchor': 'start'
                    } : {
                        x: -(sBuffer.h + 2), y: 2, 'text-anchor': 'end', 'alignment-baseline': 'hanging'
                    }, desc.capacity]
                ];
            }
            if (desc.type === 'target' || desc.type === 'initiator') {

                return ['g', //t(desc.x - (desc.width >> 1), desc.y - 8),
                    ['path', {
                        d: `M${desc.x - (desc.width >> 1)} ${desc.y - 8}l${desc.width - 8} 0l8 8l-8 8l-${desc.width - 8} 0z`,
                        fill: '#fff', stroke: '#000'
                    }],
                    ['text', {class: 'center', x: desc.x, y: desc.y}, desc.label]
                ];
            }
            return ['g', t(desc.x, desc.y),
                ['rect', {
                    x: -desc.width / 2,
                    y: -desc.height / 2,
                    width: desc.width,
                    height: desc.height,
                    rx: Math.min(desc.width, desc.height) / 2,
                    ry: Math.min(desc.width, desc.height) / 2,
                    fill: '#fff',
                    stroke: '#000'
                }],
                ['text', {class: 'center'}, desc.type]
            ];
        }))
    ];
};

module.exports = (ci, opt) => {
    opt = opt || {};
    return stringify(
        render(
            ci2g(ci, opt),
            opt
        ),
        2
    );
};
