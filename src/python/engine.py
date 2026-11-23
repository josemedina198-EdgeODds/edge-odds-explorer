"""OddsEdge: browser-executed Python analytics. No forecasts are guaranteed."""
import json
import math
import numpy as np

OUTCOMES = ('home', 'draw', 'away')
CAP = 0.25
_GRID = np.round(np.arange(0.1, 4.001, 0.05), 2)
_GOALS = np.arange(11)
_PMF = np.exp(-_GRID[:, None]) * _GRID[:, None] ** _GOALS / np.array([math.factorial(int(k)) for k in _GOALS])
_JOINT_HOME = _PMF @ np.tril(np.ones((11, 11)), -1) @ _PMF.T
_JOINT_DRAW = _PMF @ _PMF.T
_JOINT_AWAY = _PMF @ np.triu(np.ones((11, 11)), 1) @ _PMF.T
_TOTAL = _JOINT_HOME + _JOINT_DRAW + _JOINT_AWAY
_FIT = np.stack((_JOINT_HOME / _TOTAL, _JOINT_DRAW / _TOTAL, _JOINT_AWAY / _TOTAL), axis=2)


def distribution(lh, la):
    ph = np.array([math.exp(-lh) * lh ** int(k) / math.factorial(int(k)) for k in _GOALS])
    pa = np.array([math.exp(-la) * la ** int(k) / math.factorial(int(k)) for k in _GOALS])
    joint = np.outer(ph, pa)
    probs = np.array([np.tril(joint, -1).sum(), np.trace(joint), np.triu(joint, 1).sum()])
    probs /= probs.sum()
    hi, ai = np.unravel_index(np.argmax(joint), joint.shape)
    return dict(zip(OUTCOMES, map(float, probs))), {'home': int(hi), 'away': int(ai), 'p': float(joint[hi, ai])}


def kelly(p, odds):
    return min(CAP, max(0.0, (p * odds - 1) / (odds - 1))) if odds > 1 else 0.0


def analyze(inputs, teams, advantage):
    results = []
    hg = sum(t['home']['goalsFor'] for t in teams.values()) / sum(t['home']['played'] for t in teams.values())
    ag = sum(t['away']['goalsFor'] for t in teams.values()) / sum(t['away']['played'] for t in teams.values())
    for m in inputs:
        implied = {o: 1 / m['odds'][o] for o in OUTCOMES}
        overround = sum(implied.values())
        fair = {o: implied[o] / overround for o in OUTCOMES}
        strengths = {}
        if m.get('formKeys'):
            h = teams[m['formKeys']['home']]['home']
            a = teams[m['formKeys']['away']]['away']
            hs = {'attack': h['goalsFor'] / h['played'] / hg, 'defense': h['goalsAgainst'] / h['played'] / ag}
            aws = {'attack': a['goalsFor'] / a['played'] / ag, 'defense': a['goalsAgainst'] / a['played'] / hg}
            lh, la = hs['attack'] * aws['defense'] * hg * advantage, aws['attack'] * hs['defense'] * ag
            strengths = {'homeStrength': hs, 'awayStrength': aws}
            source = 'form'
        else:
            target = np.array([fair[o] for o in OUTCOMES])
            hi, ai = np.unravel_index(np.argmin(np.sum((_FIT - target) ** 2, axis=2)), _TOTAL.shape)
            lh, la = float(_GRID[hi]), float(_GRID[ai])
            source = 'market'
        probs, score = distribution(lh, la)
        labels = {'home': m['home']['name'], 'draw': 'Empate', 'away': m['away']['name']}
        rows = {o: {'outcome': o, 'code': ('1', 'X', '2')[i], 'label': labels[o], 'odds': m['odds'][o],
                    'modelProb': probs[o], 'marketProb': fair[o], 'edge': probs[o] - fair[o],
                    'ev': probs[o] * m['odds'][o] - 1, 'kelly': kelly(probs[o], m['odds'][o])}
                for i, o in enumerate(OUTCOMES)}
        results.append({'match': m, 'model': {'lambdaHome': lh, 'lambdaAway': la, 'probs': probs,
                        'mostLikelyScore': score, 'source': source, **strengths},
                        'market': {'implied': implied, 'fair': fair, 'overround': overround},
                        'outcomes': rows, 'best': max(OUTCOMES, key=lambda o: rows[o]['ev'])})
    return results


