# Store Mate Insight

Build a website for inventory management called StockPilot for small convenience stores.

Use a professional dark-green and off-white design. Login page: Email and password fields, web logo, and a demo login option.

Main workspace:

A floating inventory sidebar on the left that appears when hovering near the left edge, with a pin button to keep it open.

A searchable product list showing names, categories, quantities, and low-stock warnings.

When a product is selected, display its details on the right, including current stock, price, cost, and supplier.

Show three charts covering the last six months: stock levels, stock received versus sold, and inventory value.

Add buttons to create, edit, receive stock for, and archive products.

Include navigation for Dashboard, Inventory, AI Assistant, Purchase Orders, Activity Log, and Settings.

The AI Assistant should help summarize inventory trends and recommend which products to reorder.

The Activity Log should show who changed stock, what changed, and when.

Make the prototype interactive with realistic convenience-store demo data. Product selection, stock changes, navigation, and draft order approval should work and update the interface consistently.

Use React and TypeScript. Keep the code organized so we can later embed the frontend in a C# Windows application using WebView2.

For now, use simulated AI responses and local demo data. Do not require external APIs or a database yet.

Prioritize a polished desktop layout and a working demo flow over extra features.

Please also make it so different categories of stocks are displayed with different colors that could correspond the closest to them. Along with that make it so when the charts are going down it'd be displayed with red.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb073198-bdcd-4c73-b82f-4dde0ce22937).

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
