import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, SeverityBadge, Gauge, DomainBars, Spinner } from '../components/ui'
import CompanyForm from '../components/CompanyForm'
import SectorTemplates from '../components/SectorTemplates'

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

      {tab === 'info' && <InfoTab companyId={id} company={company} score={score} lang={lang} t={t} />}
      {tab === 'diagnostic' && <DiagnosticTab companyId={id} sector={company.sector} />}
      {tab === 'processings' && <ProcessingsTab companyId={id} sector={company.sector} />}
      {tab === 'gaps' && <GapsTab companyId={id} />}
      {tab === 'actions' && <ActionsTab companyId={id} />}
    </div>
  )
}

function InfoTab({ companyId, company, score, lang, t }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const update = useMutation({
    mutationFn: (body) => api.patch(`/companies/${companyId}/`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company', companyId] }); setEditing(false) },
  })

  const rows = [
    ['companies.legalForm', company.legal_form], ['companies.sector', company.sector],
    ['companies.mainActivity', company.main_activity], ['companies.rc', company.rc_number],
    ['companies.nif', company.nif], ['companies.wilaya', company.wilaya],
    ['companies.employees', company.employees_count], ['companies.address', company.address],
    ['companies.contactName', company.contact_name], ['companies.contactEmail', company.contact_email],
    ['companies.contactPhone', company.contact_phone],
    ['companies.itSystems', company.it_systems], ['companies.itProviders', company.it_providers],
    ['companies.notes', company.notes],
  ]
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      <div className="card">
        {!editing && (
          <div className="flex items-center mb-3">
            <button className="btn-secondary btn-sm ms-auto" onClick={() => { setForm({ ...company }); setEditing(true) }}>
              {t('companies.edit')}</button>
          </div>
        )}
        {editing ? (
          <>
            <CompanyForm form={form} onChange={setForm} />
            <div className="flex gap-2 mt-4">
              <button className="btn-primary btn-sm" disabled={!form.name || update.isPending}
                      onClick={() => update.mutate(form)}>{t('companies.save')}</button>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>{t('companies.cancel')}</button>
            </div>
          </>
        ) : rows.map(([k, v]) => (
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

function DiagnosticTab({ companyId, sector }) {
  const { t, lang } = useApp()
  const qc = useQueryClient()
  const [effects, setEffects] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [dismissedKnown, setDismissedKnown] = useState({})
  const emptyForm = { service: '', respondent_name: '', respondent_role: '', processing: '' }
  const [form, setForm] = useState(emptyForm)

  const { data: diags } = useQuery({ queryKey: ['diagnostics', companyId],
    queryFn: () => api.get('/diagnostics/').then((r) =>
      (r.data.results ?? r.data).filter((d) => String(d.company) === String(companyId))) })
  const { data: procs } = useQuery({ queryKey: ['processings', companyId],
    queryFn: () => api.get(`/processings/?company=${companyId}`).then((r) => r.data) })
  const diag = diags?.find((d) => d.id === selectedId)
  const { data: questions } = useQuery({ queryKey: ['diag-questions', diag?.id], enabled: !!diag,
    queryFn: () => api.get(`/diagnostics/${diag.id}/questions/`).then((r) => r.data) })

  const createDiag = useMutation({
    mutationFn: (body) => api.post('/diagnostics/', { company: companyId, ...body,
      processing: body.processing || null }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['diagnostics', companyId] })
      setShowForm(false); setForm(emptyForm); setSelectedId(r.data.id)
    },
  })
  const answer = useMutation({
    mutationFn: ({ code, value, comment, evidence }) => {
      const fd = new FormData()
      fd.append('question_code', code); fd.append('value', value)
      if (comment) fd.append('comment', comment)
      if (evidence) fd.append('evidence', evidence)
      return api.post(`/diagnostics/${diag.id}/answer/`, fd)
    },
    onSuccess: (r) => {
      qc.setQueryData(['diag-questions', diag.id], r.data.questions)
      const e = r.data.effects
      if (e.proposed_processings.length || e.opened_modules.length) setEffects(e)
      qc.invalidateQueries({ queryKey: ['processings', companyId] })
      setTimeout(() => setEffects(null), 4000)
    },
  })

  if (!diags) return <Spinner />

  if (!diag) {
    return (
      <div>
        <SectorTemplates companyId={companyId} sector={sector} />
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold">{t('diag.interviews')}</h3>
          <button className="btn-primary btn-sm ms-auto" onClick={() => setShowForm(!showForm)}>
            {t('diag.new')}</button>
        </div>

        {showForm && (
          <div className="card mb-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
              <div><label className="flabel">{t('diag.service')}</label>
                <input className="input" value={form.service}
                       onChange={(e) => setForm({ ...form, service: e.target.value })} /></div>
              <div><label className="flabel">{t('diag.respondent')}</label>
                <input className="input" value={form.respondent_name}
                       onChange={(e) => setForm({ ...form, respondent_name: e.target.value })} /></div>
              <div><label className="flabel">{t('diag.role')}</label>
                <input className="input" value={form.respondent_role}
                       onChange={(e) => setForm({ ...form, respondent_role: e.target.value })} /></div>
              <div><label className="flabel">{t('diag.relatedProcessing')}</label>
                <select className="input" value={form.processing}
                        onChange={(e) => setForm({ ...form, processing: e.target.value })}>
                  <option value="">—</option>
                  {(procs ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary btn-sm" disabled={createDiag.isPending}
                      onClick={() => createDiag.mutate(form)}>{t('missions.save')}</button>
              <button className="btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm(emptyForm) }}>
                {t('missions.cancel')}</button>
            </div>
          </div>
        )}

        {!diags.length && !showForm && (
          <div className="card text-center py-10">
            <p className="text-ink-secondary">{t('diag.empty')}</p>
          </div>
        )}

        {!!diags.length && (
          <div className="card p-0 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead><tr>
                <th className="th">{t('diag.service')}</th><th className="th">{t('diag.respondent')}</th>
                <th className="th">{t('diag.relatedProcessing')}</th><th className="th">{t('proc.status')}</th>
                <th className="th"></th>
              </tr></thead>
              <tbody>
                {diags.map((d) => (
                  <tr key={d.id} className="hover:bg-primary-50">
                    <td className="td">{d.service || '—'}</td>
                    <td className="td">{d.respondent_name || '—'}</td>
                    <td className="td">{d.processing_name || '—'}</td>
                    <td className="td"><StatusBadge status={d.status} /></td>
                    <td className="td">
                      <button className="btn-ghost btn-sm" onClick={() => setSelectedId(d.id)}>
                        {t('diaglist.open')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn-ghost btn-sm" onClick={() => setSelectedId(null)}>← {t('diag.interviews')}</button>
        <div className="text-sm text-ink-secondary">
          {[diag.service, diag.respondent_name, diag.processing_name].filter(Boolean).join(' · ')}
        </div>
      </div>
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
        <QuestionCard key={q.code} q={q} lang={lang} t={t} answer={answer}
                      dismissedKnown={dismissedKnown} setDismissedKnown={setDismissedKnown} />
      ))}
    </div>
  )
}

function QuestionCard({ q, lang, t, answer, dismissedKnown, setDismissedKnown }) {
  const [comment, setComment] = useState('')
  const dismissed = dismissedKnown[q.code]
  const submit = (value, extra = {}) => answer.mutate({ code: q.code, value, comment, ...extra })
  return (
    <div className="card mb-3">
      <div className="flex gap-3 items-start">
        <span className="data text-xs text-ink-muted pt-1">{q.code}</span>
        <p className="font-semibold text-sm flex-1">{lang === 'ar' && q.text_ar ? q.text_ar : q.text_fr}</p>
      </div>
      {(q.rationale_fr || q.rationale_ar) && (
        <p className="text-xs text-ink-muted mt-1" style={{ marginInlineStart: 44 }}>
          {t('diag.why')} {lang === 'ar' && q.rationale_ar ? q.rationale_ar : q.rationale_fr}
        </p>
      )}
      {q.known && !q.answer && !dismissed && (
        <div className="mt-2 rounded-lg py-2 px-3 text-xs" style={{ marginInlineStart: 44,
             background: 'var(--status-averifier-bg)', color: 'var(--status-averifier)' }}>
          <div className="mb-1"><b>{t('diag.known')}</b> {q.known.value}</div>
          <div className="flex gap-2">
            <button className="btn-primary btn-sm py-1" onClick={() => submit(q.known.value)}>
              {t('diag.use')}</button>
            <button className="btn-ghost btn-sm py-1"
                    onClick={() => setDismissedKnown((s) => ({ ...s, [q.code]: true }))}>
              {t('diag.editKnown')}</button>
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        {['oui', 'non'].map((v) => (
          <button key={v}
            className={q.answer === v ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => submit(v)}>
            {v === 'oui' ? t('diag.yes') : t('diag.no')}
          </button>
        ))}
      </div>
      {q.answer && (
        <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <input className="input py-1 text-xs" placeholder={t('diag.comment')} value={comment}
                 onChange={(e) => setComment(e.target.value)} />
          <input type="file" className="text-xs"
                 onChange={(e) => e.target.files[0] && submit(q.answer, { evidence: e.target.files[0] })} />
          <button className="btn-secondary btn-sm py-1" onClick={() => submit(q.answer)}>
            {t('missions.save')}</button>
        </div>
      )}
    </div>
  )
}

function ProcessingsTab({ companyId, sector }) {
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
    <div>
      <SectorTemplates companyId={companyId} sector={sector} />
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
