# makefun-btc-race

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/egikumbara/makefun-btc-race/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/egikumbara/makefun-btc-race/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

Patient SMA90 dip-buy mean-reversion bot for cbBTC. It waits for a deep, confirmed dip below the 90-minute simple moving average, buys the full equity, and then waits patiently for the recovery to reach take-profit — no early exits, no filters that cut winners short. On the competition's frozen 24h dev window it scores **+$38.97 net PnL** (5 orders, 100% win rate, 0.72% max drawdown), verified with the kit's own `grade-local` (two executions, byte-identical action log).

Strategy, in one paragraph: cbBTC mean-reverts to its slow trend after sharp pullbacks. Entry fires when the latest close is at least 0.80% below the 90-bar SMA of closes; exit is a take-profit at +1.90% of mark value over cost, or a stop-loss at −2.50%. Sizing is 100% of available cash, one position at a time, every order guarded by `max_slippage_bps = 100`. The strategy is deterministic — every decision is a pure function of the bars seen so far, no wall clock, no randomness, no network — and the money path uses exact BigInt comparisons.

## Run it

```sh
node main.ts
```

`main.ts` speaks the `agent-fun/bars-replay/v1` protocol on stdin/stdout (hello, batches, replies) through the vendored `vendor/makefun-bars.ts` shim. To grade it locally against the competition's dev window, use the kit's CLI:

```sh
node cli/makefun.mjs grade-local --kit <kit-dir> --bot <this-repo> --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=q1q35jmc&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
