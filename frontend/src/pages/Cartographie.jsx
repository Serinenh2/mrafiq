import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { downloadFile as dl } from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'
import SectorTemplates from '../components/SectorTemplates'

const ROW = 64, PAD = 40, COLW = 240, GAP = 120
const X_LEFT = PAD, X_MID = PAD + COLW + GAP, X_RIGHT = PAD + 2 * (COLW + GAP)
const W = X_RIGHT + COLW + PAD

export default function Cartographie() {
  const { t, L, lang } = useApp()
  const [companyId, setCompanyId] = useState(null)
  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id
  const { data: procs } = useQuery({ queryKey: ['processings', String(cid)], enabled: !!cid,
    queryFn: () => api.get(`/processings/?company=${cid}`).then((r) => r.data) })
  const { data: refs } = useQuery({ queryKey: ['refs'],
    queryFn: () => api.get('/refs/').then((r) => r.data) })
  const { data: processors } = useQuery({ queryKey: ['processors', String(cid)], enabled: !!cid,
    queryFn: () => api.get(`/processors/?company=${cid}`).then((r) => r.data.results ?? r.data) })

  if (!companies || !refs) return <Spinner />
  const company = companies.find((c) => c.id === cid)
  const list = (procs ?? []).filter((p) => p.status === 'valide')

  const subjectIds = [...new Set(list.flatMap((p) => p.subject_categories))]
  const subjects = refs.subject_categories.filter((s) => subjectIds.includes(s.id))
  const usedProcessors = (processors ?? []).filter((pr) => list.some((p) => p.processors.includes(pr.id)))
  const hasAbroad = list.some((p) => p.transfer_abroad)
  const right = [
    ...usedProcessors.map((pr) => ({ key: `pr-${pr.id}`, label: pr.name, abroad: false })),
    ...(hasAbroad ? [{ key: 'abroad', label: t('carto.abroad'), abroad: true }] : []),
  ]

  const H = PAD * 2 + Math.max(subjects.length, list.length, right.length, 1) * ROW
  const y = (i, n) => PAD + (H - 2 * PAD) * (n <= 1 ? 0.5 : i / (n - 1))
  const sy = Object.fromEntries(subjects.map((s, i) => [s.id, y(i, subjects.length)]))
  const py = Object.fromEntries(list.map((p, i) => [p.id, y(i, list.length)]))
  const ry = Object.fromEntries(right.map((r, i) => [r.key, y(i, right.length)]))

  const curve = (xa, ya, xb, yb) =>
    `M ${xa} ${ya} C ${(xa + xb) / 2} ${ya}, ${(xa + xb) / 2} ${yb}, ${xb} ${yb}`

  const Node = ({ x, yy, label, tone }) => (
    <g>
      <rect x={x} y={yy - 17} width={COLW} height={34} rx="8"
        fill={tone === 'mid' ? 'var(--brand-primary-600)' : 'var(--bg-surface)'}
        stroke={tone === 'abroad' ? 'var(--status-partiel)'
          : tone === 'mid' ? 'var(--brand-primary-600)' : 'var(--border-strong)'}
        strokeWidth={tone === 'abroad' ? 2 : 1} />
      <text x={x + COLW / 2} y={yy + 4} textAnchor="middle" fontSize="12" fontWeight="600"
        fill={tone === 'mid' ? '#fff' : 'var(--text-primary)'}
        style={{ fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'var(--font-ui)' }}>
        {label.length > 30 ? label.slice(0, 29) + '…' : label}
      </text>
    </g>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('carto.title')}</h1>
        <button className="btn-ghost btn-sm ms-auto"
                onClick={() => dl(`/companies/${cid}/export/cartographie.xlsx`, `cartographie_${cid}.xlsx`)}>
          {t('carto.exportXlsx')}</button>
        <select className="input w-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => setCompanyId(Number(e.target.value))}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <SectorTemplates companyId={cid} sector={company?.sector} />
      <p className="text-xs text-ink-muted mb-3">{t('carto.validatedOnly')}</p>
      <div className="card overflow-x-auto">
        {!procs ? <Spinner /> : !list.length ? (
          <p className="text-sm text-ink-muted py-6 text-center">{t('carto.empty')}</p>
        ) : (
          <svg width={W} height={H + 28} viewBox={`0 0 ${W} ${H + 28}`} style={{ direction: 'ltr' }}
               role="img" aria-label={t('carto.title')}>
            {[[X_LEFT, 'carto.subjects'], [X_MID, 'carto.processings'], [X_RIGHT, 'carto.recipients']]
              .map(([x, key]) => (
              <text key={key} x={x + COLW / 2} y={16} textAnchor="middle" fontSize="11"
                fontWeight="700" letterSpacing="1" fill="var(--text-secondary)"
                style={{ textTransform: 'uppercase',
                         fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'var(--font-ui)' }}>
                {t(key)}</text>
            ))}
            <g transform="translate(0, 28)">
              {list.flatMap((p) => p.subject_categories
                .filter((sid) => sy[sid] != null)
                .map((sid) => (
                  <path key={`s${sid}-p${p.id}`}
                    d={curve(X_LEFT + COLW, sy[sid], X_MID, py[p.id])}
                    fill="none" stroke="var(--border-strong)" strokeWidth="1.5" opacity=".8" />
                )))}
              {list.flatMap((p) => [
                ...p.processors.filter((prid) => ry[`pr-${prid}`] != null).map((prid) => (
                  <path key={`p${p.id}-pr${prid}`}
                    d={curve(X_MID + COLW, py[p.id], X_RIGHT, ry[`pr-${prid}`])}
                    fill="none" stroke="var(--border-strong)" strokeWidth="1.5" opacity=".8" />
                )),
                ...(p.transfer_abroad && ry.abroad != null ? [
                  <path key={`p${p.id}-abroad`}
                    d={curve(X_MID + COLW, py[p.id], X_RIGHT, ry.abroad)}
                    fill="none" stroke="var(--status-partiel)" strokeWidth="2" />] : []),
              ])}
              {subjects.map((s) => <Node key={s.id} x={X_LEFT} yy={sy[s.id]} label={L(s)} tone="side" />)}
              {list.map((p) => <Node key={p.id} x={X_MID} yy={py[p.id]}
                                     label={`${p.reference} · ${p.name}`} tone="mid" />)}
              {right.map((r) => <Node key={r.key} x={X_RIGHT} yy={ry[r.key]} label={r.label}
                                      tone={r.abroad ? 'abroad' : 'side'} />)}
            </g>
          </svg>
        )}
        <p className="text-xs text-ink-muted mt-3 max-w-xl">{t('carto.legend')}</p>
      </div>
    </div>
  )
}
