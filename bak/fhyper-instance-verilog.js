'use strict';

const indent = '    ';

const assign = (lhs, rhs) => ['assign ' + lhs + ' = ' + rhs + ';'];

function gLabel (g) {
    return g.label || 'g';
}

function vectorDim (size) {
    const body = (Math.abs(size) > 1) ? '[' + (Math.abs(size) - 1) + ':0]' : '';
    return ((' ').repeat(20) + body + ' ').slice(-8);
}

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

const topModule = g => {

    const demuxInst = (e, ei, tsuffix) => ['demux' + e.targets.length + ' #(']
        .concat(
            ['.T_0_DAT_WIDTH(' + e.label.width + ')']
                .concat(e.targets.map((t, ti) =>
                    '.I_' + ti + '_DAT_WIDTH(' + e.label.width + ')'))
                .map(line => indent + line).join(',\n')
        )
        .concat(') demux' + ei + ' (')
        .concat(
            ['dat', 'req', 'ack'].map(suffix => '.t_0_' + suffix + '(edge' + ei + tsuffix + '_' + suffix + ')')
                .concat(
                    e.targets.reduce((res, t, ti) =>
                        res.concat(
                            ['dat', 'req', 'ack'].map(suffix => '.i_' + ti + '_' + suffix + '(edge' + ei + '_' + ti + '_' + suffix + ')')
                        ), [])
                )
                .map(line => indent + line).join(',\n')
        )
        .concat(');')
        ;

    const eb1Inst = (e, ei, tsuffix) => `
// EB1 ${ei} ${tsuffix}
eb1 #(
    .T_0_DAT_WIDTH(${e.label.width}),
    .I_0_DAT_WIDTH(${e.label.width})
) ueb${ei} (
    .t_0_dat(edge${ei}_dat),
    .t_0_req(edge${ei}_req),
    .t_0_ack(edge${ei}_ack),
    .t_0_dat(edge${ei}${tsuffix}_dat),
    .t_0_req(edge${ei}${tsuffix}_req),
    .t_0_ack(edge${ei}${tsuffix}_ack),
    .clk(clk),
    .reset_n(reset_n)
);
`;

    const eb2Inst = (e, ei, tsuffix) => `
// EB2 ${ei} ${tsuffix}
eb2 #(
    .T_0_DAT_WIDTH(${e.label.width}),
    .I_0_DAT_WIDTH(${e.label.width})
) ueb${ei} (
    .t_0_dat(edge${ei}_dat),
    .t_0_req(edge${ei}_req),
    .t_0_ack(edge${ei}_ack),
    .t_0_dat(edge${ei}${tsuffix}_dat),
    .t_0_req(edge${ei}${tsuffix}_req),
    .t_0_ack(edge${ei}${tsuffix}_ack),
    .clk(clk),
    .reset_n(reset_n)
);
`;

    const perEdgeInstController = (e, ei) => {
        const length = e.targets.length;
        if (length === 1) {
            if (e.label.capacity === 1) {
                return eb1Inst(e, ei, '_0');
            }
            if (e.label.capacity === 2) {
                return eb2Inst(e, ei, '_0');
            }
            return ['// wires'];
        }

        if (e.label.capacity === 1) {
            return eb1Inst(e, ei, '').concat(demuxInst(e, ei, '_r'));
        }
        if (e.label.capacity === 2) {
            return eb2Inst(e, ei, '').concat(demuxInst(e, ei, '_r'));
        }
        return demuxInst(e, ei, ''); // demux
    };

    // Edges
    const perEdgeInst = (e, ei) => ['\n// edge ' + ei]
        .concat(
            ([['edge' + ei, e.label.width]]
                .concat(e.label.capacity ? [['edge' + ei + '_r', e.label.width]] : [])
                .concat(e.targets.map((t, ti) =>
                    ['edge' + ei + '_' + ti, e.label.width])
                )
            ).reduce((res, prefix) =>
                res.concat([
                    ['dat', prefix[1]],
                    ['req', 2],
                    ['ack', 2]
                ].map(item => [prefix[0] + '_' + item[0], item[1]]))
                , []
            ).map(item => 'logic ' + vectorDim(item[1]) + item[0]).join(',\n')
        )
        .concat(perEdgeInstController(e, ei))
        ;

    const allEdges = () => ['// edge instances']
        .concat(
            g.edges.reduce((eres, e, ei) =>
                eres.concat(perEdgeInst(e, ei)), []));

    // Nodes
    const perNodeTargetParameter = n =>
        n.from.map((e, ei) =>
            '.T_' + ei + '_DAT_WIDTH(' + e.label.width + ')');

    const perNodeInitiatorParameter = n =>
        n.to.map((e, ei) =>
            '.I_' + ei + '_DAT_WIDTH(' + e.label.width + ')');

    const perNodePortParameter = (n, ni) =>
        perNodeTargetParameter(n, ni)
            .concat(perNodeInitiatorParameter(n, ni))
            .map(line => indent + line)
            .join(',\n')
            ;

    const perNodeTarget = n =>
        n.from.reduce((res, e, ei) => {
            const index = findIndexOfNode(g, e.targets, n);
            const portPrefix = '.t_' + ei + '_';
            const edgePrefix = 'edge' + findGlobalIndexOfEdge(g, e) + '_' + index + '_';
            return res
                .concat('// Target socket ' + ei)
                .concat(portPrefix + 'dat(' + edgePrefix + 'dat)')
                .concat(portPrefix + 'req(' + edgePrefix + 'req)')
                .concat(portPrefix + 'ack(' + edgePrefix + 'ack)');
        }, []);

    const perNodeInitiator = n =>
        n.to.reduce((res, e, ei) => {
            const portPrefix = '.i_' + ei + '_';
            const edgePrefix = 'edge' + findGlobalIndexOfEdge(g, e) + '_';
            return res
                .concat('// Initiaor socket ' + ei)
                .concat(portPrefix + 'dat(' + edgePrefix + 'dat)')
                .concat(portPrefix + 'req(' + edgePrefix + 'req)')
                .concat(portPrefix + 'ack(' + edgePrefix + 'ack)');
        }, []);

    const perNodePort = (n, ni) =>
        perNodeTarget(n, ni)
            .concat(perNodeInitiator(n, ni))
            .concat('.*')
            .map(line => indent + line)
            .join(',\n')
            ;

    const perNodeInst = (n, ni) => ['// functional node: ' + ni]
        .concat(n.label + ' #(')
        .concat(perNodePortParameter(n, ni))
        .concat(') un' + ni + ' (')
        .concat(perNodePort(n, ni))
        .concat(');\n')
        ;

    const perTargetNode = (n, ni) => {
        const edgePrefix = 'edge' + findGlobalIndexOfEdge(g, n.to[0]);
        return ['// target node: ' + ni]
            .concat(assign(edgePrefix + '_dat', 't_' + ni + '_dat'))
            .concat(assign(edgePrefix + '_req', 't_' + ni + '_req'))
            .concat(assign(edgePrefix + '_ack', 't_' + ni + '_ack'))
        ;
    };

    const perInitiatorNode = (n, ni) => {
        const edge = n.from[0];
        const index = findIndexOfNode(g, edge.targets, n);
        const edgePrefix = 'edge' + findGlobalIndexOfEdge(g, edge) + '_' + index;
        return ['// initiator node: ' + ni]
            .concat(assign('t_' + ni + '_dat', edgePrefix + '_dat'))
            .concat(assign('t_' + ni + '_req', edgePrefix + '_req'))
            .concat(assign('t_' + ni + '_ack', edgePrefix + '_ack'));
    };

    const perNode = (n, ni) =>
        (n.from.length === 0) ? perTargetNode(n, ni) :
            (n.to.length === 0) ? perInitiatorNode(n, ni) :
                perNodeInst(n, ni);

    const allNodes = () => ['// node instances']
        .concat(
            g.nodes.reduce((nres, n, ni) =>
                nres.concat(perNode(n, ni)), [])
        );

    const perTargetPort = (n, ni) => {
        const edge = n.to[0];
        return ['// target port: ' + ni]
            .concat('input        [' + (edge.label.width - 1) + ':0] t_' + ni + '_dat')
            .concat('input        t_' + ni + '_req')
            .concat('output logic t_' + ni + '_ack')
        ;
    };

    const perInitiatorPort = (n, ni) => {
        const edge = n.from[0];
        return ['// initiator port: ' + ni]
            .concat('output logic [' + (edge.label.width - 1) + ':0] i_' + ni + '_dat')
            .concat('output logic i_' + ni + '_req')
            .concat('input        i_' + ni + '_ack')
        ;
    };

    const perPort = (n, ni) =>
        (n.from.length === 0) ? perTargetPort(n, ni) :
            (n.to.length === 0) ? perInitiatorPort(n, ni) : [];

    const allPorts = () => ['// ports']
        .concat(
            g.nodes.reduce((nres, n, ni) =>
                nres.concat(perPort(n, ni)), [])
        )
        .concat('input clk, reset_n')
        .map(line => indent + line)
        .join(',\n')
        ;

    return function () {
        const glabel = gLabel(g);
        return ['module ' + glabel + ' (']
            .concat(allPorts())
            .concat(');')
            // .concat(dlogic(g))
            .concat(allEdges())
            .concat(allNodes())
            .concat('endmodule // ' + glabel + '\n');
    };
};

module.exports = function (g) {
    return topModule(g)().join('\n');
};

/* eslint no-unused-vars: 1 */
