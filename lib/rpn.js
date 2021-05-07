'use strict';

const binOps = '+ - / % & | ^ << >> > >= < <= == != && ||'
  .split(/\s+/)
  .reduce((res, e) => {
    res[e] = e;
    return res;
  }, {
    'u*': '*'
  });

const signedBinOps = {
  '*': '*'
};

const unOps = {
  '!': '!',
  '~': '~'
};

const rpn = (seq, arr) => {
  if (typeof seq === 'string') {
    seq = seq.split(/\s+/);
  }
  // if (typeof arr === 'string') {
  //     arr = arr.split(/\s+/);
  // }
  arr = arr.map(e => e.name);
  for (let j = 0; j < 100; j++) {
    for (let i = 0; i < seq.length; i++) {
      const cmd = seq[i];
      if (unOps[cmd]) {
        arr.push(cmd + arr.pop());
      } else
      if (signedBinOps[cmd]) {
        const rhs = arr.pop();
        const lhs = arr.pop();
        arr.push(`($signed(${lhs}) ${signedBinOps[cmd]} $signed(${rhs}))`);
      } else
      if (binOps[cmd]) {
        const rhs = arr.pop();
        const lhs = arr.pop();
        arr.push(`(${lhs} ${binOps[cmd]} ${rhs})`);
      } else
      if (cmd.slice(0, -1) === '(' && binOps[cmd.slice(1)]) {
        const lhs = arr.shift();
        const rhs = arr.shift();
        arr.unshift(`(${lhs} ${cmd.slice(1)} ${rhs})`);
      } else
      if (cmd === 'swap') {
        const rhs = arr.pop();
        const lhs = arr.pop();
        arr.push(rhs);
        arr.push(lhs);
      } else {
        const num = Number(cmd);
        if (!isNaN(num)) {
          arr.push(num);
        }
      }
      if (arr.length < 2) {
        return arr[0];
      }
    }
  }
  return arr[0];
};

module.exports = rpn;
