// @flow
'use strict';

var cnode = (name /*:string*/, _nodes /*:Object[]*/) /*:function*/=> {
    let n = function () {};
    n._inp = {};
    n._out = {};
    n.add = x => console.log(x)
    if (name) {
        n._name = name;
    }
    _nodes.push(n);
    return new Proxy(n, {
        get: (target /*:Object*/, property /*:string*/, receiver /*:Proxy<>*/) /*:Object*/ => {
            target._out[property] = {};
            return target;
        },
        set: (target /*:Object*/, property /*:string*/, value /*:string*/, receiver /*:Proxy<>*/) /*:bool*/ => {
            target._inp[property] = { value: value };
            return true;
        },
        apply: (target, thisArg, argumentsList) => {
            console.log('apply!', argumentsList);
        }
    });
}

var network = () => {
    var _nodes = [];
    return {
        node: function () {
            let a;
            switch (arguments.length) {
            case 0:
                return cnode('foo', _nodes);
            case 1:
                a = arguments[0].split(' ');
                break;
            default:
                a = [...arguments];
            }
            return a.map(e => cnode(e, _nodes))
        },
        dump: () => {
            _nodes.forEach(e => {
                console.log(
                    Object.keys(e._inp),
                    ' ->(' + e._name + ')-> ',
                    Object.keys(e._out)
                );
            });
        }
    };
}

describe('proxy', () => {

    it('foo', done => {
        let net = network();
        ($ => {
            $('foo');
        })(net.node);
        net.dump();
        done();
    });

    it('foo bar', done => {
        let net = network();
        ($ => {
            $('foo bar');
        })(net.node);
        net.dump();
        done();
    });

    it('p1', done => {
        let net = network();
        ($ => {
            let A = $('A')
            let B = $('B')
            let C = $('C')
            // let [B, C] = $('B', 'C')
            let D = $('D')

            B[0] = A[0]
            // B.i = A.o
            // A(i => i + 1)
            // C[0] = A[1].add(A[2])
        })(net.node);
        net.dump();
        done();
    });

});

/*:: declare function describe(): string; */
/*:: declare function it(): string; */
