import { useApp } from '../context/AppContext'

const STATUS_STYLE = {
  conforme: 'conforme', valide: 'conforme', verifie: 'conforme', termine: 'conforme',
  partiel: 'partiel', renseigne: 'partiel', en_cours: 'partiel', en_attente: 'partiel',
  non_conforme: 'nonconforme', rejete: 'nonconforme',
  manquant: 'manquant', brouillon: 'manquant', a_faire: 'manquant',
  a_verifier: 'averifier', propose: 'averifier',
  cloturee: 'conforme', preparation: 'manquant',
  diagnostic: 'averifier', cartographie: 'averifier', analyse: 'averifier',
  plan_action: 'averifier', mise_conformite: 'averifier', verification: 'averifier',
  finalisation: 'averifier',
}
export function StatusBadge({ status }) {
  const { t } = useApp()
  const k = STATUS_STYLE[status] || 'manquant'
  return (
    <span className="badge" style={{
      color: `var(--status-${k})`, background: `var(--status-${k}-bg)` }}>
      {t(`status.${status}`)}
    </span>
  )
}
export function SeverityBadge({ severity }) {
  const { t } = useApp()
  return (
    <span className="badge-sev" style={{ background: `var(--severity-${severity})` }}>
      {t(`severity.${severity}`)}
    </span>
  )
}
export function Kpi({ value, label, accent = 'var(--brand-primary-600)' }) {
  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 start-0 w-1" style={{ background: accent }} />
      <div className="text-2xl font-bold data">{value ?? '—'}</div>
      <div className="text-sm text-ink-secondary font-medium">{label}</div>
    </div>
  )
}
export function Gauge({ score, levelLabel }) {
  const R = 72, C = 2 * Math.PI * R
  const offset = score == null ? C : C * (1 - score / 100)
  const color = score == null ? 'var(--border-strong)'
    : score <= 39 ? 'var(--score-critique)' : score <= 59 ? 'var(--score-faible)'
    : score <= 79 ? 'var(--score-inter)' : score <= 94 ? 'var(--score-bon)' : 'var(--score-tresbon)'
  return (
    <div className="relative w-[168px] h-[168px] shrink-0" role="img"
         aria-label={`${score ?? '—'} % ${levelLabel || ''}`}>
      <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="84" cy="84" r={R} fill="none" stroke="var(--bg-sunken)" strokeWidth="14" />
        <circle cx="84" cy="84" r={R} fill="none" stroke={color} strokeWidth="14"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .8s var(--ease-out)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-3xl data leading-none">{score != null ? `${score} %` : '—'}</b>
        {levelLabel && <span className="text-xs text-ink-muted mt-1">{levelLabel}</span>}
      </div>
    </div>
  )
}
export function DomainBars({ domains }) {
  const { L } = useApp()
  return (
    <div>
      {domains.map((d) => {
        const color = d.score == null ? 'var(--border-strong)'
          : d.score < 40 ? 'var(--status-nonconforme)'
          : d.score < 60 ? 'var(--status-partiel)' : 'var(--brand-primary-600)'
        return (
          <div key={d.code} className="grid items-center gap-3 py-1.5 text-sm"
               style={{ gridTemplateColumns: '170px 1fr 44px' }}>
            <span className="truncate">{L(d)}</span>
            <div className="h-2 rounded-pill bg-sunken overflow-hidden">
              <i className="block h-full rounded-pill"
                 style={{ width: `${d.score ?? 0}%`, background: color,
                          transition: 'width .6s var(--ease-out)' }} />
            </div>
            <span className="data text-ink-secondary text-end">{d.score ?? '—'}</span>
          </div>
        )
      })}
    </div>
  )
}
export function Spinner() {
  const { t } = useApp()
  return <div className="p-8 text-center text-ink-muted text-sm">{t('common.loading')}</div>
}
