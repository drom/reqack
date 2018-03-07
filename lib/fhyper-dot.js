'use strict';

function nId (i) { return 'n' + i.toString(); }
function eId (i) { return 'e' + i.toString(); }

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
        'graph [fontname=helvetica margin=0.02 width=0 height=0];',
        'node [fontname=helvetica margin=0.04 width=0 height=0];',
        'edge [fontname=helvetica margin=0.02 width=0 height=0];'
    ];

    var nodes = {};
    var edges = {};

    res = res.concat(g.nodes.map(function (n, i) {
        var key = nId(i);
        nodes[key] = n;
        var l = n.label;
        return key + ((l === undefined) ? '' : ' [label="' + l + '"];');
    }));
    var nodeKeys = Object.keys(nodes);

    res = res.concat(g.edges.map(function (e, i) {
        var key = eId(i);
        edges[key] = e;
        var w = edgeWidth(e);

        var shape = 'none';
        if (e.label.capacity === 1) {
            shape = 'box';
        } else if (e.label.capacity === 1.5) {
            shape = 'box3d';
        }

        var label = '';
        if (w) {
            label = '; label=' + w;
        }
        return key + ' [shape=' + shape + label + '];';
    }));
    var edgeKeys = Object.keys(edges);

    res = res.concat(g.nodes.map(function (n, i) {
        var nKey = nId(i);
        var res = [];
        n.to.forEach(function (e, ni) {
            edgeKeys.some(function (eKey) {
                if (edges[eKey] === e) {
                    const label = 'label="' + ni + '"';
                    const taillabel = e.taillabel ? ' taillabel="' + e.taillabel + '"' : '';
                    res.push(nKey + ' -> ' + eKey + '       [' + label + taillabel + '];');
                    e.targets.forEach(function (nn) {
                        nodeKeys.some(function (nnKey) {
                            if (nodes[nnKey] === nn.node) {
                                const label1 = 'label="' + nn.index + '"';
                                const headlabel = nn.headlabel ? ' headlabel="' + nn.headlabel + '"' : '';
                                res.push('      ' + eKey + ' -> ' + nnKey + ' [' + label1 + headlabel + '];');
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
