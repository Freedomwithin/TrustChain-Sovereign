# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Standalone Setup

This project is now a standalone UI repository.

### Prerequisites

- Node.js (v18+)
- Yarn or NPM

### Setup

1.  Clone the repository:
    ```bash
    git clone <repo-url>
    cd trustchain-frontend
    ```

2.  Install dependencies:
    ```bash
    yarn install
    # or
    npm install
    ```

3.  Configure Environment Variables:
    Copy `.env.example` to `.env` and fill in the required values.
    ```bash
    cp .env.example .env
    ```

    - `VITE_BACKEND_URL`: URL of the TrustChain Backend (e.g., `https://trustchain-backend.vercel.app`).
    - `SOLANA_RPC_URL`: Solana RPC Endpoint.
    - `TRUSTCHAIN_PROGRAM_ID`: The Program ID of the TrustChain Anchor program.
    - `NOTARY_SECRET`: (Server-side only) Secret key for the Notary wallet.

### Development

To start the development server:
```bash
yarn dev
```

### Build

To build for production:
```bash
yarn build
```
