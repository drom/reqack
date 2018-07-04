'use strict';

const expect = require('chai').expect;
const mimo = require('../lib/mimo');
const dump = str => console.log(str);

describe('mimo', () => {

    it('0x0', () => {
        expect(() =>
            mimo({t: [], i: []})
        ).to.throw();
    });

    it('2x0', () => {
        expect(() =>
            mimo({t: [
                {req: 'req0_0', ack: 'ack0_0'},
                {req: 'req1_0', ack: 'ack1_0'}
            ], i: []})
        ).to.throw();
    });

    it('1x1', () => {
        dump(mimo({
            t: [
                {req: 'req0_0', ack: 'ack0_0'}
            ],
            i: [
                {req: 'req1', ack: 'ack1'}
            ]
        }));
    });

    it('3x1', () => {
        dump(mimo({
            t: [
                {req: 'req0_0', ack: 'ack0_0'},
                {req: 'req1_0', ack: 'ack1_0'},
                {req: 'req2_0', ack: 'ack2_0'}
            ],
            i: [
                {req: 'req3', ack: 'ack3'}
            ]
        }));
    });

    it('1x3', () => {
        dump(mimo({
            t: [
                {req: 'req0_0', ack: 'ack0_0'}
            ],
            i: [
                {req: 'req1', ack: 'ack1'},
                {req: 'req2', ack: 'ack2'},
                {req: 'req3', ack: 'ack3'}
            ]
        }));
    });

    it('3x5', () => {
        dump(mimo({
            t: [
                {req: 'req0_0', ack: 'ack0_0'},
                {req: 'req1_0', ack: 'ack1_0'},
                {req: 'req2_0', ack: 'ack2_0'}
            ],
            i: [
                {req: 'req1', ack: 'ack1'},
                {req: 'req2', ack: 'ack2'},
                {req: 'req3', ack: 'ack3'},
                {req: 'req4', ack: 'ack4'},
                {req: 'req5', ack: 'ack5'}
            ]
        }));
    });

});
