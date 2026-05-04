# WebSocket balance types (REAL / BONUS)

This document describes the **game service frontend** WebSocket contract changes that allow a user to **switch between REAL and BONUS balances**, and ensures **bets/wins are processed against the selected balance type**.

## Summary of the model

See “Balance snapshot (shared fields)” above. The key concept is that a session always has both `realBalance` and `bonusBalance`, while `balance` mirrors whichever one is selected by `activeBalanceType`.

## Init (gRPC) change

`InitGameRequest` now supports:

- **`balance`**: real balance (existing)
- **`bonus_balance`**: bonus balance (new)

The session will be created with both balances and an `activeBalanceType` (defaulting to `REAL` when possible).

## WebSocket connection

### Handshake

Connect with `session` query param (unchanged):

- `ws://<host>?session=<sessionId>`

### Server → client: `connected`

Emitted on successful connection.

Payload:

```json
{
  "balance": 1000,
  "realBalance": 1000,
  "bonusBalance": 250,
  "activeBalanceType": "REAL",
  "userId": "user_1",
  "gameId": "card-game",
  "config": { "minBet": 10, "maxBet": 10000, "...": "..." }
}
```

## Starting a game (placing a bet)

### Client → server: `start_game`

`balanceType` is **optional**:

- If provided, the bet is placed from that balance type.
- If omitted, the bet uses the session `activeBalanceType`.

Payload:

```json
{
  "bet": 50,
  "balanceType": "REAL"
}
```

Freebet remains supported:

```json
{
  "bet": 50,
  "freeBet": true,
  "freebetGrantId": "uuid-optional",
  "balanceType": "BONUS"
}
```

### Server → client: `game_started`

Payload includes updated balances:

```json
{
  "roundId": "round_...",
  "balance": 950,
  "realBalance": 950,
  "bonusBalance": 250,
  "activeBalanceType": "REAL",
  "...gameSpecificData": {}
}
```

## Finishing a game (crediting a win)

### Client → server: `finish_game`

No payload (unchanged).

### Server → client: `game_result`

Payload includes updated balances:

```json
{
  "result": "WIN",
  "winAmount": 100,
  "message": "....",
  "newBalance": 1050,
  "realBalance": 1050,
  "bonusBalance": 250,
  "activeBalanceType": "REAL",
  "...gameSpecificData": {}
}
```

## Switching balance type (NEW)

### Client → server: `switch_balance`

Payload:

```json
{
  "balanceType": "BONUS"
}
```

### Server → client: `balance_switched`

Payload:

```json
{
  "balance": 250,
  "realBalance": 1000,
  "bonusBalance": 250,
  "activeBalanceType": "BONUS"
}
```

## Callback service (backend) balance type routing

Bet/win callbacks now include a typed enum:

- **`BalanceType.REAL`**
- **`BalanceType.BONUS`**

This ensures backend can debit/credit the correct ledger based on where the bet was placed.

