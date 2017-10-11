'use strict';

var operators = require('./operators');

function edgeWidth (e) {
    if (e.label) {
        switch (typeof e.label) {
        case 'number':
            return e.label;
        case 'object':
            if (typeof e.label.width === 'number') {
                return e.label.width;
            }
        }
    }
}

function vport (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        var val = desc[key];
        var type = (val < 0) ? 'output ' : 'input  ';
        var size = (Math.abs(val) > 1)
            ? '[' + (Math.abs(val) - 1)+ ':0] '
            : '       ';
        var comma = (i === (arr.length - 1)) ? '' : ',';
        return '    ' + type + size + key + comma;
    });
}

function vlogic (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        var val = desc[key];
        var type = 'logic ';
        var size = (Math.abs(val) > 1)
            ? '[' + (Math.abs(val) - 1)+ ':0] '
            : '       ';
        var comma = (i === (arr.length - 1)) ? '' : ',';
        return '    ' + type + size + key + comma;
    });
}

function pbind (desc) {
    return Object.keys(desc).map(function (key, i, arr) {
        var comma = (i === (arr.length - 1)) ? '' : ',';
        var val = (desc[key] === 1) ? key : desc[key];
        return '    .' + key + '(' + val + ')' + comma;
    });
}

function dport (g) {
    var ports = g.nodes.reduce(function (res, n, ni) {
        if (n.from.length === 0) { // input edges
            n.to.reduce(function (eres, e, ei) {
                eres['t_' + ni + '_' + ei + '_dat'] = edgeWidth(e);
                eres['t_' + ni + '_' + ei + '_req'] = 1;
                eres['t_' + ni + '_' + ei + '_ack'] = -1;
                return eres;
            }, res);
        }
        if (n.to.length === 0) { // output edges
            n.from.reduce(function (eres, e, ei) {
                eres['i_' + ni + '_' + ei + '_dat'] = -edgeWidth(e);
                eres['i_' + ni + '_' + ei + '_req'] = -1;
                eres['i_' + ni + '_' + ei + '_ack'] = 1;
                return eres;
            }, res);
        }
        return res;
    }, {clk:1, reset_n:1});
    return vport(ports);
}

function cport (g) {
    var ports = g.nodes.reduce(function (res, n, ni) {
        if (n.from.length === 0) { // input edges
            n.to.reduce(function (eres, e, ei) {
                eres['t_' + ni + '_' + ei + '_req'] = 1;
                eres['t_' + ni + '_' + ei + '_ack'] = -1;
                return eres;
            }, res);
        }
        if (n.to.length === 0) { // output edges
            n.from.reduce(function (eres, e, ei) {
                eres['i_' + ni + '_' + ei + '_req'] = -1;
                eres['i_' + ni + '_' + ei + '_ack'] = 1;
                return eres;
            }, res);
        }
        return res;
    }, {clk:1, reset_n:1});
    return vport(ports);
}

function dlogic (g) {
    return vlogic(g.edges.reduce(function (eres, e, ei) {
        var ename = 'e' + ei;
        ename += (e.label.capacity ? (', ' + ename + '_nxt') : '');
        eres[ename] = e.label.width;
        return eres;
    }, {}));
}

function dcomb (g) {
    var res = ['\nalways @* begin'];
    res = g.edges.reduce(function (eres, e, ei) {
        var n = e.source.node;
        var op = n.label;
        var ename = 'e' + ei;
        ename += (e.label.capacity ? '_nxt' : '    ');
        var args = (operators[op] || operators.nop)(
            n.from.map(function (ee) {
                var eeeres = 'x';
                g.edges.some(function (eee, eeei) {
                    if (ee === eee) {
                        eeeres = 'e' + eeei;
                        return true;
                    }
                });
                return eeeres;
            })
        );
        var expr = '    ' + ename + ' = ' + args + ';';
        return eres.concat(expr);
    }, res);
    res = res.concat('end\n');
    return res;
}

function dff (g) {
    var res = [
        'always @(posedge clk or negedge reset_n)',
        '    if(~reset_n) begin'
    ];
    res = g.edges.reduce(function (eres, e, ei) {
        var ename = 'e' + ei;
        if (e.label.capacity) {
            return eres.concat('        ' + ename + ' <= 0;');
        }
        return eres;
    }, res);
    res = res.concat('    end else begin');
    res = g.edges.reduce(function (eres, e, ei) {
        var ename = 'e' + ei;
        if (e.label.capacity) {
            return eres.concat('        ' + ename + ' <= ' + 'nxt_' + ename + ';');
        }
        return eres;
    }, res);
    res = res.concat('    end\n');
    return res;
}

function ctrlInstance (g) {
    var body = g.nodes.reduce(function (res, n, ni) {
        if (n.from.length === 0) { // input edges
            n.to.reduce(function (eres, e, ei) {
                var name = 't_' + ni + '_' + ei;
                eres[name + '_req'] = 1;
                eres[name + '_ack'] = 1;
                return eres;
            }, res);
        }
        if (n.to.length === 0) { // output edges
            n.from.reduce(function (eres, e, ei) {
                var name = 'i_' + ni + '_' + ei;
                eres[name + '_req'] = 1;
                eres[name + '_ack'] = 1;
                return eres;
            }, res);
        }

        return res;
    }, {clk: 'clk', reset_n: 'reset_n'});
    return ['gctrl gctrl ( // ' + g.nodes.length]
        .concat(pbind(body))
        .concat([');']);
}

function ctrlModule (g) {
    return ['module gctrl (']
        .concat(cport(g))
        .concat(');')
        .concat('// ' + g.nodes.length)
        .concat('endmodule // gctrl\n');
}

module.exports = function (g) {
    return ['module gdata (']
        .concat(dport(g))
        .concat(');')
        .concat(dlogic(g))
        .concat(dcomb(g))
        .concat(dff(g))
        .concat(ctrlInstance(g))
        .concat('endmodule // gdata\n')
        .concat(ctrlModule(g))
        .join('\n');
};
