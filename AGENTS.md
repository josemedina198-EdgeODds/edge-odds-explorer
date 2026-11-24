<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Analytics architecture
- Run displayed match probabilities, simulations, decision branches and multicriteria scores through the Python/NumPy engine in a browser Web Worker with Pyodide; this provides actual Python execution without a server or changing the required TanStack framework.
- Infer live probabilities directly from fair market odds without artificial shrinkage or home tilts; a market-derived estimate is not an independently validated forecasting edge.
- Preserve each returned bookmaker's decimal prices and timestamp, and never infer private odds or bookmaker availability; comparison uses the provider response, not scraped or invented prices.
- Automatic odds refresh is opt-in, visible-tab-only and quota-limited; cache scores separately to avoid paying for them every minute.
