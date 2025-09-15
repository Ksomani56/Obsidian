'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/context/CurrencyContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, TrendingUp, Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const { currency, toggleCurrency } = useCurrency()
  const pathname = usePathname()

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/risk', label: 'Portfolio Risk' },
    { href: '/predict', label: 'Stock Prediction' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 h-14 bg-primary border-b border-primary">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-light-accent dark:bg-dark-accent p-1.5 rounded">
              <TrendingUp className="h-5 w-5 text-light-bg dark:text-dark-bg" />
            </div>
            <span className="text-lg font-bold text-primary">
              Obsidian
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'bg-light-accent dark:bg-dark-accent text-light-bg dark:text-dark-bg'
                    : 'text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Currency Toggle */}
            <button
              onClick={toggleCurrency}
              className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium border border-secondary bg-light-accent dark:bg-dark-accent text-light-bg dark:text-dark-bg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200"
              aria-label="Toggle currency"
            >
              {currency === 'USD' ? 'USD $' : 'INR ₹'}
            </button>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-primary transition-colors duration-200 ml-2"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Currency Toggle */}
            <button
              onClick={toggleCurrency}
              className="px-2 py-1 rounded-md text-sm font-medium border border-secondary bg-light-accent dark:bg-dark-accent text-light-bg dark:text-dark-bg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200"
              aria-label="Toggle currency"
            >
              {currency === 'USD' ? 'USD $' : 'INR ₹'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-primary transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-primary transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'bg-light-accent dark:bg-dark-accent text-light-bg dark:text-dark-bg'
                      : 'text-secondary hover:bg-light-hover dark:hover:bg-dark-hover hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
