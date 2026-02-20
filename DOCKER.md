# Docker (production)

## Build

```bash
docker build -t game-factory-frontend .
```

## Run

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SOCKET_URL=https://your-ws.example.com \
  -e NEXT_PUBLIC_GAME_API_KEY=your-api-key \
  game-factory-frontend
```

## Docker Compose

```bash
# Build and start
docker compose up -d

# With env file
echo "NEXT_PUBLIC_SOCKET_URL=https://your-ws.example.com" >> .env
echo "NEXT_PUBLIC_GAME_API_KEY=your-api-key" >> .env
docker compose up -d
```

App will be at **http://localhost:3000**. Game URL: `/games/card-game?session=...`
