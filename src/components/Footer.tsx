import { TrendingUp, Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-primary mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-light-accent dark:bg-dark-accent p-1.5 rounded">
                <TrendingUp className="h-4 w-4 text-light-bg dark:text-dark-bg" />
              </div>
              <span className="text-lg font-bold text-primary">
                Stock Insights
              </span>
            </div>
            <p className="text-sm text-secondary">
              Advanced portfolio risk analysis and intelligent stock price predictions for informed investment decisions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/risk" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                  Portfolio Risk
                </a>
              </li>
              <li>
                <a href="/predict" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                  Stock Prediction
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              Features
            </h3>
            <ul className="space-y-2">
              <li className="text-sm text-secondary">
                Risk Analysis
              </li>
              <li className="text-sm text-secondary">
                Price Prediction
              </li>
              <li className="text-sm text-secondary">
                Portfolio Optimization
              </li>
              <li className="text-sm text-secondary">
                Real-time Data
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              Connect
            </h3>
            <div className="flex space-x-3">
              <a
                href="#"
                className="text-secondary hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-secondary hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-secondary hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-secondary">
              © 2024 Stock Insights. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-3 md:mt-0">
              <a href="#" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-secondary hover:text-light-accent dark:hover:text-dark-accent transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
