/** ============================================================
 *  MRAFIQ | مرافق — Tailwind Config v1.0 (React + Vite)
 *  Dark mode : classe/attribut [data-theme="dark"] sur <html>
 *  RTL : géré par dir="rtl" + propriétés logiques (plugin ci-dessous
 *  inutile depuis Tailwind 3.3 : utiliser ms-*, me-*, ps-*, pe-*,
 *  start-*, end-* au lieu de ml/mr/pl/pr/left/right)
 *  ============================================================ */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Sémantique — pointent vers les variables CSS (tokens.css)
        app:      'var(--bg-app)',
        surface:  'var(--bg-surface)',
        sunken:   'var(--bg-sunken)',
        sidebar:  'var(--bg-sidebar)',
        line:     'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          ondark: 'var(--text-on-dark)',
        },
        primary: {
          50:  'var(--brand-primary-050)',
          100: 'var(--brand-primary-100)',
          500: 'var(--brand-primary-500)',
          600: 'var(--brand-primary-600)',
          700: 'var(--brand-primary-700)',
          900: 'var(--brand-ink-900)',
        },
        brass: { 300: 'var(--brand-brass-300)', 500: 'var(--brand-brass-500)' },
        status: {
          conforme:     'var(--status-conforme)',
          'conforme-bg':'var(--status-conforme-bg)',
          partiel:      'var(--status-partiel)',
          'partiel-bg': 'var(--status-partiel-bg)',
          nonconforme:  'var(--status-nonconforme)',
          'nonconforme-bg':'var(--status-nonconforme-bg)',
          manquant:     'var(--status-manquant)',
          'manquant-bg':'var(--status-manquant-bg)',
          averifier:    'var(--status-averifier)',
          'averifier-bg':'var(--status-averifier-bg)',
        },
        severity: {
          critique: 'var(--severity-critique)',
          eleve:    'var(--severity-eleve)',
          moyen:    'var(--severity-moyen)',
          faible:   'var(--severity-faible)',
        },
      },
      fontFamily: {
        ui:     ['IBM Plex Sans', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        data:   ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',   { lineHeight: '1.4' }],
        sm:   ['0.8125rem', { lineHeight: '1.5' }],
        base: ['0.9375rem', { lineHeight: '1.6' }],
        md:   ['1.0625rem', { lineHeight: '1.6' }],
        lg:   ['1.25rem',   { lineHeight: '1.35' }],
        xl:   ['1.5rem',    { lineHeight: '1.25' }],
        '2xl':['1.875rem',  { lineHeight: '1.2'  }],
        '3xl':['2.5rem',    { lineHeight: '1.1'  }],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', pill: '999px' },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop:  'var(--shadow-pop)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.22,.8,.36,1)' },
      transitionDuration: { fast: '140ms', base: '220ms' },
    },
  },
  plugins: [],
};
