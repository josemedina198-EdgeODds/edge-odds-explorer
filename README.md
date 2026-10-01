# Edge Match Pro

Build a complete, production-style web app for a sports analytics platform called "Edge Analytics". The product compares the user's own model probabilities for football match outcomes against the implied probabilities from betting odds, and visualizes expected value and optimal staking. The front must look premium and polished; the internal system must actually perform all the decision-making calculations in the browser. Do NOT display any academic concepts, formulas, or theory on the page — the product should just work, with no university references and no explanatory theory text.

Design system: Strict neutral color theory — near-black backgrounds (#0A0A0B), off-white text (#F5F5F4), layered grays for cards, borders, and secondary text. No pastels. One restrained accent only: muted emerald (#10B981 or similar) for positive EV / primary actions, and a muted red for negative EV. Clean sans-serif (Inter), generous whitespace, subtle borders, premium editorial data-driven feel. Responsive desktop/mobile. .

Data (static, embedded in the app): Include a small dataset of 4–6 sample football matches with: team names, each team's recent goals scored and conceded (e.g., last 5–10 matches,, home/away split,, and market odds for 1 (home win), X (draw), 2 (away win).. Use realistic odds values. All data lives in a static JSON structure at the top of the code so it's easy to replace with real historical data later. .

Internal system — implement all of this in JavaScript/React (client-side, no backend):

Probability model (Poisson): From each team's goals for/against per match, compute attack strength and defense strength relative to league average;; apply a home advantage factor;; derive expected goals (lambda) for home and away;; compute P(0..N goals) via Poisson formula for each team;; build the 1X2 outcome probabilities (home win, draw, away win) from the joint distribution. Normalize if needed.

. Market implied probability: For each outcome, take 1/odds. Then normalize the three values by their sum to remove the bookmaker margin (overround), producing the "fair" market probability per outcome. .

. Comparison: For each match, show grouped bars per outcome: "Tu modelo" vs "Mercado". Highlight where your model exceeds the market (edge).

. Expected value: For each outcome: EV per 1 unit staked = (your_probability × odds) − 1. Tag each outcome with its EV;; positive EV in emerald, negative in muted red. Sort or highlight the best-value outcome per match. .

. Kelly criterion: For the selected outcome, compute the optimal fraction: f* = (p × (odds − 1)) − (1 − p)) / (odds − 1), clamped between 0 and 0.25 (quarter Kelly for safety). Show the suggested stake given the user's bankroll (slider 0–1000, default 100).

. Monte Carlo simulation: Simulate ~1000 repeated bets following the Kelly stake on the selected outcome with the model probability, plotting the distribution of final bankroll (or a few sample paths) in a small line chart. Show key stats: median final bankroll, probability of profit, max drawdown. All computed in-browser-. . . UI structure — 6 sections: . Header/Nav: Logo left;; nav: Partidos, Comparador, Valor Esperado, Calculadora, Referencias;; "Iniciar sesión" button right (non-functional). . Hero: Headline "Encuentra el valor donde el mercado no lo ve." Subheadline: the platform that compares your probability model against market odds to find positive expected value. Buttons: "Ver partidos" (scrolls to matches) and "Cómo funciona" (opens a small non-academic 3-step explainer: datos → modelo → decisión,, no formulas, no theory). 3. Partidos (match cards): 4–6 cards, each with team names, small crest placeholders, a "1 X 2" row of three clickable outcome buttons showing the odds (e.g., 1.85 / 3.40 / 4.20),, and an EV tag per outcome (green/red). Clicking an outcome selects it for the comparison and calculator sections-.-.

. Comparador: Grouped bar chart "Tu modelo" vs "Mercado" for the selected match's three outcomes, drawn with CSS/SVG or a lightweight chart lib. Below: "Analizar partido" button that updates the chart from the model.

. Valor Esperado: A small table/cards listing each outcome with model probability, market probability, odds,, and EV,, highlighting the best positive-EV option-.-.

. Calculadora: Interactive panel: bankroll slider (and number input,, suggested Kelly stake in large type,, and a Monte Carlo line chart of simulated bankroll paths with stats (median final,, prob. of profit.. All live-computed on slider change-.-.-.
Use the embedded dataset as the single source of truth;; all numbers on the page come from the calculations above,, never hard-coded displays. Keep the copy product-focused-and clean — no formulas,, no academic terminology beyond what a user would see in a betting app (probabilidad,, cuota,, valor esperado are fine as labels),, no university or course references anywhere-.-.-.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://edge-odds-explorer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0ceb2581-788d-485d-ad74-e927462b82e4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
