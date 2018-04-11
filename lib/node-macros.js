'use strict';

const nodeForkCtrl = require('./node-fork-ctrl');

const deconcat = {
    data: p => {
        const width = p.i.reduce((res, sig) => (res + sig.width), 0);
        return `assign {${
            p.i.reverse().map(sig => sig.wire).join(', ')
        }} = ${p.t[0].wire}[${width - 1}:0];`;
    },
    ctrl: nodeForkCtrl
};

module.exports = {
    deconcat: deconcat
};
