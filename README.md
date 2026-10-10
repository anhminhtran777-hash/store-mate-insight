# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

You need Node.js 20.19 or newer (Node 22 recommended) and npm.

```sh
cd stock-genie
npm install
npm run dev
```

Then open the address it prints, usually http://localhost:5173

### Windows: "running scripts is disabled on this system"

PowerShell blocks npm's own script file by default. Run this once in PowerShell,
answer `Y`, then run `npm install` again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Alternative: use Command Prompt (cmd) instead of PowerShell, or run `npm.cmd install`.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
