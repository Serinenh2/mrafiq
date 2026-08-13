import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Kpi, Gauge, DomainBars, Spinner } from '../components/ui'

export default function Dashboard() {
  const { t, lang } = useApp()
  const { data: kpis } = useQuery({ queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then((r) => r.data) })
  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const firstId = companies?.[0]?.id
  const { data: score } = useQuery({ queryKey: ['score', firstId], enabled: !!firstId,
    queryFn: () => api.get(`/companies/${firstId}/score/`).then((r) => r.data) })

  if (!kpis) return <Spinner />
  const chart = Object.entries(kpis.by_status || {}).map(([k, v]) => ({
    name: t(`status.${k}`), value: v, key: k }))
  const CHART_COLORS = { valide: 'var(--status-conforme)', verifie: 'var(--status-conforme)',
    renseigne: 'var(--status-partiel)', a_verifier: 'var(--status-averifier)',
    brouillon: 'var(--status-manquant)', propose: 'var(--status-averifier)' }

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">{t('nav.dashboard')}</h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        <Kpi value={kpis.companies} label={t('kpi.companies')} />
        <Kpi value={kpis.processings} label={t('kpi.processings')} accent="var(--status-averifier)" />
        <Kpi value={kpis.critical_gaps} label={t('kpi.criticalGaps')} accent="var(--severity-critique)" />
        <Kpi value={kpis.late_actions} label={t('kpi.lateActions')} accent="var(--status-partiel)" />
        <Kpi value={kpis.avg_score != null ? `${kpis.avg_score} %` : '—'} label={t('kpi.avgScore')}
             accent="var(--status-conforme)" />
      </div>

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="card">
          <h3 className="font-semibold mb-4">{t('score.title')}
            {companies?.[0] && <span className="text-ink-muted font-normal text-sm"> — {companies[0].name}</span>}</h3>
          {score ? (
            <div className="flex flex-wrap items-center gap-6">
              <Gauge score={score.global}
                     levelLabel={score.level ? (lang === 'ar' ? score.level.ar : score.level.fr) : null} />
              <p className="text-xs text-ink-muted flex-1 min-w-[160px]">{t('score.configurable')}</p>
            </div>
          ) : <Spinner />}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">{t('score.byDomain')}</h3>
          {score ? <DomainBars domains={score.domains} /> : <Spinner />}
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold mb-3">{t('kpi.processings')}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
            <Tooltip cursor={{ fill: 'var(--bg-sunken)' }}
                     contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                     borderRadius: 10, fontSize: 13 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chart.map((c) => <Cell key={c.key} fill={CHART_COLORS[c.key] || 'var(--brand-primary-600)'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
