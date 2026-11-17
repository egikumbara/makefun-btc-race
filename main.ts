// Patient SMA90 dip-buy mean-reversion bot for cbBTC (make.fun btc-race-24h).
//
// Idea: cbBTC mean-reverts to its slow trend after sharp pullbacks. The bot
// waits for a deep, confirmed dip below the 90-minute simple moving average,
// buys the full equity, and then waits patiently for the recovery to reach
// take-profit. No early exits, no filters that cut winners short: the edge is
// the rebound, so the bot lets the rebound run.
//
// Rules (all constants below are the only tuned numbers):
//   - ENTRY: no open position, and the latest close is at least 0.80% below
//     the 90-bar SMA of closes (a genuine dip, not intraday noise).
//   - EXIT (take-profit): the position's mark value is at least 1.90% above
//     its cost -> sell everything.
//   - EXIT (stop-loss): the position's mark value is at least 2.50% below
//     its cost -> sell everything.
//   - Sizing: 100% of available cash on every entry (one position at a time).
//   - Orders are protected by max_slippage_bps = 100; a rejected order is
//     simply re-sent on the next batch while the condition still holds.
//
// The strategy is deterministic: every decision is a pure function of the
// bars seen so far. No wall clock, no randomness, no network, no floats in
// the money path (take-profit / stop-loss are exact BigInt comparisons);
// the SMA is a rolling float sum, which is deterministic in IEEE 754.

import { runBars } from "./vendor/makefun-bars.ts";
import type { Bar, BotOrder, RunState } from "./vendor/makefun-bars.ts";

const SYMBOL = "CBBTC";

// Entry: close at least this many bps below the 90-bar SMA.
const DIP_BPS = 80;
// Take-profit: mark value at least this many bps above cost.
const TAKE_PROFIT_BPS = 190;
// Stop-loss: mark value at least this many bps below cost.
const STOP_LOSS_BPS = 250;
// Slippage guard on every order.
const MAX_SLIPPAGE_BPS = 100;
// Length of the slow moving average, in bars.
const SMA_LEN = 90;

// Rolling window of the last SMA_LEN closes, in micro-USDC (6 decimals),
// kept as plain numbers: the ratio close/SMA is unit-free, so the scale
// cancels out. The running sum makes each update O(1).
const closes: number[] = [];
let closeSum = 0;

function noteClose(bar: Bar): void {
  const c = Number(bar.c);
  closes.push(c);
  closeSum += c;
  if (closes.length > SMA_LEN) {
    closeSum -= closes.shift() as number;
  }
}

function sma(): number | null {
  if (closes.length < SMA_LEN) return null;
  return closeSum / SMA_LEN;
}

function decide(state: RunState): BotOrder[] {
  const held = state.positions.get(SYMBOL);
  const avg = sma();

  if (held && held.qty > 0n) {
    // We are holding: only the two exits can fire, and only once each.
    const value = state.value(SYMBOL, held.qty);
    const cost = held.cost;
    if (cost > 0n) {
      if (value * 10000n >= cost * BigInt(10000 + TAKE_PROFIT_BPS)) {
        return [{ side: "sell", symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      if (value * 10000n <= cost * BigInt(10000 - STOP_LOSS_BPS)) {
        return [{ side: "sell", symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
    }
    return [];
  }

  // Flat: look for the dip.
  if (avg === null) return [];
  const latest = closes[closes.length - 1];
  if (latest < avg * (1 - DIP_BPS / 10000)) {
    const cash = state.cash;
    if (cash >= 1000000n) {
      return [{ side: "buy", symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
  }
  return [];
}

runBars({
  onBatch(state, batch) {
    for (const bar of batch.bars) noteClose(bar);
    return decide(state);
  },
});
