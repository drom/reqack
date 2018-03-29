#!/usr/bin/env node

'use strict';

/**
    Usage:
    node templer.js --source source.dir --output templates.js
*/

var fs = require('fs-extra'),
    path = require('path'),
    template = require('lodash.template'),
    yargs = require('yargs');

var argv = yargs.argv;

if ((argv.source !== undefined) && (argv.output !== undefined)) {
    var srcPath = path.resolve(process.cwd(), argv.source);
    var outPath = path.resolve(process.cwd(), argv.output);
    console.log('source folder: ' + srcPath);
    console.log('output   file: ' + outPath);
    fs.readdir(srcPath, function (err0, files) {
        var fileCount = 0;
        var res = '// transpiled from: ' + argv.source + '\n';
        if (err0) {
            throw err0;
        }
        files.forEach(function (fileName, index) {
            var srcFilePath;
            srcFilePath = path.resolve(srcPath, fileName);
            console.log(srcFilePath);
            fileCount += 1;
            (function (key, idx) {
                fs.readFile(srcFilePath, 'utf-8', function (err1, srcFileBody) {
                    if (err1) {
                        throw err1;
                    }
                    fileCount -= 1;

                    try {
                        res += '\nvar __f' + idx + ' = ' + template(srcFileBody) + ';\n';
                    } catch (err2) {
                        console.log(srcFileBody);
                        throw err2;
                    }

                    if (fileCount === 0) {
                        res += '\nmodule.exports = {\n'
                        files.reduce(function (out, e, i) {
                            res += '    \'' + e + '\' : __f' + i + ',\n';
                            return res;
                        }, res);
                        res += '};\n';
                        fs.outputFile(
                            outPath,
                            res,
                            'utf-8',
                            function (err3) {
                                if (err3) {
                                    throw err3;
                                }
                                console.log('output file saved.');
                            }
                        );
                    }
                });
            })(fileName, index);
        });
    });
}
