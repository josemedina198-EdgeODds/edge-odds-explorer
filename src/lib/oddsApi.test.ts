import { describe, expect, it } from 'vitest';
import { mapEvents } from './oddsApi';

describe('real bookmaker quote aggregation', () => {
  it('preserves all valid decimal prices, partial houses, timestamps and best prices', () => {
    const timestamp = '2026-11-23T12:00:00Z';
    const result = mapEvents([{ id: 'future', sport_key: 'soccer_epl', sport_title: 'Premier League', commence_time: '2099-01-01T00:00:00Z', home_team: 'H', away_team: 'A', bookmakers: [
      { key: 'one', title: 'One', last_update: timestamp, markets: [{ key: 'h2h', outcomes: [{ name: 'H', price: 2 }, { name: 'Draw', price: 3 }, { name: 'A', price: 4 }] }] },
      { key: 'two', title: 'Two', last_update: timestamp, markets: [{ key: 'h2h', outcomes: [{ name: 'H', price: 2.5 }, { name: 'Draw', price: 3.5 }, { name: 'A', price: 5 }] }] },
      { key: 'partial', title: 'Partial', markets: [{ key: 'h2h', outcomes: [{ name: 'A', price: 100 }] }] },
    ] }]);
    const match = result[0];
    expect(match?.bookmakerCount).toBe(3);
    expect(match?.odds.home).toBe(2.25);
    expect(match?.odds.draw).toBe(3.25);
    expect(match?.odds.away).toBe(5);
    expect(match?.bestOdds?.away).toEqual({ odds: 100, book: 'Partial' });
    expect(match?.bookmakers?.[0]?.updatedAt).toBe(timestamp);
    expect(match?.bookmakers?.[2]?.odds.home).toBeUndefined();
  });
});
