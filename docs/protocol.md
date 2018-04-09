## Elastic protocol

### Rules

   * initiator agent drives `req` and `dat` signals
   * target agent drives `ack` signal
   * `req & ack` = transaction
   * once initiator asserted `req` it has to stay `high` until target acknowledge it with `ack`
