#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const reqack = require('../../lib');


const circuit = () => {
  const i32 = {width: 32};
  const i32r = {width: 32, capacity: 1.5};
  const g = reqack.circuit('radix2');
  const a = g('a');
  const b = g('b');
  const aE = a(i32);
  const bE = b(i32);
  const add = g('+');
  const sub = g('-');
  aE(add)(sub);
  bE(add)(sub);
  const xE = add(i32r);
  const yE = sub(i32r);
  const x = g('x');
  const y = g('y');
  xE(x);
  yE(y);
  return g;
};


const main = async () => {
  const g = circuit();
  await fs.promises.writeFile(
    path.resolve(__dirname, 'radix2.v'),
    reqack.verilog(g, {})
  );
};

main();

