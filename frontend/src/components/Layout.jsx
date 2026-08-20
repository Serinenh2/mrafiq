import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       className="w-[17px] h-[17px] shrink-0"><path d={d} /></svg>
)
const ICONS = {
  dash: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  companies: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01',
  missions: 'M9 3h6l1 3h4v15H4V6h4zM9 3v3h6V3M9 12h6M9 16h6',
  diagnostics: 'M12 3a9 9 0 109 9 9 9 0 00-9-9zM12 7v5l3 3',
  questionnaire: 'M9 12h6M9 16h6M9 8h2M6 3h9l3 3v15H6z',
  registre: 'M4 6h16M4 12h16M4 18h10',
  carto: 'M6 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM18 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM12 15.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM7.5 7.5l3 8M16.5 7.5l-3 8',
  actions: 'M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9',
  reports: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6',
  docValide: 'M9 12l2 2 4-4M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6',
  person: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  anpdp: 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM9.5 12l2 2 4-4',
  dossier: 'M4 4h10l6 6v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM13 4v6h6M9 13h6M9 17h6',
  assistant: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
}

export default function Layout() {
  const { t, lang, setLang, theme, setTheme } = useApp()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const cls = ({ isActive }) => (isActive ? 'nav-active' : 'nav-item')
  const isOrgUser = user?.role === 'org_user'

  return (
    <div className="min-h-screen md:grid" style={{ gridTemplateColumns: '236px 1fr' }}>
      <aside className="bg-sidebar text-ink-ondark p-4 flex flex-col md:min-h-screen"
             style={{ borderInlineEnd: '3px solid var(--brand-brass-500)' }}>
        <div className="flex items-baseline gap-2.5 px-2 pb-5">
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-arabic)' }}>مرافق</span>
          <span className="text-xs font-semibold tracking-[.28em]"
                style={{ color: 'var(--brand-brass-300)' }}>MRAFIQ</span>
        </div>
        {isOrgUser ? (
          <>
            <div className="text-[.66rem] uppercase tracking-[.14em] px-3 pb-1.5"
                 style={{ color: '#5F7396' }}>{t('nav.conformite')}</div>
            <NavLink to="/diagnostics" className={cls}><Icon d={ICONS.diagnostics} />{t('nav.diagnostics')}</NavLink>
            <NavLink to="/questionnaire" className={cls}><Icon d={ICONS.questionnaire} />{t('nav.questionnaire')}</NavLink>
          </>
        ) : (
          <>
            <div className="text-[.66rem] uppercase tracking-[.14em] px-3 pb-1.5"
                 style={{ color: '#5F7396' }}>{t('nav.pilotage')}</div>
            <NavLink to="/" end className={cls}><Icon d={ICONS.dash} />{t('nav.dashboard')}</NavLink>
            <NavLink to="/companies" className={cls}><Icon d={ICONS.companies} />{t('nav.companies')}</NavLink>
            <NavLink to="/dossier-conformite-anpdp" className={cls}><Icon d={ICONS.dossier} />{t('nav.anpdpDossier')}</NavLink>
            <div className="text-[.66rem] uppercase tracking-[.14em] px-3 pt-4 pb-1.5"
                 style={{ color: '#5F7396' }}>{t('nav.conformite')}</div>
            <NavLink to="/declarations-validees" className={cls}><Icon d={ICONS.registre} />{t('nav.declarations')}</NavLink>
            <NavLink to="/missions" className={cls}><Icon d={ICONS.missions} />{t('nav.missions')}</NavLink>
            <NavLink to="/responsable-traitements" className={cls}><Icon d={ICONS.person} />{t('nav.responsable')}</NavLink>
            <NavLink to="/dpo" className={cls}><Icon d={ICONS.person} />{t('nav.dpo')}</NavLink>
            <NavLink to="/compte-anpdp" className={cls}><Icon d={ICONS.anpdp} />{t('nav.anpdp')}</NavLink>
            <NavLink to="/diagnostics" className={cls}><Icon d={ICONS.diagnostics} />{t('nav.diagnostics')}</NavLink>
            <NavLink to="/questionnaire" className={cls}><Icon d={ICONS.questionnaire} />{t('nav.questionnaire')}</NavLink>
          
            <NavLink to="/cartographie" className={cls}><Icon d={ICONS.carto} />{t('nav.carto')}</NavLink>
            <NavLink to="/actions" className={cls}><Icon d={ICONS.actions} />{t('nav.actions')}</NavLink>
            <NavLink to="/documents-valides" className={cls}><Icon d={ICONS.docValide} />{t('nav.documentsValides')}</NavLink>
            <NavLink to="/registre" className={cls}><Icon d={ICONS.registre} />{t('nav.registre')}</NavLink>
            <NavLink to="/assistant" className={cls}><Icon d={ICONS.assistant} />{t('nav.assistant')}</NavLink>
            <NavLink to="/rapports" className={cls}><Icon d={ICONS.reports} />{t('nav.reports')}</NavLink>
          </>
        )}
        <div className="mt-auto pt-6 px-2 text-xs" style={{ color: '#8FA3C0' }}>
          {user?.first_name || user?.username} · {user?.role}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-6 py-3 bg-surface border-b border-line">
          <div className="text-sm text-ink-secondary truncate">{t('slogan')}</div>
          <div className="ms-auto flex items-center gap-2">
            <button className="btn-secondary btn-sm" onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                    aria-label="AR | FR">{lang === 'fr' ? 'AR' : 'FR'}</button>
            <button className="btn-secondary btn-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? t('light') : t('dark')}
            </button>
            <button className="btn-ghost btn-sm" onClick={() => { logout(); nav('/login') }}>
              {t('logout')}
            </button>
          </div>
        </header>
        <main className="p-6 max-w-[1120px]"><Outlet /></main>
      </div>
    </div>
  )
}
