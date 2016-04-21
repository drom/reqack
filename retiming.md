# Retiming

Original graph

```
  <- h <- g <- f <-
|    ^    ^    ^    ^
v    |    |    |    |
A => b => c => d => e
```

`b+ c+ d+ e+`

```
  <- h <- g <- f <=
|    ^    ^    ^    ^
v    H    H    H    |
A -> b => c => d => e
```

`d+ e+ f+`

```
  <- h <- g <= f <=
|    ^    ^    ^    ^
v    H    H    H    |
A -> b => c -> d => e
```

`f+ h+`

```
  <- h <= g <= f <-
|    ^    ^    ^    ^
v    H    |    |    |
A -> b => c -> d => e
```
