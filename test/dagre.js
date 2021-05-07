'use strict';

const range = require('lodash.range');
const fs = require('fs-extra');
const reqack = require('../lib');

const grender = (fn, params, fname, done) => {
  const g = reqack.circuit();
  fn(g, params);
  fs.outputFile('test/' + fname + '.svg', reqack.svg(g), done);
};

const xbar = (n, m) =>
  g => {
    const targets = range(n).map(t => g('target' + t)());
    range(m).map(i => {
      const nd = g('mux');
      targets.map(t => t(nd));
      nd()(g('initiator' + i));
    });
  };

describe('dagre', () => {
  it('1x1', done => grender(xbar(1, 1), {}, '1x1', done));
  it('3x5', done => grender(xbar(3, 5), {}, '3x5', done));
});
