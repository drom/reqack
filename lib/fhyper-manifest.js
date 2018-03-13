'use strict';

function gLabel (g) {
    return g.label || 'g';
}

const descriptor = (ni, preffix, root, width) => ({
    data: preffix + root + '_dat',
    valid: preffix + root + '_req',
    ready: preffix + root + '_ack',
    width: width,
    length: 16
});

module.exports = function (g, name) {
    const targets = g.nodes.reduce((res, n, ni) => {
        const root = n.label || ni;
        return res.concat((n.from.length === 0) ? [
            descriptor(ni, 't_', root, n.to[0].label.width)
        ] : []);
    }, []);
    const initiators = g.nodes.reduce((res, n, ni) => {
        const root = n.label || ni;
        return res.concat((n.to.length === 0) ? [
            descriptor(ni, 'i_', root, n.from[0].label.width)
        ] : []);
    }, []);
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
