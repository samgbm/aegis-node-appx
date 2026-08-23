# Aegis Node

Local-first privacy guardian host. It runs on your laptop (WSL/Linux), announces itself on the [Hyperswarm](https://docs.pears.com/building-blocks/hyperswarm) DHT, and is built to pair with a mobile client over Pear/Holepunch — then run [QVAC](https://docs.qvac.tether.io/) inference and [WDK](https://docs.wdk.tether.io/) self-custodial settlement on-device, with no cloud.

**Pitch:** an autonomous, stateful privacy guardian that monitors wallet posture, flags dangerous approvals, and can act locally without leaking keys or prompts to a third-party API.

## Current status

Sprint 1 (WSL host node) is in place:

| Increment | What shipped |
| --- | --- |
| 1 | TypeScript + Jest CommonJS scaffold |
| 2 | Pino logging + Zod env validation |
| 3 | Hyperswarm host (server-only) on topic `aegis-health-bridge-v1` |
| 4–5 | Commander CLI + native `GET /healthz` |
| WDK hook | `@tetherto/wdk-cli` / `wdk-mcp` scripts and `initWDKAgent()` |

Not in this repo yet: Expo/Bare mobile app, QVAC model load, gasless WDK transfers.

## Official stack

Use these docs — do not invent SDK methods:

- WDK: [docs.wdk.tether.io](https://docs.wdk.tether.io/) · [Node.js / Bare quickstart](https://docs.wdk.tether.io/start-building/nodejs-bare-quickstart/) · [WDK CLI](https://docs.wdk.tether.io/cli) · [MCP server](https://docs.wdk.tether.io/cli/guides/use-mcp-server)
- Pear / Hyperswarm: [docs.pears.com](https://docs.pears.com/) · [Hyperswarm](https://docs.pears.com/building-blocks/hyperswarm)
- QVAC: [docs.qvac.tether.io](https://docs.qvac.tether.io/) · [JS/TS SDK](https://docs.qvac.tether.io/js-ts-sdk/) (`@qvac/sdk`)

## Prerequisites

- Node.js **18+** (WDK CLI documents **22.18+**)
- npm
- Network UDP access for the Hyperswarm DHT (port **49737** plus an ephemeral UDX port)

## Setup

```bash
git clone <this-repo>
cd aegis-node
npm install
cp .env.example .env   # optional; NODE_ENV defaults to development
```

`.env` is gitignored. Later increments will add `WDK_MNEMONIC`, RPC URLs, and paymaster keys there. Zod will fail fast if required vars are missing.

## Scripts

| Script | Command |
| --- | --- |
| `npm test` | Jest (ts-jest, CommonJS, `testEnvironment: node`) |
| `npm run dev` | `ts-node src/index.ts` — host daemon |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/index.js` |
| `npm run status` | Fetch `http://localhost:3000/healthz` |
| `npm run wdk` | Local [`wdk`](https://docs.wdk.tether.io/cli) CLI |
| `npm run mcp` | Local [`wdk-mcp`](https://docs.wdk.tether.io/cli/guides/use-mcp-server) stdio server |

The repo stays **CommonJS** (`"type": "module"` is not set) so Jest stays compatible before Pear/Bare ESM.

## Run the host

Terminal 1:

```bash
npm run dev
```

You should see Pino logs for env boot, topic announce, DHT flush, WDK hook, and the health server on port **3000**.

Terminal 2:

```bash
npm run status
```

Example:

```js
{
  status: 'ok',
  peers: 0,
  wdk: 'ready',
  connecting: 0,
  dhtHost: '…',
  firewalled: true
}
```

`peers` is `swarm.connections.size`. `firewalled: true` means HyperDHT needs holepunching (normal behind NAT).

Stop the daemon with Ctrl+C. It calls `swarm.destroy()` so DHT records do not go stale ([Pear troubleshooting](https://docs.pears.com/how-to/troubleshooting/)).

## Architecture

```
Samsung / Expo client          WSL or Linux host (this repo)
  Hyperswarm client  ──DHT──►  Hyperswarm server
  JSON ping/pong               GET /healthz :3000
                               WDK CLI / wdk-mcp (local daemon)
                               QVAC local inference (next)
```

| File | Role |
| --- | --- |
| [`src/config/env.ts`](src/config/env.ts) | `dotenv` + Zod (`NODE_ENV`) |
| [`src/utils/logger.ts`](src/utils/logger.ts) | Pino; `pino-pretty` in development; silent in test |
| [`src/swarm/index.ts`](src/swarm/index.ts) | SHA-256 topic → 32-byte buffer; `join({ server: true, client: false })`; `discovery.flushed()` |
| [`src/wdk-agent.ts`](src/wdk-agent.ts) | WDK CLI / MCP hook (QVAC tool-calling comes later) |
| [`src/index.ts`](src/index.ts) | Boot: swarm → WDK hook → `/healthz` |
| [`src/cli.ts`](src/cli.ts) | Commander `status` |

### Permalinks (core logic)

- Hyperswarm join + topic hash: [`src/swarm/index.ts`](src/swarm/index.ts)
- Health payload (peer count + WDK ready): [`src/index.ts`](src/index.ts)
- WDK agent hook: [`src/wdk-agent.ts`](src/wdk-agent.ts)

## Hyperswarm topic

Human-readable topic: **`aegis-health-bridge-v1`**

32-byte SHA-256 (what the DHT actually uses):

```
6a8b5054cae55dd76f625c78662790e6220bcab586bb3cfad7e3d3ae9e2499da
```

Mobile client must join **that buffer**, as a client:

```js
const topic = Buffer.from(
  '6a8b5054cae55dd76f625c78662790e6220bcab586bb3cfad7e3d3ae9e2499da',
  'hex',
)
swarm.join(topic, { server: false, client: true })
```

Do not SHA-256 the hex string again. First lookup can take 5–15 seconds.

## Mobile / WSL connectivity

A client on the **same machine** as the host can connect. A phone often cannot if the host runs in **WSL2 NAT** (`172.26.x.x`). The Samsung cannot route to that vNIC. `networkingMode=mirrored` in `.wslconfig` is **Windows 11 only**; on Windows 10 it is ignored.

Workarounds:

1. Run the host with **Windows Node** from a Windows path (e.g. `C:\samprojects\aegis-node`), `npm install` there so native UDP addons build for win32, then `npm run dev`. Bind to the LAN/Wi-Fi address (e.g. `192.168.1.8`).
2. Put the phone on the **same Wi-Fi** as the PC for the first connect.
3. Keep `npm run dev` running. An unhandled peer `ECONNRESET` used to kill the process; sockets now log the error and stay up.

## WDK CLI / MCP

Installed locally: `@tetherto/wdk-cli@1.0.0-beta.2` (`wdk`, `wdk-mcp`, `wdk-daemon`).

```bash
npm run wdk -- --version
# create/unlock a dedicated test wallet before MCP use
npm run wdk -- wallet create --name agent-dev --words 12
npm run wdk -- wallet unlock --name agent-dev --ttl 5
npm run mcp
```

`wdk-mcp` is a thin stdio MCP server; it does not hold keys itself. Unlock the wallet first. Use a **dev wallet with limited funds**. See the [official MCP guide](https://docs.wdk.tether.io/cli/guides/use-mcp-server).

## Tests

```bash
npm test
```

Suites: `tests/index.test.ts`, `tests/env.test.ts`, `tests/swarm.test.ts`, `tests/wdk-agent.test.ts`, `tests/cli.test.ts`. New behavior (QVAC, WDK send, Pear payloads) should add a Jest test before it ships.

## License

UNLICENSED / private hackathon project.
