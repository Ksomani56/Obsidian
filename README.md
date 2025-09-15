# Obsidian – Portfolio Analytics & Stock Insights

Obsidian is a Next.js 14 (App Router) app for portfolio analytics and stock insights. It features a TradingView‑style UI, dark/light themes, a transaction/holdings driven portfolio analysis, and real data integrations (Finnhub). The app includes an Import workflow to upload CSV/Excel portfolios, map columns, validate rows, and auto‑generate charts.

## Features

- TradingView‑inspired UI with matte black dark theme and off‑white light theme
- Pages: Home, Portfolio Risk, Stock Prediction
- Portfolio Risk
  - Upload CSV/XLSX holdings (Zerodha export supported)
  - Auto mapping UI, validation, and import
  - Portfolio summary cards, performance time‑series, allocation pie, performance by asset
- Stock Prediction page with chart and right sidebar widgets
- Recharts for charts, Plotly for candlestick/ohlc
- Client‑side persistence via IndexedDB for imported transactions
- Server API routes for secure data access (Finnhub proxy)

## Tech Stack

- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS
- Recharts, Plotly
- SheetJS (xlsx) – Excel parsing
- IndexedDB (client‑side), API routes (server‑side)

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Environment variables

Create a `.env.local` at the project root (not committed). Example:

```bash
FINNHUB_API_KEY=your_finnhub_api_key
```

Notes:
- Do not prefix secrets with `NEXT_PUBLIC_` (that would expose them to the browser).
- Keep secrets on the server only (API routes, server actions). The app proxies requests to Finnhub via API routes.

3. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Importing Your Portfolio

Navigate to `Portfolio Risk` → “Add your portfolio”. The importer accepts:

- `.csv`
- `.xlsx`/`.xls` (Excel)

Supported columns (auto‑detected case‑insensitively; Zerodha holdings export headers shown in parentheses):

- `Symbol` / `Scrip` / `Name` → ticker/name
- `Quantity Ava` / `Quantity Available` / `Quantity` / `Qty` → quantity
- `Average Price` / `Avg Price` / `Average Cost` → buy average price
- `Sector` (optional)
- `Instrument` / `Type` / `Segment` (optional)

Rows are validated (date/ticker/type/quantity/price for transactions; quantity/avgPrice for holdings) and normalized (numeric commas removed). Invalid rows are skipped and reported in the preview UI.

## Security – Keeping Secrets Safe

- Secrets live in `.env.local` (ignored by Git).
- Never commit `.env*` files. The repo’s `.gitignore` already ignores `.env*.local`.
- Access secrets only server‑side via `process.env` in API routes (e.g., `src/app/api/...`).
- Public variables must be prefixed with `NEXT_PUBLIC_` and are visible to the client. Do not put secrets there.
- Before pushing, scan for accidental secrets:

```bash
git grep -n "API_KEY\|TOKEN\|SECRET\|FINNHUB"
```

If something leaked, revoke/rotate it immediately.

## Project Structure

- `src/app` – App Router pages and API routes
- `src/components` – UI components (Navbar, Footer, Widget, charts, import)
- `src/lib` – utilities (portfolio compute, parser, db, mock data)
- `src/context` – theming/currency contexts (if enabled)

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start prod server
npm run lint     # lint
npm run test     # unit tests (vitest)
```

## Adding More Charts

- Allocation Pie: `computeAllocation()` → Recharts PieChart
- Performance by Asset: `computePerformanceByAsset()` → Recharts BarChart
- Time‑series portfolio value: `computeDailyPortfolioValue()` → Recharts LineChart

## Accessibility

- Keyboard accessible buttons and inputs
- High‑contrast colors and visible focus rings
- Tooltips on interactive elements

## License

MIT (or specify your license)

# Stock Insights - Portfolio Risk & Prediction Dashboard

A modern, responsive stock market dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Recharts. Features portfolio risk analysis and AI-powered stock price predictions with a TradingView-inspired design.

## 🚀 Features

### Portfolio Risk Analysis (`/risk`)
- **Risk Metrics**: Expected return, volatility, Sharpe ratio calculation
- **Interactive Pie Chart**: Visual portfolio allocation with Recharts
- **Form Input**: Comma-separated tickers and weights
- **Real-time Results**: Instant portfolio risk assessment

### Stock Price Prediction (`/predict`)
- **AI Predictions**: Machine learning-powered price forecasting
- **Interactive Charts**: Historical vs predicted price visualization
- **Customizable Horizon**: 1-365 day prediction periods
- **Confidence Metrics**: Prediction confidence and trend analysis

### Modern UI/UX
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Mode**: System preference detection with manual toggle
- **TradingView-inspired**: Clean, professional fintech aesthetic
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: ARIA labels and keyboard navigation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-market-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Purple**: (#8B5CF6)
- **Cyan**: (#06B6D4)

### Components
- **Cards**: Rounded-2xl corners with soft shadows
- **Buttons**: Primary (blue) and secondary (gray) variants
- **Inputs**: Clean borders with focus states
- **Charts**: Responsive with tooltips and legends

### Typography
- **Font**: Inter (300, 400, 500, 600, 700)
- **Headings**: Bold, large sizes
- **Body**: Medium weight, readable sizes

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout with navbar and footer
│   ├── page.tsx             # Home page
│   ├── risk/
│   │   └── page.tsx         # Portfolio risk analysis page
│   └── predict/
│       └── page.tsx         # Stock prediction page
├── components/
│   ├── Navbar.tsx           # Navigation component
│   └── Footer.tsx           # Footer component
└── lib/
    ├── utils.ts             # Utility functions
    └── mockData.ts          # Mock data generators
```

## 🎯 Key Features

### Portfolio Risk Analysis
- Input multiple stock tickers and weights
- Calculate expected return, volatility, and Sharpe ratio
- Visualize portfolio allocation with interactive pie chart
- Responsive design for all screen sizes

### Stock Prediction
- Enter any stock ticker symbol
- Set prediction horizon (1-365 days)
- View historical and predicted prices on interactive chart
- Get confidence metrics and trend analysis

### Theme System
- Automatic dark/light mode detection
- Manual theme toggle in navbar
- Persistent theme preference
- Smooth transitions between themes

## 🚀 Deployment

The app is ready for deployment on Vercel, Netlify, or any other Next.js-compatible platform:

```bash
npm run build
npm run start
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the repository.

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
