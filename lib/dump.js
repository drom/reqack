'use strict';

const fs = require('fs-extra');
const path = require('path');
const reqack = require('./');

module.exports = function (g, name, custom, done) {
    const outPath = path.resolve('build', name);
    fs.outputFile(
        path.resolve(outPath, name + '.dot'),
        reqack.dot(g),
        () => fs.outputFile(
            path.resolve(outPath, name + '.v'),
            reqack.verilog(g, custom),
            () => fs.outputFile(
                path.resolve(outPath, 'project.js'),
                reqack.manifest(g, name),
                done
            )
        )
    );
};
