'use strict';

const dagre = require('dagre');
const fs = require('fs-extra');
const onml = require('onml');
const reqack = require('../lib');

const ci = reqack.circuit();

const add = ci('add'), sub = ci('sub');

// construct interconnect
ci()()(add)(sub);
ci()()(add)(sub);
add()();
sub()();

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

// Create a new directed graph
var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() { return {}; });

ci.edges.map((e, ei) => {
    g.setNode('edge:' + ei, {label: 'edge:' + ei, width: 60, height: 20});
});

ci.nodes.map((n, ni) => {
    g.setNode('node:' + ni, {label: 'node:' + ni, width: 60, height: 30});
    n.to.map(e => {
        g.setEdge('node:' + ni, 'edge:' + findGlobalIndexOfEdge(ci, e));
    });
    n.from.map(e => {
        g.setEdge('edge:' + findGlobalIndexOfEdge(ci, e), 'node:' + ni);
    });
});

dagre.layout(g);

const render = (p) => {
    const w = p.g.graph().width;
    const h = p.g.graph().height;
    return ['svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: w + 1,
        height: h + 1,
        viewBox: [0, 0, w + 1, h + 1].join(' ')
    },
    ['g', {transform: 'translate(.5, .5)'}]
        .concat(p.g.nodes().map((n) => {
            const desc = p.g.node(n);
            return ['g', {fill: 'none', stroke: 'black', 'text-anchor': 'middle'},
                ['rect', {
                    x: desc.x - desc.width / 2,
                    y: desc.y - desc.height / 2,
                    width: desc.width,
                    height: desc.height
                }],
                ['text', {x: desc.x, y: desc.y, fill: 'black', stroke: 'none'}, desc.label]
            ];
        }))
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
    ];
};

fs.outputFile('./dagre.svg', onml.s(render({g: g})), () => {});
