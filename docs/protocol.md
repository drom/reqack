## Elastic protocol

### Rules

   * initiator agent drives `req` signal
   * target engine drives `ack` signal
   * `req & ack` = transaction
   * once initiator asserted `req` it has to stay `high` until target acknowledge it with `ack`
