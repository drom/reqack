'use strict';

const dagre = require('dagre');
const onml = require('onml');

const isTarget = n => n.from.length === 0;
const isInitiator = n => n.to.length === 0;

const t = (x, y) => ({transform: 'translate(' + (x | 0) + ',' + (y | 0) + ')'});

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

const ci2g = ci => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({rankdir: 'LR', nodesep: 16, ranksep: 48});

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
                width: 0, // 10 * eWidth.length + 10 * capacity.length + 8
                height: 24,
                eWidth: eWidth, capacity: capacity
            });
        } else {
            g.setNode('edge:' + ei, {
                type: 'wire',
                label: 'edge:' + ei,
                width: 0, // 20 * eWidth.length + 8,
                height: 24,
                eWidth: eWidth
            });
        }
    });

    ci.nodes.map((n, ni) => {
        if (isTarget(n)) {
            g.setNode('node:' + ni, {
                label: n.label || ni,
                width: 32,
                height: 16,
                type: 'target'
            });
        } else
        if (isInitiator(n)) {
            g.setNode('node:' + ni, {
                label: n.label || ni,
                width: 32,
                height: 16,
                type: 'initiator'
            });
        } else {
            g.setNode('node:' + ni, {
                label: ni.toString(),
                width: 32,
                height: 32,
                type: n.label || ''
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

const render = (p) => {
    const w = p.g.graph().width;
    const h = p.g.graph().height;
    return ['svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: w + 1 + 32,
        height: h + 1 + 32,
        viewBox: [0, 0, w + 1 + 32, h + 1 + 32].join(' ')
    },
    ['style', {}, `
text { fill: black; stroke: none; font-family: Roboto; }
.center { alignment-baseline: middle; text-anchor: middle; }
`],
    ['g', {transform: 'translate(16.5, 16.5)'}]
        .concat(p.g.edges().map((e) => {
            const desc = p.g.edge(e);
            return ['g', {
                fill: 'none',
                stroke: 'black'
            }, ['path', {
                d: 'M' + desc.points.map(point =>
                    point.x + ' ' + point.y
                ).join('L')
            }]];
        }))
        .concat(p.g.nodes().map((n) => {
            const desc = p.g.node(n);
            if (desc.type === 'wire') {
                return ['g', t(desc.x, desc.y),
                    ['circle', {r: 3, fill: '#000'}],
                    ['rect', {
                        x: -desc.width / 2, width: desc.width,
                        y: -desc.height / 2, height: desc.height,
                        fill: 'hsla(120, 0%, 50%, 0.05)'
                    }],
                    ['text', {'text-anchor': 'end', x: -2, y: -3}, desc.eWidth]
                ];
            }
            if (desc.type === 'buffer') {
                return ['g', t(desc.x, desc.y),
                    ['rect', {
                        x: -8, width: 8,
                        y: -16, height: 32,
                        fill: '#ddd', stroke: 'black'
                    }],
                    ['text', {
                        x: -10, y: -3, 'text-anchor': 'end'
                    }, desc.eWidth],
                    ['text', {
                        x: -10, y:  3, 'text-anchor': 'end', 'alignment-baseline': 'hanging'
                    }, desc.capacity]
                ];
            }
            if (desc.type === 'target' || desc.type === 'initiator') {
                return ['g', {transform: `translate(${desc.x - 16}, ${desc.y - 8})`},
                    ['path', {
                        d: 'M0 0l24 0l8 8l-8 8l-24 0z',
                        fill: '#fff', stroke: '#000'
                    }],
                    ['text', {x: 2, y: 14}, desc.label]
                ];
            }
            return ['g', t(desc.x, desc.y),
                ['circle', {r: 0.6 * desc.width, fill: '#fff', stroke: '#000'}],
                ['text', {class: 'center'}, desc.type]
            ];
        }))
    ];
};

module.exports = ci => onml.s(render({g: ci2g(ci)}));
