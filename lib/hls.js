'use strict';

const esprima = require('esprima');
const escodegen = require('escodegen');
const estraverse = require('estraverse');
const fhyper = require('./fhyper');

const ops = {
    '+': {name: 'add', fn: (a, b) => a + b},
    '-': {name: 'sub', fn: (a, b) => a - b}
};

function opGen (g, lut) {
    var res = {};
    Object.keys(lut).forEach(function (key) {
        var e = lut[key];
        res[e.name] = function (a, b) {
            if (typeof a === 'number' && typeof b === 'number') {
                return e.fn(a, b);
            }
            const aEdge = (typeof a === 'function') ? a : g({name: a})({});
            const bEdge = (typeof b === 'function') ? b : g({name: b})({});
            const resNode = g({name: e.name});
            aEdge(resNode);
            bEdge(resNode);
            return resNode({});
        };
    });
    // console.log(res);
    return res;
}

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
                        name: ops[node.operator].name
                    },
                    arguments: [node.left, node.right]
                };
            }
        }
    });
    // console.log(JSON.stringify(newAst, null, 4));
    const newFnText = escodegen.generate(newAst);
    // console.log(newFnText);
    const _g = fhyper();
    const {add, sub} = opGen(_g, ops);
    var _res;
    eval('_res = ' + newFnText);
    return _res;
}

module.exports = hls;
/* eslint no-unused-vars: 0 */
