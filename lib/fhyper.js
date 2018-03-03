'use strict';
/* Graph, Directed, Hypergraph, F-edges */

var genConnector = function (gState, nState, eState) {
    return function perTarget (nn, headlabel) {
        if (nn === undefined) {
            nn = genNode(gState)();
        }
        var nnState = nn.state;
        var nnFrom = nnState.from;
        eState.targets.push({
            node: nnState,
            index: nnFrom.length,
            headlabel: headlabel
        });
        nnFrom.push(eState);
        return perTarget;
    };
};

var genEdge = function (gState, nState) {
    return function perEdge (label, taillabel) {
        if (label === undefined) {
            label = {};
        }
        var eState = {
            source: { node: nState, index: nState.to.length },
            targets: [],
            label: label,
            taillabel: taillabel,
            root: gState
        };
        nState.to.push(eState);
        gState.edges.push(eState);
        var res = genConnector(gState, nState, eState);
        res.state = eState;
        return res;
    };
};

var genNode = function (gState) {
    return function perNode (label) {
        var nState = {
            from: [],
            to: [],
            label: label,
            root: gState
        };
        gState.nodes.push(nState);
        var res = genEdge(gState, nState);
        res.state = nState;
        return res;
    };
};

module.exports = function (label) {
    var gState = {nodes: [], edges: [], label: label};
    var res = genNode(gState);
    res.nodes = gState.nodes;
    res.edges = gState.edges;
    res.label = gState.label;
    return res;
};
