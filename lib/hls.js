'use strict';

const esprima = require('esprima');
const escodegen = require('escodegen');
const estraverse = require('estraverse');

function operator (name, cb) {
    return function (a, b) {
        if (typeof a === 'number' && typeof b === 'number') {
            return cb(a, b);
        }
        return [name, a, b];
    };
}

const ops = {
    '+': '_add',
    '-': '_sub'
};

function hls (fn) {
    const fnText = fn.toString();
    // console.log(fnText);
    const ast = esprima.parse(fnText);
    // console.log(JSON.stringify(ast, null, 4));
    const newAst = estraverse.replace(ast, {
        leave: function (node) {
            if (node.type === 'BinaryExpression') {
                return {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: ops[node.operator]
                    },
                    arguments: [
                        node.left,
                        node.right
                    ]
                };
            }
        }
    });
    // console.log(JSON.stringify(newAst, null, 4));
    const newFnText = escodegen.generate(newAst);
    // console.log(newFnText);

    const _add = operator('_add', (a, b) => a + b);
    const _sub = operator('_sub', (a, b) => a - b);
    var res;
    eval('res = ' + newFnText);
    return res;
}

module.exports = hls;
/* eslint no-unused-vars: 0 */
