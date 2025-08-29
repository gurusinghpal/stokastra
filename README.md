# Stokastra - Fixed Vite React Project

This is a complete Vite + React + Tailwind-ready project for the Stokastra dashboard.

How to run:

1. Extract the ZIP.
2. In the project folder run:

```bash
npm install
npm run dev
```

Notes:
- The project uses Yahoo Finance public endpoints for quotes and charts.
- TradingView mini widgets load from s3.tradingview.com for the 'All Markets' grid.
- If you see PowerShell execution policy errors on Windows, either run the commands in Command Prompt or temporarily set the policy for the session:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
