# Grapth, Node, Edge Labeling

## Graph
`fhyper(label)`
* `undefined`, `null` -> `{}`
* `String` -> `{label: <String>}`
* `Number`
* `Object`
   * label: `String`
* `Function`
* `Array`

## Nodes
`node(label)`
* `undefined`, `null` -> `{operator: 'XOR'}`
* `String` -> `{operator: <String>}`
* `Number`
* `Object`
    * name: `String`
    * ...
    * latency: `Number` (Int)
    * function?
* `Function`
* `Array`

## Edge
`edge(label)`
* `undefined`, `null` -> wire (sizable)
* `String`
* `Number` -> `{width: <Number>}`
* `Object`
    * name: `String` -> .toString()
    * capacity: `Number` (Int)
    * latency: `Number` (Int)
    * eager: `bool`
    * width: (undefined/Number)
* `Function`
* `Array`
