import unittest
import engine

class EngineRules(unittest.TestCase):
    def setUp(self):
        self.analysis = {'model': {'probs': {'home': .5, 'draw': .3, 'away': .2}},
            'match': {'bookmakerCount': 2, 'odds': {'home': 2.5, 'draw': 3, 'away': 4}},
            'outcomes': {o: {'modelProb': p, 'odds': odds} for o, p, odds in [('home', .5, 2.5), ('draw', .3, 3), ('away', .2, 4)]}}
    def decision(self, outcome='home', **extra):
        return engine.decision({'analysis': self.analysis, 'bankroll': 100000, 'outcome': outcome, 'odds': 2.5,
                                'fraction': .1, 'weights': [40, 30, 30], **extra})
    def test_decimal_odds_cop_return_and_net(self):
        d = self.decision()
        win = next(b for b in d['branches'] if b['outcome'] == 'home')
        self.assertEqual(d['stake'], 10000)
        self.assertEqual(win['gross'], 25000)
        self.assertEqual(win['net'], 15000)
        self.assertEqual(win['final'], 115000)
    def test_draw_loses_when_home_selected(self):
        b = next(b for b in self.decision()['branches'] if b['outcome'] == 'draw')
        self.assertEqual(b['gross'], 0)
        self.assertEqual(b['net'], -10000)
        self.assertEqual(b['final'], 90000)
    def test_away_loses_when_home_selected(self):
        b = next(b for b in self.decision()['branches'] if b['outcome'] == 'away')
        self.assertEqual(b['net'], -10000)
    def test_selected_draw_can_win(self):
        b = next(b for b in self.decision('draw')['branches'] if b['outcome'] == 'draw')
        self.assertEqual(b['net'], 15000)
    def test_expected_value_includes_three_outcomes(self):
        d = self.decision()
        self.assertEqual(d['ev'], .25)
        self.assertEqual(d['expectedNet'], 2500)
        self.assertAlmostEqual(sum(b['net'] * b['prob'] for b in d['branches']), 2500)
    def test_kelly_cap_and_quarter(self):
        self.assertEqual(engine.kelly(.9, 2), .25)
        self.assertEqual(engine.kelly(.9, 2) * .25, .0625)
        self.assertEqual(engine.kelly(.2, 2), 0)
    def test_multicriteria_normalizes_and_includes_no_bet(self):
        d = self.decision(weights=[10, 10, 10])
        self.assertAlmostEqual(sum(d['weights']), 100)
        self.assertEqual(len(d['ranking']), 4)
        self.assertIn('none', [r['outcome'] for r in d['ranking']])
        d2 = self.decision(weights=[0, 0, 0])
        self.assertAlmostEqual(sum(d2['weights']), 100)
    def test_no_bet_if_negative_value(self):
        self.assertEqual(self.decision(odds=1.5)['recommendation'], 'no_apostar')
    def test_default_monte_carlo_and_all_outcomes(self):
        s = engine.simulate({'bankroll': 100000, 'probs': {'home': .5, 'draw': .3, 'away': .2}, 'outcome': 'home', 'odds': 2.5, 'fraction': .01})
        self.assertEqual(s['sims'], 1000)
        self.assertEqual(s['bets'], 100)
        self.assertEqual(sum(s['outcomeCounts'].values()), 100000)
        self.assertTrue(all(v > 0 for v in s['outcomeCounts'].values()))
        self.assertEqual(sum(b['count'] for b in s['histogram']), 1000)
        self.assertAlmostEqual(s['probProfit'] + s['probLoss'] + s['probEven'], 1)
    def test_zero_stake_keeps_bankroll(self):
        s = engine.simulate({'bankroll': 100000, 'probs': {'home': .5, 'draw': .3, 'away': .2}, 'outcome': 'home', 'odds': 2.5, 'fraction': 0})
        self.assertEqual(s['medianFinal'], 100000)
        self.assertEqual(s['probEven'], 1)
        self.assertEqual(s['probLoss'], 0)
        self.assertEqual(s['medianMaxDrawdown'], 0)
    def test_no_artificial_market_tilt(self):
        probs, _ = engine.distribution(1.45, 1.15)
        fair = {o: 1 / probs[o] for o in engine.OUTCOMES}
        match = {'id': 'test', 'home': {'name': 'H'}, 'away': {'name': 'A'}, 'odds': fair}
        team = {'home': {'goalsFor': 5, 'played': 5}, 'away': {'goalsFor': 5, 'played': 5}}
        a = engine.analyze([match], {'t': team}, 1.08)[0]
        self.assertAlmostEqual(a['model']['lambdaHome'], 1.45)
        self.assertAlmostEqual(a['model']['lambdaAway'], 1.15)
        self.assertAlmostEqual(sum(a['model']['probs'].values()), 1)
        for o in engine.OUTCOMES: self.assertAlmostEqual(a['outcomes'][o]['ev'], 0, places=10)

if __name__ == '__main__': unittest.main()
