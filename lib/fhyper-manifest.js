'use strict';

function gLabel (g) {
    return g.label || 'g';
}

const descriptor = (ni, preffix, width) => ({
    data: preffix + ni + '_dat',
    valid: preffix + ni + '_req',
    ready: preffix + ni + '_ack',
    width: width,
    length: 16
});

module.exports = function (g, name) {
    const targets = g.nodes.reduce((res, n, ni) =>
        res.concat((n.from.length === 0) ? [
            descriptor(ni, 't_', n.to[0].label.width)
        ] : []), []);
    const initiators = g.nodes.reduce((res, n, ni) =>
        res.concat((n.to.length === 0) ? [
            descriptor(ni, 'i_', n.from[0].label.width)
        ] : []), []);
    const obj = {
        top: gLabel(g),
        topFile: name + '.v',
        clk: 'clk',
        'reset_n': 'reset_n',
        targets: targets,
        initiators: initiators
    };
    return 'module.exports = ' + JSON.stringify(obj, null, 4) + ';';
};
