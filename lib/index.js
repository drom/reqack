'use strict';

const fhyper = require('./fhyper');
const fhyperVerilog = require('./fhyper-verilog');
const fhyperDot = require('./fhyper-dot');
const fhyperManifest = require('./fhyper-manifest');
const macroVerilog = require('./macro-verilog');

module.exports = {
    circuit: fhyper,
    verilog: fhyperVerilog,
    dot: fhyperDot,
    manifest: fhyperManifest,
    macroVerilog: macroVerilog
};
