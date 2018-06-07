'use strict';

const fhyper = require('./fhyper');
const fhyperVerilog = require('./fhyper-verilog');
const fhyperDot = require('./fhyper-dot');
const fhyperManifest = require('./fhyper-manifest');
const nodeForkCtrl = require('./node-fork-ctrl');
const nodeMacros = require('./node-macros');
const hls = require('./hls');

exports.circuit = fhyper;
exports.verilog = fhyperVerilog;
exports.dot = fhyperDot;
exports.manifest = fhyperManifest;
exports.macros = nodeMacros;
exports.ctrl = {fork: nodeForkCtrl};
exports.hls = hls;
