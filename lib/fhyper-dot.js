'use strict';

function nId (i) { return 'n' + i.toString(32); }
function eId (i) { return 'e' + i.toString(32); }

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

module.exports = function (g) {
    var res = [
        'digraph g {',
        'graph [fontname=helvetica margin=0.03 width=0 height=0];',
        'node [fontname=helvetica margin=0.03 width=0 height=0];',
        'edge [fontname=helvetica margin=0.03 width=0 height=0];'
    ];

    var nodes = {};
    var edges = {};

    res = res.concat(g.nodes.map(function (n, i) {
        var key = nId(i);
        nodes[key] = n;
        var l = n.label ? (n.label.name || n.label) : '_';
        return key + (l ? ' [label="' + l + '"];' : '');
    }));
    var nodeKeys = Object.keys(nodes);

    res = res.concat(g.edges.map(function (e, i) {
        var key = eId(i);
        edges[key] = e;
        var w = edgeWidth(e);
        return key + ' [shape=' + (w
            ? ((e.label.capacity ? 'box' : 'none') + '; label=' + w)
            : (e.label.capacity ? 'box' : 'point')
        ) + '];';
    }));
    var edgeKeys = Object.keys(edges);

    res = res.concat(g.nodes.map(function (n, i) {
        var nKey = nId(i);
        var res = [];
        n.to.forEach(function (e, ni) {
            edgeKeys.some(function (eKey) {
                if (edges[eKey] === e) {
                    res.push(nKey + ' -> ' + eKey + '       [label=' + ni + '];');
                    e.targets.forEach(function (nn) {
                        nodeKeys.some(function (nnKey) {
                            if (nodes[nnKey] === nn.node) {
                                res.push('      ' + eKey + ' -> ' + nnKey + ' [label=' + nn.index + '];');
                                return true;
                            }
                        });
                    });
                    return true;
                }
            });
        });
        return res.join('\n');
    }));

    res.push('}');
    return res.join('\n');
};

/* eslint no-console: 1 */
