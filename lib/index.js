'use strict';

const fhyper = require('./fhyper');
const fhyperVerilog = require('./fhyper-verilog');
const fhyperDot = require('./fhyper-dot');
const fhyperManifest = require('./fhyper-manifest');
const nodeForkCtrl = require('./node-fork-ctrl');
const nodeMacros = require('./node-macros');

module.exports = {
    circuit: fhyper,
    verilog: fhyperVerilog,
    dot: fhyperDot,
    manifest: fhyperManifest,
    macros: nodeMacros,
    ctrl: {
        fork: nodeForkCtrl
    }
};
