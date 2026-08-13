import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, SeverityBadge, Gauge, DomainBars, Spinner } from '../components/ui'

const dl = async (url, filename) => {
  const r = await api.get(url, { responseType: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(r.data); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

export default function CompanyDetail() {
  const { id } = useParams()
  const { t, lang } = useApp()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'info')
  const [notice, setNotice] = useState('')

  const { data: company } = useQuery({ queryKey: ['company', id],
    queryFn: () => api.get(`/companies/${id}/`).then((r) => r.data) })
  const { data: score } = useQuery({ queryKey: ['score', id],
    queryFn: () => api.get(`/companies/${id}/score/`).then((r) => r.data) })

  const runEngine = useMutation({
    mutationFn: () => api.post(`/companies/${id}/compliance/run/`),
    onSuccess: () => { setNotice(t('company.engineDone'))
      qc.invalidateQueries(); setTimeout(() => setNotice(''), 3000) },
  })

  if (!company) return <Spinner />
  const TABS = ['info', 'diagnostic', 'processings', 'gaps', 'actions']

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">{company.name}</h1>
          <div className="text-xs text-ink-muted">{company.sector} · <span className="data">{company.rc_number}</span></div>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" disabled={runEngine.isPending}
                  onClick={() => runEngine.mutate()}>{t('company.runEngine')}</button>
          <button className="btn-secondary btn-sm"
                  onClick={() => dl(`/companies/${id}/export/registre.xlsx`, `registre_${id}.xlsx`)}>
            {t('company.exportXlsx')}</button>
          <button className="btn-secondary btn-sm"
                  onClick={() => dl(`/companies/${id}/export/rapport.pdf`, `rapport_${id}.pdf`)}>
            {t('company.exportPdf')}</button>
        </div>
      </div>
      {notice && <div className="card mb-4 py-2 text-sm"
        style={{ background: 'var(--status-conforme-bg)', color: 'var(--status-conforme)' }}>{notice}</div>}

      <div className="flex border-b border-line mb-5 overflow-x-auto">
        {TABS.map((k) => (
          <button key={k} className={tab === k ? 'tab-active' : 'tab'} onClick={() => setTab(k)}>
            {t(`company.tabs.${k}`)}</button>
        ))}
      </div>

      {tab === 'info' && <InfoTab company={company} score={score} lang={lang} t={t} />}
      {tab === 'diagnostic' && <DiagnosticTab companyId={id} />}
      {tab === 'processings' && <ProcessingsTab companyId={id} />}
      {tab === 'gaps' && <GapsTab companyId={id} />}
      {tab === 'actions' && <ActionsTab companyId={id} />}
    </div>
  )
}

function InfoTab({ company, score, lang, t }) {
  const rows = [
    ['companies.legalForm', company.legal_form], ['companies.rc', company.rc_number],
    ['companies.wilaya', company.wilaya], ['companies.employees', company.employees_count],
    ['companies.address', company.address], ['companies.contact',
      `${company.contact_name || ''} ${company.contact_email || ''}`.trim()],
    ['companies.itSystems', company.it_systems], ['companies.notes', company.notes],
  ]
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <div className="card">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 py-2 border-b border-line last:border-0 text-sm">
            <span className="w-44 shrink-0 text-ink-secondary">{t(k)}</span>
            <span className="min-w-0">{v || '—'}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">{t('score.title')}</h3>
        {score ? (
          <>
            <div className="flex justify-center mb-4">
              <Gauge score={score.global}
                     levelLabel={score.level ? (lang === 'ar' ? score.level.ar : score.level.fr) : null} />
            </div>
            <DomainBars domains={score.domains} />
          </>
        ) : <Spinner />}
      </div>
    </div>
  )
}

