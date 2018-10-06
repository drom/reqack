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
                path.resolve(outPath, name + '.svg'),
                reqack.svg(g),
                () => fs.outputFile(
                    path.resolve(outPath, 'project.js'),
                    reqack.manifest(g, name),
                    () => fs.appendFile(
                        path.resolve('build', 'index.html'), `
<h3>${name}</h3>
<object data="${name}/${name}.svg" type="image/svg+xml"></object>
`,
                        done
                    )
                )
            )
        )
    );
};
