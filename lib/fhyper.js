'use strict';
/* Graph, Directed, Hypergraph, F-edges */

const genConnector = (gState, nState, eState) =>
  function perTarget(nn, headlabel) {
    if (nn === undefined) {
      nn = genNode(gState)();
    }
    const nnState = nn.state;
    const nnFrom = nnState.from;
    eState.targets.push({
      node: nnState,
      index: nnFrom.length,
      headlabel: headlabel
    });
    nnFrom.push(eState);
    return perTarget;
  };

const genEdge = (gState, nState) =>
  (label, taillabel) => {
    if (label === undefined) {
      label = {};
    }
    const eState = {
      source: {
        node: nState,
        index: nState.to.length
      },
      targets: [],
      label: label,
      taillabel: taillabel,
      root: gState
    };
    nState.to.push(eState);
    gState.edges.push(eState);
    const res = genConnector(gState, nState, eState);
    res.state = eState;
    return res;
  };

const genNode = gState =>
  function(label) {
    const nState = {
      from: [],
      to: [],
      label: label,
      root: gState
    };
    gState.nodes.push(nState);
    const res = genEdge(gState, nState);
    res.state = nState;

    const alen = arguments.length;
    if (alen > 1) {
      for (let i = 1; i < alen; i++) {
        const arg = arguments[i];
        if (Array.isArray(arg)) {
          arg.map(function(subArg) {
            subArg(res);
          });
        } else {
          arg(res);
        }
      }
    }
    return res;
  };

module.exports = function(label) {
  const gState = {
    nodes: [],
    edges: [],
    label: label
  };
  const res = genNode(gState);
  res.nodes = gState.nodes;
  res.edges = gState.edges;
  res.label = gState.label;
  return res;
};
