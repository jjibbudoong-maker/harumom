import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // JIT가 스캔 전에 반드시 생성할 클래스 목록
  safelist: [
    'bg-ap-navy', 'bg-ap-blue', 'bg-ap-teal', 'bg-ap-red', 'bg-ap-amber',
    'bg-ap-teal-lt', 'bg-ap-blue-lt', 'bg-ap-red-lt', 'bg-ap-amber-lt',
    'bg-ap-surface', 'bg-ap-card',
    'text-ap-navy', 'text-ap-blue', 'text-ap-teal', 'text-ap-red',
    'text-ap-amber', 'text-ap-muted', 'text-ap-text',
    'border-ap-blue', 'border-ap-teal', 'border-ap-border', 'border-ap-red',
    'border-l-ap-teal', 'border-l-ap-blue', 'border-l-ap-amber', 'border-l-ap-red', 'border-l-ap-border',
    'accent-ap-blue', 'accent-ap-teal', 'accent-ap-red',
    'ring-ap-blue', 'focus:ring-ap-blue',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ── Apeuni Medical Design System ──
        "ap-navy":    "#0D2B45",
        "ap-blue":    "#1565C0",
        "ap-teal":    "#00695C",
        "ap-teal-lt": "#E0F2F1",
        "ap-blue-lt": "#E3F2FD",
        "ap-surface": "#F5F7FA",
        "ap-card":    "#FFFFFF",
        "ap-border":  "#CBD5E1",
        "ap-muted":   "#64748B",
        "ap-red":     "#C62828",
        "ap-red-lt":  "#FFEBEE",
        "ap-amber":   "#E65100",
        "ap-amber-lt":"#FFF3E0",
        "ap-text":    "#1A202C",
        // legacy aliases
        "apeuni-mint": "#00695C",
        "apeuni-soft": "#E0F2F1",
        "apeuni-warn": "#E65100",
        "apeuni-bear": "#455A64",
      },
    },
  },
  plugins: [],
};
export default config;
