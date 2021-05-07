'use strict';

const dagre = require('dagre');

const fhyper = require('./fhyper.js');
const fhyperVerilog = require('./fhyper-verilog.js');
const fhyperDot = require('./fhyper-dot.js');
const fhyperDagre = require('./fhyper-dagre.js');
const fhyperManifest = require('./fhyper-manifest.js');
const nodeForkCtrl = require('./node-fork-ctrl.js');
const nodeMacros = require('./node-macros.js');
const hls = require('./hls.js');
const firrtl = require('./fhyper-firrtl.js');

exports.circuit = fhyper;
exports.verilog = fhyperVerilog;
exports.dot = fhyperDot;
exports.svg = fhyperDagre;
exports.manifest = fhyperManifest;
exports.macros = nodeMacros;
exports.ctrl = {fork: nodeForkCtrl};
exports.hls = hls;
exports.dagre = dagre;
exports.firrtl = firrtl;
