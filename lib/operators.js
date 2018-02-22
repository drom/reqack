'use strict';

function half (arg) {
    const name = arg.name;
    const width = arg.width;
    return [`${name}[${width - 1}:${width / 2}]`, `${name}[${width / 2 - 1}:0]`];
}

function signed (op) {
    return function (args) {
        const args2 = (args.length === 1) ? half(args[0]) : args.map(e => e.name);
        return '(' + args2.map(e => '$signed(' + e + ')').join(' ' + op + ' ') + ')';
    };
}

function logical (op) {
    return function (args) {
        const args2 = (args.length === 1) ? half(args[0]) : args.map(e => e.name);
        return '(' + args2.join(' ' + op + ' ') + ')';
    };
}

module.exports = {

/*
**   exponentiation,  numeric ** integer,  result numeric
abs  absolute value,  abs numeric,  result numeric
not  complement,      not logic or boolean,  result same

*    multiplication,  numeric * numeric,  result numeric
/    division,        numeric / numeric,  result numeric
mod  modulo,          integer mod integer,  result integer
rem  remainder,       integer rem integer,  result integer

+    unary plus,      + numeric,  result numeric
-    unary minus,     - numeric,  result numeric

+    addition,        numeric + numeric,  result numeric
-    subtraction,     numeric - numeric,  result numeric
&    concatenation,   array or element & array or element,
                        result array
*/

    add:  signed('+'),
    '+':  signed('+'),
    sub:  signed('-'),
    '-':  signed('-'),
    mul:  signed('*'),
    '*':  signed('*'),

    sll:  logical('<<'), // shift left logical,     logical array sll integer,  result same
    srl:  logical('>>>'), // shift right logical,    logical array srl integer,  result same
    sla:  logical('<<'), // shift left arithmetic,  logical array sla integer,  result same
    sra:  logical('>>'), // shift right arithmetic, logical array sra integer,  result same
    rol:  logical('rol'), // rotate left,            logical array rol integer,  result same
    ror:  logical('ror'), // rotate right,           logical array ror integer,  result same

    /*
    =    test for equality, result is boolean
    /=   test for inequality, result is boolean
    <    test for less than, result is boolean
    <=   test for less than or equal, result is boolean
    >    test for greater than, result is boolean
    >=   test for greater than or equal, result is boolean
    */

    and:  logical('&'), // logical and,                logical array or boolean,  result is same
    or:   logical('|'), // logical or,                 logical array or boolean,  result is same
    nand: logical('&'), // logical complement of and,  logical array or boolean,  result is same
    nor:  logical('|'), // logical complement of or,   logical array or boolean,  result is same
    xor:  logical('^'), // logical exclusive or,       logical array or boolean,  result is same
    xnor: logical('^'),  // logical complement of exclusive or,  logical array or boolean,  result is same

    'concat': args => '{' + args.reverse().map(e => e.name).join(', ') + '}'
};
