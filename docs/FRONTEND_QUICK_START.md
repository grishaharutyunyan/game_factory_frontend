# Frontend WebSocket Improvements: Quick Start Guide

## 5-Step Implementation

### STEP 1: Create Type Definitions (10 min)
**File**: `types/websocket.ts`

Copy the `ServerEvents` and `ClientEvents` types from the full guide.

Key types:
- `ServerEvents` — Events server sends to client
- `ClientEvents` — Events client sends to server
- `ConnectionState` — "disconnected" | "connecting" | "connected" | "error"
- `GameWebSocketClient` — Main client interface

### STEP 2: Create Enhanced Client (20 min)
**File**: `lib/websocket-client.ts`

Replace your current client with the improved version. Key additions:
- Connection state tracking (`connectionState`)
- Active round tracking (`activeRoundId`)
- Error tracking (`lastError`)
- Timeout protection (`emitWithTimeout`)
- Auto-reconnection handling
- Event listener cleanup

### STEP 3: Create React Hook (15 min)
**File**: `hooks/useGameWebSocket.ts`

Provides:
- `client` — The WebSocket client
- `connectionState` — Current connection status
- `lastError` — Last error that occurred
- `isConnected` — Boolean connected status
- Auto-cleanup on unmount
- Auto-connect on mount

### STEP 4: Update Your Game Component (15 min)
Replace your current WebSocket setup with:

```typescript
"use client";

import { useGameWebSocket } from "@/hooks/useGameWebSocket";

export function GameComponent() {
  const { client, connectionState, isConnected } = useGameWebSocket({
    apiKey: process.env.NEXT_PUBLIC_GAME_API_KEY!,
    enabled: true,
    onConnected: () => console.log("Connected"),
    onDisconnected: () => console.log("Disconnected"),
    onError: (error) => console.error("Error:", error),
  });

  const [balance, setBalance] = useState(0);

  // Setup listeners
  useEffect(() => {
    if (!client) return;

    client.on("connected", (data) => {
      setBalance(data.balance);
    });

    client.on("game_started", (data) => {
      console.log("Game started:", data.roundId);
    });

    client.on("game_result", (data) => {
      setBalance(data.newBalance);
    });

    // Handle auto-resolved games (TASK 10)
    client.on("round_auto_resolved", (data) => {
      console.warn("Game auto-resolved:", data.message);
    });

    return () => {
      client.off("connected");
      client.off("game_started");
      client.off("game_result");
      client.off("round_auto_resolved");
    };
  }, [client]);

  // Start game with error handling
  const startGame = async () => {
    if (!isConnected) {
      console.error("Not connected");
      return;
    }

    try {
      await client!.startGame({ bet: 100 });
    } catch (error) {
      const lastError = client!.getLastError();
      console.error("Start game failed:", lastError?.message);
    }
  };

  return (
    <div>
      <p>Status: {connectionState}</p>
      <p>Balance: {balance}</p>
      <button onClick={startGame} disabled={!isConnected}>
        Start Game
      </button>
    </div>
  );
}
```

### STEP 5: Test (10 min)

Test scenarios:
1. ✅ Connect and receive initial state
2. ✅ Start game and handle success
3. ✅ Send game actions
4. ✅ Finish game
5. ✅ Simulate disconnection and verify reconnection
6. ✅ Simulate error and verify error handling
7. ✅ Auto-resolved game (from TASK 10)

---

## Migration From Old Code

### Old Code Pattern
```typescript
client.on('game_started', (data) => {
  console.log('Started');
});

client.emit('start_game', { bet: 100 });
```

### New Code Pattern
```typescript
// Setup listeners (in useEffect)
client.on('game_started', (data) => {
  console.log('Started');
});

// Emit with error handling (async/await)
try {
  await client.startGame({ bet: 100 });
} catch (error) {
  console.error('Failed:', error);
}
```

**Main differences**:
- ✅ Use `await` instead of fire-and-forget
- ✅ Use `client.startGame()` instead of `client.emit('start_game')`
- ✅ Use `try/catch` for error handling
- ✅ Use `.getLastError()` for error details

---

## Most Important Changes

### 1. Error Handling (NEW)
```typescript
// Old: Silent failures
client.emit('start_game', { bet: 100 });

// New: Proper error handling
try {
  await client.startGame({ bet: 100 });
} catch (error) {
  const lastError = client.getLastError();
  // { code: 'START_GAME_FAILED', message: '...' }
  showErrorToast(lastError.message);
}
```

### 2. Connection State (NEW)
```typescript
// Old: No way to know connection status
if (connectionState === 'connected') {
  canPlayGame = true;
} else if (connectionState === 'reconnecting') {
  showReconnectingMessage();
} else if (connectionState === 'error') {
  showErrorMessage();
}
```

### 3. Active Game Tracking (NEW)
```typescript
// Old: You had to track this manually
const [roundId, setRoundId] = useState(null);
client.on('game_started', (data) => setRoundId(data.roundId));

// New: Built-in
const roundId = client.getActiveRoundId();
if (!roundId) console.log('No active game');
```

### 4. Timeout Protection (NEW)
```typescript
// Old: Could hang forever
client.emit('start_game', { bet: 100 });

// New: 30s timeout (auto-fails if no response)
try {
  await client.startGame({ bet: 100 });
} catch (error) {
  // Could be timeout
  if (client.getLastError()?.message.includes('timeout')) {
    console.log('Server not responding');
  }
}
```

