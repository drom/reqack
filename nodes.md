# Nodes

## reduce

![reduce](https://rawgit.com/drom/elastic/master/img/reduce.svg)


```js
i.req = and(t[0].req, t[1].req, ..., t[n].req)
t[0].ack = and(i.ack, and(1,        t[1].req, ..., t[n].req))
t[1].ack = and(i.ack, and(t[0].req, 1,        ..., t[n].req))
t[n].ack = and(i.ack, and(t[0].req, t[1].req, ..., 1       ))
```
![reduce_ctrl](https://rawgit.com/drom/elastic/master/img/reduce_ctrl.svg)

## fork

![fork](https://rawgit.com/drom/elastic/master/img/fork.svg)

```js
t.ack = and(i[0].ack, i[1].ack, ..., i[n].ack)

i[0].ackr.next = and(i[0].ack, ~(i.ack))
i[1].ackr.next = and(i[1].ack, ~(i.ack))
...
i[n].ackr.next = and(i[n].ack, ~(i.ack))

i[0].req = and(t.req, ~(i[0].ackr))
i[1].req = and(t.req, ~(i[1].ackr))
...
i[n].req = and(t.req, ~(i[n].ackr))
```
