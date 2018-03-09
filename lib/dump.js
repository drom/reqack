'use strict';

const fs = require('fs-extra');
const path = require('path');
const fhyperDot = require('../lib/fhyper-dot');
const fhyperV = require('../lib/fhyper-verilog');
const fhyperManifest = require('../lib/fhyper-manifest');
// const fhyperIV = require('../lib/fhyper-instance-verilog');

module.exports = function (g, name, custom, done) {
    const outPath = path.resolve('build', name);
    fs.outputFile(
        path.resolve(outPath, name + '.dot'),
        fhyperDot(g),
        () => fs.outputFile(
            path.resolve(outPath, name + '.v'),
            fhyperV(g, custom),
            () => fs.outputFile(
                path.resolve(outPath, 'project.js'),
                fhyperManifest(g, name),
                done
            )
        )
    );
};
