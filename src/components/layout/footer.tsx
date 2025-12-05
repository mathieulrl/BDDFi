"use client";

import { motion } from "framer-motion";
import { Zap, Github, Twitter, MessageCircle } from "lucide-react";

const footerLinks = {
  product: [
    { name: "How it works", href: "#how-it-works" },
    { name: "Macro Outlook", href: "#macro-outlook" },
    { name: "Tax Simulator", href: "#tax-simulator" },
    { name: "PnL Simulator", href: "#pnl-simulator" },
    { name: "Dashboard", href: "#dashboard" },
    { name: "Documentation", href: "#docs" },
  ],
  resources: [
    { name: "AAVE Docs", href: "https://docs.aave.com" },
    { name: "Base Network", href: "https://base.org" },
    { name: "Circle USDC", href: "https://www.circle.com/usdc" },
  ],
  legal: [
    { name: "Terms", href: "#terms" },
    { name: "Privacy", href: "#privacy" },
    { name: "Risk Disclosure", href: "#risks" },
  ],
};

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "Discord", icon: MessageCircle, href: "https://discord.com" },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2">
            <motion.a
              href="/"
              className="flex items-center gap-3 group mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-bitcoin to-ethereum rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-bitcoin via-ethereum to-solana p-2.5 rounded-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-display font-bold text-xl">
                BBD<span className="text-bitcoin">Fi</span>
              </span>
            </motion.a>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              The "Buy, Borrow, Die" strategy of billionaires, democratized through DeFi on Base.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 BBDFi. Built for Hackathon MBC on Base.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-white/5 text-bitcoin font-medium">Base</span>
              <span className="px-2 py-1 rounded bg-white/5 text-usdc font-medium">USDC</span>
              <span className="px-2 py-1 rounded bg-white/5 text-ethereum font-medium">AAVE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

