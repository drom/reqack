'use strict';

function nId(i) {
  return 'n' + i.toString();
}

function eId(i) {
  return 'e' + i.toString();
}

function edgeWidth(e) {
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

module.exports = function(g) {
  let res = [
    'digraph g {',
    'graph [fontname=helvetica margin=0.02 width=0 height=0];',
    'node [fontname=helvetica margin=0.04 width=0 height=0];',
    'edge [fontname=helvetica margin=0.02 width=0 height=0];'
  ];

  const nodes = {};
  const edges = {};

  res = res.concat(g.nodes.map(function(n, i) {
    const key = nId(i);
    nodes[key] = n;
    const l = n.label;
    return key + ((l === undefined) ? '' : ' [label="' + l + '"];');
  }));
  const nodeKeys = Object.keys(nodes);

  res = res.concat(g.edges.map(function(e, i) {
    const key = eId(i);
    edges[key] = e;
    const w = edgeWidth(e);

    let shape = 'none';
    if (e.label.capacity === 1) {
      shape = 'box';
    } else if (e.label.capacity > 1) {
      shape = 'box3d';
    }

    let label = w || '';
    label += (e.label.capacity > 1) ? (',C:' + e.label.capacity) : '';
    label = (label === '') ? '' : '; label="' + label + '"';

    return key + ' [shape=' + shape + label + '];';
  }));
  const edgeKeys = Object.keys(edges);

  res = res.concat(g.nodes.map(function(n, i) {
    const nKey = nId(i);
    const res = [];
    n.to.forEach(function(e, ni) {
      edgeKeys.some(function(eKey) {
        if (edges[eKey] === e) {
          const label = 'label="' + ni + '"';
          const taillabel = e.taillabel ? ' taillabel="' + e.taillabel + '"' : '';
          res.push(nKey + ' -> ' + eKey + '       [' + label + taillabel + '];');
          e.targets.forEach(function(nn) {
            nodeKeys.some(function(nnKey) {
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