### 5. Auto-Reconnection (NEW)
```typescript
// Old: Manual reconnection
// New: Automatic
// If disconnected, client auto-reconnects with exponential backoff
// Max 5 attempts, then shows error
```

### 6. Auto-Resolved Games Handling (NEW - TASK 10)
```typescript
// New: Handle games auto-resolved by server
client.on('round_auto_resolved', (data) => {
  // Game was orphaned > 30 min, bet refunded
  showToast(`Game refunded: ${data.newBalance} coins`);
  resetGameUI();
});
```

---

## File Structure

```
src/
├── types/
│   └── websocket.ts           ← NEW: Event types
├── lib/
│   └── websocket-client.ts    ← REPLACE: Enhanced client
├── hooks/
│   └── useGameWebSocket.ts    ← NEW: React hook
└── components/
    └── GameComponent.tsx      ← UPDATE: Use new hook
```

---

## Copy-Paste Checklist

- [ ] Created `types/websocket.ts`
- [ ] Replaced `lib/websocket-client.ts`
- [ ] Created `hooks/useGameWebSocket.ts`
- [ ] Updated game component to use hook
- [ ] Added error handling to game operations
- [ ] Added `round_auto_resolved` listener (from TASK 10)
- [ ] Tested all 7 scenarios above
- [ ] Removed old WebSocket setup code

---

## Common Mistakes

❌ **Mistake 1**: Forget `await` on game operations
```typescript
client.startGame({ bet: 100 }); // Wrong
await client.startGame({ bet: 100 }); // Correct
```

❌ **Mistake 2**: Don't clean up listeners in useEffect
```typescript
useEffect(() => {
  client.on('game_started', handler);
  // Missing return cleanup!
}, [client]);

// Fix:
useEffect(() => {
  client.on('game_started', handler);
  return () => client.off('game_started', handler); // ← Add this
}, [client]);
```

❌ **Mistake 3**: Check `isConnected` but don't handle reconnecting state
```typescript
if (!isConnected) {
  return <Error />; // Wrong, shows error during reconnect
}

// Better:
if (connectionState === 'error') {
  return <ErrorMessage />;
} else if (connectionState === 'reconnecting') {
  return <ReconnectingMessage />;
}
```

❌ **Mistake 4**: Ignore timeout errors
```typescript
try {
  await client.startGame({ bet: 100 });
} catch (error) {
  // Just log, don't handle timeout specially
}

// Better:
if (error.message.includes('timeout')) {
  showToast('Server not responding, please try again');
} else {
  showToast('Game start failed: ' + error.message);
}
```

❌ **Mistake 5**: Not handling `round_auto_resolved` from TASK 10
```typescript
// Must listen for auto-resolved games
client.on('round_auto_resolved', (data) => {
  // Your game was closed after 30+ min inactivity
  // Money was refunded: data.newBalance
});
```

---

## Testing Checklist

Run these tests after implementation:

### Unit Tests
```typescript
// Test error handling
const client = createWebSocketClient({...});
expect(async () => {
  await client.startGame({ bet: -100 }); // Invalid bet
}).rejects.toThrow();

// Test timeout
// (This requires mocking socket delay)

// Test active round tracking
client.socket.emit('game_started', { roundId: 'r1' });
expect(client.getActiveRoundId()).toBe('r1');
```

### Integration Tests
1. **Connection**: Connect → receive 'connected' event → check balance
2. **Start game**: Send `startGame` → receive `game_started` → roundId set
3. **Game action**: Send `gameAction` → receive `action_result`
4. **Finish game**: Send `finishGame` → receive `game_result` → roundId cleared
5. **Disconnect & Reconnect**: Disconnect → wait → auto-reconnects
6. **Error handling**: Simulate error → check error code + message
7. **Auto-resolved**: Simulate `round_auto_resolved` → game cleared

### Manual Tests
1. Open DevTools → Network tab
2. Watch WebSocket messages
3. Trigger each game operation
4. Verify each produces correct event sequence
5. Disconnect network → watch reconnection
6. Restore network → verify game continues

---

## Performance Notes

- **Memory**: Listeners auto-cleaned on unmount ✓
- **Network**: Reconnection uses exponential backoff (not hammering server) ✓
- **CPU**: Minimal overhead, all async ✓
- **Bundle size**: ~2KB gzipped for new code

---

## Backward Compatibility

The new client is **fully backward compatible** with the old one:

```typescript
// Old code still works
client.on('game_started', handler);
client.emit('start_game', { bet: 100 });

// New code coexists
await client.startGame({ bet: 100 });
```

You can migrate incrementally — don't need to replace everything at once.

---

## Summary

| Feature | Old | New | Impact |
|---------|-----|-----|--------|
| Error handling | None | Full | Prevents silent failures |
| Reconnection | Manual | Auto | Better user experience |
| Timeout | None | 30s | Prevents hung requests |
| Type safety | Partial | Full | Fewer runtime errors |
| Setup | Manual | Hook | Cleaner React code |
| Cleanup | Manual | Auto | No memory leaks |
| Active game | Manual | Tracked | Simpler logic |
| Total time to implement | — | 1 hour | Production ready |

**Start with STEP 1 → can deploy working client in 1 hour!** 🚀