def simulate(opts):
    bankroll = max(0.0, float(opts['bankroll']))
    probs = np.array([opts['probs'][o] for o in OUTCOMES], dtype=float)
    probs /= probs.sum()
    odds = float(opts['odds'])
    fraction = min(CAP, max(0.0, float(opts['fraction'])))
    selected = opts['outcome']
    bets, sims = int(opts.get('bets', 100)), int(opts.get('sims', 1000))
    rng = np.random.default_rng(opts.get('seed', 20260918))
    outcomes = rng.choice(3, size=(sims, bets), p=probs)
    wins = outcomes == OUTCOMES.index(selected)
    multipliers = np.where(wins, 1 + fraction * (odds - 1), 1 - fraction)
    paths = np.concatenate((np.full((sims, 1), bankroll), bankroll * np.cumprod(multipliers, axis=1)), axis=1)
    peaks = np.maximum.accumulate(paths, axis=1)
    drawdowns = np.divide(peaks - paths, peaks, out=np.zeros_like(paths), where=peaks > 0).max(axis=1)
    finals = paths[:, -1]
    def quantile(k):
        return float(np.quantile(finals, k))
    counts, edges = np.histogram(finals, bins=12)
    return {'paths': paths[:40].tolist(), 'medianPath': np.median(paths, axis=0).tolist(), 'finals': finals.tolist(),
            'medianFinal': quantile(.5), 'p10Final': quantile(.1), 'p90Final': quantile(.9),
            'probProfit': float(np.mean(finals > bankroll + .000001)),
            'probLoss': float(np.mean(finals < bankroll - .000001)),
            'probEven': float(np.mean(np.abs(finals - bankroll) <= .000001)),
            'medianMaxDrawdown': float(np.median(drawdowns)), 'worstMaxDrawdown': float(drawdowns.max()),
            'bets': bets, 'sims': sims, 'outcomeCounts': {o: int(np.sum(outcomes == i)) for i, o in enumerate(OUTCOMES)},
            'histogram': [{'low': float(edges[i]), 'high': float(edges[i+1]), 'count': int(c)} for i, c in enumerate(counts)]}


def decision(opts):
    a, bank, selected, odds, fraction = opts['analysis'], float(opts['bankroll']), opts['outcome'], float(opts['odds']), float(opts['fraction'])
    stake = bank * fraction
    p = a['outcomes'][selected]['modelProb']
    ev = p * odds - 1
    weights = np.array(opts.get('weights', [40, 30, 30]), dtype=float)
    weights = weights / weights.sum() if weights.sum() else np.array([1/3, 1/3, 1/3])
    rows = []
    for o in OUTCOMES:
        oa = a['outcomes'][o]
        quoted = a['match'].get('bestOdds', {}).get(o, {}).get('odds', oa['odds']) if opts.get('useBest') else oa['odds']
        op = oa['modelProb']
        e = op * quoted - 1
        f = kelly(op, quoted) * .25
        # Dimensionless bounded utilities; weights are explicit preferences, not learned probabilities.
        utility = [min(1, max(0, (e + 1) / 2)), op, 1 - f]
        rows.append({'outcome': o, 'ev': e, 'prob': op, 'fraction': f, 'odds': quoted,
                     'score': float(np.dot(weights, utility) * 100)})
    rows.append({'outcome': 'none', 'ev': 0, 'prob': 1, 'fraction': 0, 'odds': 0,
                 'score': float(np.dot(weights, [.5, 1, 1]) * 100)})
    rows.sort(key=lambda x: x['score'], reverse=True)
    branches = [{'outcome': o, 'prob': a['outcomes'][o]['modelProb'],
                 'net': stake * (odds - 1) if o == selected else -stake,
                 'gross': stake * odds if o == selected else 0,
                 'final': bank + (stake * (odds - 1) if o == selected else -stake)} for o in OUTCOMES]
    return {'branches': branches, 'expectedNet': stake * ev, 'ev': ev, 'stake': stake,
            'canCompare': a['match'].get('bookmakerCount', 0) >= 2,
            'recommendation': 'evaluar' if ev > 0 and a['match'].get('bookmakerCount', 0) >= 2 else 'no_apostar',
            'ranking': rows, 'weights': (weights * 100).tolist()}


def dispatch(raw):
    payload = json.loads(raw)
    kind = payload['kind']
    if kind == 'analyze':
        result = analyze(payload['inputs'], payload['teams'], payload['advantage'])
    elif kind == 'simulate':
        result = simulate(payload['opts'])
    elif kind == 'decision':
        result = decision(payload['opts'])
    else:
        raise ValueError('Operación desconocida')
    return json.dumps(result, allow_nan=False)
