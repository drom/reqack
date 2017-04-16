'use strict';

function slice (ref, lsb, msb) {
    return {
        kind: 'slice',
        $ref: ref,
        lsb: lsb,
        msb: msb
    };
}

function deco (val) {
    var i = 0;
    return function (width) {
        var lsb = i;
        i = i + width;
        return slice(val, lsb, i - 1);
    };
}

describe('risc-v-isa-formats', function () {
    it('R', function (done) {
        var m = function (ir) {
            const irs = deco(ir);
            return {
                opcode: irs(7),
                rd:     irs(5),
                func3:  irs(3),
                rs1:    irs(5),
                rs2:    irs(5),
                func7:  irs(7)
            };
        };
        console.log(m({}));
        done();
    });
});
