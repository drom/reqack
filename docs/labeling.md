# Node and Edge Labeling
## Nodes
node (label)
* undefined or null -> XOR
* String -> Operator
* Object
    * Name: String
    * ...
    * latency: Number (Int)
    * function?
* Function

## Edges
edge (label)
* undefined or null -> wire (sizable)
* Number (Int) -> width
* Object
    * name: string -> .toString()
    * capacity: Number (Int)
    * latency: Number (Int)
    * eager: bool
    * width: (undefined/Number)
