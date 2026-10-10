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

## StockPilot architecture
- Keep demo data and pure inventory transitions in the StockPilot model module, separate from views, so a future WebView2 host can replace the data adapter without changing UI behavior.
- Share session-only demo state through a provider above the router outlet so product changes, orders, charts, and activity remain consistent across navigation.
- Use separate leaf routes for workspace views and login so navigation is typed and every shareable view has specific metadata.
- Use AI Elements for the simulated assistant conversation and composer; responses are computed locally with no server or API dependency.
- Keep daily subdivisions and period aggregation in a pure chart-data adapter; sum received/sold flows and use closing stock/value, so chart views stay consistent without changing inventory transitions or inventing unavailable history.
- Keep appearance in a session-only provider above the outlet and apply themes through global semantic CSS tokens so navigation and dialogs retain the same theme without changing inventory data.
- Signal good/bad with the dedicated up/down color tokens rather than the theme accent, so positive and negative readings stay green and red in every theme.
- Render document previews and printouts from the same DocumentSheet with separate receipt and supplier layouts; show only recorded information so print and archive views stay consistent without fabricating invoice details.
