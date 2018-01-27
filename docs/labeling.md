# Grapth, Node, Edge Labeling

## Graph
fhyper(label)
* `undefined`, `null` -> `{}`
* `String` -> `{label: <String>}`
* `Number`
* `Object`
* `Function`
* `Array`

## Nodes
node (label)
* `undefined`, `null` -> XOR
* `String` -> Operator
* `Number`
* `Object`
    * name: `String`
    * ...
    * latency: `Number` (Int)
    * function?
* `Function`
* `Array`

## Edges
edge (label)
* `undefined`, `null` -> wire (sizable)
* `String`
* `Number` (Int) -> width
* `Object`
    * name: `String` -> .toString()
    * capacity: `Number` (Int)
    * latency: `Number` (Int)
    * eager: `bool`
    * width: (undefined/Number)
* `Function`
* `Array`
