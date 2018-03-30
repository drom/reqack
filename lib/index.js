'use strict';

const fhyper = require('./fhyper');
const fhyperVerilog = require('./fhyper-verilog');
const fhyperDot = require('./fhyper-dot');

module.exports = {
    circuit: fhyper,
    verilog: fhyperVerilog,
    dot: fhyperDot
};