function DiagnosticTab({ companyId }) {
  const { t, lang } = useApp()
  const qc = useQueryClient()
  const [effects, setEffects] = useState(null)
  const { data: diags } = useQuery({ queryKey: ['diagnostics', companyId],
    queryFn: () => api.get('/diagnostics/').then((r) =>
      (r.data.results ?? r.data).filter((d) => String(d.company) === String(companyId))) })
  const diag = diags?.[0]
  const { data: questions } = useQuery({ queryKey: ['diag-questions', diag?.id], enabled: !!diag,
    queryFn: () => api.get(`/diagnostics/${diag.id}/questions/`).then((r) => r.data) })

  const createDiag = useMutation({
    mutationFn: () => api.post('/diagnostics/', { company: companyId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diagnostics', companyId] }),
  })
  const answer = useMutation({
    mutationFn: ({ code, value }) =>
      api.post(`/diagnostics/${diag.id}/answer/`, { question_code: code, value }),
    onSuccess: (r) => {
      qc.setQueryData(['diag-questions', diag.id], r.data.questions)
      const e = r.data.effects
      if (e.proposed_processings.length || e.opened_modules.length) setEffects(e)
      qc.invalidateQueries({ queryKey: ['processings', companyId] })
      setTimeout(() => setEffects(null), 4000)
    },
  })

  if (!diags) return <Spinner />
  if (!diag) return (
    <div className="card text-center py-10">
      <p className="text-ink-secondary mb-4">{t('diag.empty')}</p>
      <button className="btn-primary" onClick={() => createDiag.mutate()}>{t('diag.new')}</button>
    </div>
  )
  return (
    <div className="max-w-2xl">
      {effects && (
        <div className="card mb-4 py-3 text-sm"
             style={{ borderColor: 'var(--status-averifier)', background: 'var(--status-averifier-bg)' }}>
          {effects.proposed_processings.map((p) => (
            <div key={p}><b>{t('diag.triggered')}</b> {p}</div>))}
          {effects.opened_modules.map((m) => (
            <div key={m}><b>{t('diag.moduleOpened')}</b> {m}</div>))}
        </div>
      )}
      {(questions ?? []).map((q) => (
        <div key={q.code} className="card mb-3">
          <div className="flex gap-3 items-start">
            <span className="data text-xs text-ink-muted pt-1">{q.code}</span>
            <p className="font-semibold text-sm flex-1">{lang === 'ar' && q.text_ar ? q.text_ar : q.text_fr}</p>
          </div>
          <div className="flex gap-2 mt-3">
            {['oui', 'non'].map((v) => (
              <button key={v}
                className={q.answer === v ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                onClick={() => answer.mutate({ code: q.code, value: v })}>
                {v === 'oui' ? t('diag.yes') : t('diag.no')}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ProcessingsTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['processings', companyId],
    queryFn: () => api.get(`/processings/?company=${companyId}`).then((r) => r.data) })
  const create = useMutation({
    mutationFn: () => api.post('/processings/', { company: companyId, name: t('proc.add') }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processings', companyId] }),
  })
  if (!data) return <Spinner />
  return (
    <div className="card p-0 overflow-x-auto">
      <div className="flex items-center p-3">
        <button className="btn-primary btn-sm ms-auto" onClick={() => create.mutate()}>{t('proc.add')}</button>
      </div>
      <table className="w-full min-w-[620px] border-collapse">
        <thead><tr>
          <th className="th">{t('proc.reference')}</th><th className="th">{t('proc.name')}</th>
          <th className="th">{t('proc.owner')}</th><th className="th">{t('proc.status')}</th>
          <th className="th">{t('proc.conformity')}</th>
        </tr></thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="hover:bg-primary-50">
              <td className="td data">{p.reference}</td>
              <td className="td"><Link className="font-semibold"
                to={`/companies/${companyId}/processings/${p.id}`}>{p.name}</Link>
                <div className="text-xs text-ink-muted truncate max-w-[280px]">{p.purpose}</div></td>
              <td className="td">{p.owner_name || '—'}</td>
              <td className="td"><StatusBadge status={p.status} /></td>
              <td className="td data">{p.conformity != null ? `${p.conformity} %` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GapsTab({ companyId }) {
  const { t } = useApp()
  const { data } = useQuery({ queryKey: ['gaps', companyId],
    queryFn: () => api.get(`/gaps/?company=${companyId}`).then((r) => r.data) })
  if (!data) return <Spinner />
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse">
        <thead><tr>
          <th className="th">{t('gaps.processing')}</th><th className="th">{t('gaps.requirement')}</th>
          <th className="th">{t('gaps.description')}</th><th className="th">{t('gaps.severity')}</th>
          <th className="th">{t('proc.status')}</th>
        </tr></thead>
        <tbody>
          {data.map((g) => (
            <tr key={g.id}>
              <td className="td data">{g.processing_ref || '—'}</td>
              <td className="td data">{g.requirement_code || '—'}</td>
              <td className="td">{g.description}</td>
              <td className="td"><SeverityBadge severity={g.severity} /></td>
              <td className="td text-sm text-ink-secondary">{g.is_open ? t('gaps.open') : t('gaps.closed')}</td>
            </tr>
          ))}
          {!data.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('common.empty')}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function ActionsTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['actions', companyId],
    queryFn: () => api.get(`/actions/?company=${companyId}`).then((r) => r.data) })
  const patch = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/actions/${id}/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions', companyId] }),
  })
  if (!data) return <Spinner />
  const STATUSES = ['a_faire', 'en_cours', 'en_attente', 'termine', 'valide']
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse">
        <thead><tr>
          <th className="th">Réf.</th><th className="th">{t('actions.title')}</th>
          <th className="th">{t('actions.assignee')}</th><th className="th">{t('actions.priority')}</th>
          <th className="th">{t('actions.due')}</th><th className="th">{t('proc.status')}</th>
        </tr></thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id}>
              <td className="td data">{a.reference}</td>
              <td className="td font-medium">{a.title}
                {a.processing_name && <div className="text-xs text-ink-muted">{a.processing_name}</div>}</td>
              <td className="td">{a.assignee || '—'}</td>
              <td className="td text-sm">{t(`priority.${a.priority}`)}</td>
              <td className="td data text-sm"
                  style={a.due_date < today && !['termine','valide'].includes(a.status)
                    ? { color: 'var(--status-nonconforme)', fontWeight: 600 } : {}}>
                {a.due_date || '—'}</td>
              <td className="td">
                <select className="input py-1 text-xs w-auto" value={a.status}
                        onChange={(e) => patch.mutate({ id: a.id, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
