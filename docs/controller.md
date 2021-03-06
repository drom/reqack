# Handshake controllers

## Node controllers

Elastic controllers for the graph nodes.

### join

Node with multiple target sockets and one initiator socket.

![reduce](../img/reduce.svg)
![reduce](../img/join.svg)

```js
i.req = and(t[0].req, t[1].req, ..., t[n].req)

t[0].ack = and(i.ack, and(1,        t[1].req, ..., t[n].req))
t[1].ack = and(i.ack, and(t[0].req, 1,        ..., t[n].req))
...
t[n].ack = and(i.ack, and(t[0].req, t[1].req, ..., 1       ))
```

### fork

Node with one target socket and multiple initiator sockets.

#### Lazy fork

#### Eager fork

![fork](../img/fork.svg)
![fork](../img/eager_fork.svg)

```js
i[0].acks = or(i[0].ack, ~(i[0].req))
i[1].acks = or(i[1].ack, ~(i[1].req))
...
i[n].acks = or(i[n].ack, ~(i[n].req))

i[0].ackr.next = and(i[0].acks, ~(t.ack))
i[1].ackr.next = and(i[1].acks, ~(t.ack))
...
i[n].ackr.next = and(i[n].acks, ~(t.ack))

i[0].req = and(t.req, ~(i[0].ackr))
i[1].req = and(t.req, ~(i[1].ackr))
...
i[n].req = and(t.req, ~(i[n].ackr))

t.ack = and(i[0].acks, i[1].acks, ..., i[n].acks)
```

### MIMO

Node with multiple inputs and multiple outputs. MIMO Controller is
composed from join and fork controllers.

## Edge controllers

Each digraph edge (channel) holds set of properties important for
controller connectivity or controller logic:
 * **tail** (Integer | String) ID of the initiator socket of the sender node.
 * **head** (Integer | String) ID of the target socket of the receiver node.
 * **EB** (Number) KIND of the controller to use for the edge.

### EB:0

Asynchronous edge. Wire line controller.

 * Latency: 0
 * Capacity: 0

### EB:1

Edge with the 1-entry elastic buffer.

  * Latency: 1
  * Capacity: 1

**Warning:** *Controller propagates "backpressure" asynchronously.*

![EB1](../img/eb1.svg)

```js
t.ack = ~i.req | i.ack;

i.dat.next = t.dat;
i.dat.enable = t.req & t.ack;

i.req.next = (~t.ack | t.req);
```

## EB:1.5

Edge with 2-entry elastic buffer. This controller type has synchronous
"backpressure" propagation.

  * Latency: 1
  * Capacity: 1
  * Stall Capacity: 2

![EB2](../img/eb1.5.svg)

```js
fsm(state.next, {
    S0: { S6: t.req },
    S6: {
        S0: (~t.req & i.ack),
        S2: (t.req & ~i.ack),
        S1: (t.req & i.ack)
    },
    S2: { S1: i.ack },
    S1: {
        S0: (~t.req & i.ack),
        S3: (t.req & ~i.ack),
        S6: (t.req & i.ack)
    },
    S3: { S6: i.ack }
})

sel = ((state == S3) | (state == S4))

dat0.enable = ((state == S0) | (state == S3)) & t.req
dat1.enable =  (state == S1)                & t.req

t.ack = ~((state == S2) | (state == S4));

i.req = ~(state == S0);

i.dat = sel ? dat1 : dat0;

dat0.next = t.dat;
dat1.next = t.dat;

```

# EB:N.5

Queue.

# Burbulator
