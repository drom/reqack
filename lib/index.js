'use strict';

const fhyper = require('./fhyper');
const fhyperVerilog = require('./fhyper-verilog');
const fhyperDot = require('./fhyper-dot');
const fhyperManifest = require('./fhyper-manifest');

module.exports = {
    circuit: fhyper,
    verilog: fhyperVerilog,
    dot: fhyperDot,
    manifest: fhyperManifest
};
