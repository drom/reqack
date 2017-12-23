# Retiming

### Construct circuit

```js
const a = G('a');
const b = G('b');
const c = G('c');
const d = G('d');
const e = G('e');
const f = G('f');
const g = G('g');
const h = G('h');

a({capacity: 1})(b);
b({capacity: 1})(c);
c({capacity: 1})(d);
d({capacity: 1})(e);

b({})(h);
c({})(g);
d({})(f);
e({})(f);
f({})(g);
g({})(h);
h({})(a);
```
<!-- ![](img/ret0.svg) -->
![](https://rawgit.com/drom/elastic/master/img/ret0.svg)

### Step 1

```js
B.retime()
C.retime()
D.retime()
E.retime()
```
<!-- ![](img/ret1.svg) -->
![](https://rawgit.com/drom/elastic/master/img/ret1.svg)

### Step 2

```js
D.retime()
E.retime()
F.retime()
```
<!-- ![](img/ret2.svg) -->
![](https://rawgit.com/drom/elastic/master/img/ret2.svg)

### Step 3

```js
F.retime()
G.retime()
```
<!-- ![](img/ret3.svg) -->
![](https://rawgit.com/drom/elastic/master/img/ret3.svg)

### Steps 1-2-3 combined

```js
B.retime()
C.retime()
D.retime(2)
E.retime(2)
F.retime(2)
G.retime()
```
