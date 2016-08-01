'use strict';

var node = o => new Proxy({}, {
    get: (target, property, receiver) => {
        target[property] = [];
        console.log(`get: ${property} -> ${JSON.stringify(target, null, 4)}`);
        return target[property];
    },
    set: (target, property, value, receiver) => {
        target[property] = [];
        console.log(`set: ${property} -> ${JSON.stringify(target, null, 4)}`);
        return true;
    }
});

describe('proxy', () => {
    it('p1', done => {
        var A = node();
        var B = node();
        B.i[0] = A.o[0];
        done();
    });
});
