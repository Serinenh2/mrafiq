import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
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
  const { user } = useAuth()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const isOrgUser = user?.role === 'org_user'
  const [tab, setTab] = useState(params.get('tab') || (isOrgUser ? 'diagnostic' : 'info'))
  const [notice, setNotice] = useState('')

  const { data: company } = useQuery({ queryKey: ['company', id],
    queryFn: () => api.get(`/companies/${id}/`).then((r) => r.data) })
  const { data: score } = useQuery({ queryKey: ['score', id], enabled: !isOrgUser,
    queryFn: () => api.get(`/companies/${id}/score/`).then((r) => r.data) })

  const runEngine = useMutation({
    mutationFn: () => api.post(`/companies/${id}/compliance/run/`),
    onSuccess: () => { setNotice(t('company.engineDone'))
      qc.invalidateQueries(); setTimeout(() => setNotice(''), 3000) },
  })

  if (!company) return <Spinner />
  const TABS = isOrgUser ? ['diagnostic'] : ['info', 'organigramme', 'diagnostic', 'processings',
    'sousTraitants', 'securite', 'droits', 'declaration', 'gaps', 'actions']

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">{company.name}</h1>
          <div className="text-xs text-ink-muted">{company.sector} · <span className="data">{company.rc_number}</span></div>
        </div>
        {!isOrgUser && (
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
        )}
      </div>
      {notice && <div className="card mb-4 py-2 text-sm"
        style={{ background: 'var(--status-conforme-bg)', color: 'var(--status-conforme)' }}>{notice}</div>}

      {!isOrgUser && <ComplianceTimeline companyId={id} company={company} score={score} />}

      <div className="flex border-b border-line mb-5 overflow-x-auto">
        {TABS.map((k) => (
          <button key={k} className={tab === k ? 'tab-active' : 'tab'} onClick={() => setTab(k)}>
            {t(`company.tabs.${k}`)}</button>
        ))}
      </div>

      {tab === 'info' && <InfoTab companyId={id} company={company} score={score} lang={lang} t={t} />}
      {tab === 'organigramme' && <OrganigrammeTab companyId={id} />}
      {tab === 'diagnostic' && <DiagnosticTab companyId={id} sector={company.sector} />}
      {tab === 'processings' && <ProcessingsTab companyId={id} sector={company.sector} />}
      {tab === 'sousTraitants' && <SousTraitantsTab companyId={id} />}
      {tab === 'securite' && <SecuriteTab companyId={id} />}
      {tab === 'droits' && <DroitsTab companyId={id} />}
      {tab === 'declaration' && <DeclarationTab companyId={id} />}
      {tab === 'gaps' && <GapsTab companyId={id} />}
      {tab === 'actions' && <ActionsTab companyId={id} />}
    </div>
  )
}

const TIMELINE_PHASES = ['gouvernance', 'cartographie', 'diagnostic', 'documentation', 'declaration', 'conformite', 'suivi']

function ComplianceTimeline({ companyId, company, score }) {
  const { t } = useApp()
  const { data: report } = useQuery({ queryKey: ['validation-check', companyId],
    queryFn: () => api.get(`/companies/${companyId}/validation-check/`).then((r) => r.data) })

  if (!report) return null
  const done = [
    !!company.controller_name && company.dpo_status !== 'aucun',
    report.processings_count > 0,
    score?.global != null,
    report.missing_documents.length === 0,
    report.ready,
    report.open_gaps === 0 && report.processings_count > 0,
  ]
  const firstTodo = done.findIndex((d) => !d)
  const stateOf = (i) => {
    if (i === 6) return 'current'
    if (done[i]) return 'done'
    return (firstTodo === i || firstTodo === -1) ? 'current' : 'todo'
  }
  const TONE = { done: 'var(--status-conforme)', current: 'var(--status-averifier)', todo: 'var(--status-manquant)' }

  return (
    <div className="card mb-4 overflow-x-auto">
      <div className="flex items-center" style={{ minWidth: 700 }}>
        {TIMELINE_PHASES.map((p, i) => (
          <div key={p} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 84 }}>
              <div className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                   style={{ width: 26, height: 26, background: TONE[stateOf(i)], color: '#fff' }}>
                {i + 1}
              </div>
              <span className="text-[11px] text-center text-ink-secondary leading-tight" style={{ maxWidth: 88 }}>
                {t(`timeline.${p}`)}</span>
            </div>
            {i < TIMELINE_PHASES.length - 1 && (
              <div className="flex-1 h-[2px] mx-1" style={{ background: 'var(--line)' }} />
            )}
          </div>
        ))}
      </div>
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
    ['companies.nif', company.nif], ['companies.nis', company.nis],
    ['companies.address', company.address], ['companies.wilaya', company.wilaya],
    ['companies.commune', company.commune], ['companies.website', company.website],
    ['companies.employees', company.employees_count],
    ['companies.contactName', company.contact_name], ['companies.contactEmail', company.contact_email],
    ['companies.contactPhone', company.contact_phone],
    ['companies.itSystems', company.it_systems], ['companies.itProviders', company.it_providers],
    ['companies.internalOrganisation', company.internal_organisation],
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

function DepartmentForm({ form, setForm, onSave, onCancel, saving, t }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="card mb-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <div><label className="flabel">{t('org.department')} *</label>
          <input className="input" value={form.name} onChange={set('name')} /></div>
        <div><label className="flabel">{t('org.managerName')}</label>
          <input className="input" value={form.manager_name} onChange={set('manager_name')} /></div>
        <div><label className="flabel">{t('org.managerPhone')}</label>
          <input className="input" value={form.manager_phone} onChange={set('manager_phone')} /></div>
        <div><label className="flabel">{t('org.managerEmail')}</label>
          <input className="input" type="email" value={form.manager_email} onChange={set('manager_email')} /></div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-primary btn-sm" disabled={!form.name || saving} onClick={onSave}>
          {t('missions.save')}</button>
        <button className="btn-ghost btn-sm" onClick={onCancel}>{t('missions.cancel')}</button>
      </div>
    </div>
  )
}

const EMPTY_DEPARTMENT = { name: '', manager_name: '', manager_phone: '', manager_email: '' }

function OrganigrammeTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_DEPARTMENT)

  const { data: departments } = useQuery({ queryKey: ['departments', companyId],
    queryFn: () => api.get(`/departments/?company=${companyId}`).then((r) => r.data.results ?? r.data) })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['departments', companyId] })
  const create = useMutation({
    mutationFn: (body) => api.post('/departments/', { company: companyId, ...body }),
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_DEPARTMENT) },
  })
  const update = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/departments/${id}/`, body),
    onSuccess: () => { invalidate(); setEditingId(null); setForm(EMPTY_DEPARTMENT) },
  })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/departments/${id}/`), onSuccess: invalidate })

  const startEdit = (d) => {
    setEditingId(d.id); setShowForm(false)
    setForm({ name: d.name, manager_name: d.manager_name,
      manager_phone: d.manager_phone, manager_email: d.manager_email })
  }
  const startAdd = () => { setEditingId(null); setForm(EMPTY_DEPARTMENT); setShowForm(true) }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold">{t('org.title')}</h3>
        {!showForm && !editingId && (
          <button className="btn-primary btn-sm ms-auto" onClick={startAdd}>{t('org.add')}</button>
        )}
      </div>

      {showForm && (
        <DepartmentForm form={form} setForm={setForm} saving={create.isPending} t={t}
          onSave={() => create.mutate(form)} onCancel={() => setShowForm(false)} />
      )}

      {!departments ? <Spinner /> : !departments.length && !showForm ? (
        <div className="card text-center py-10"><p className="text-ink-secondary">{t('org.empty')}</p></div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          {departments.map((d) => editingId === d.id ? (
            <DepartmentForm key={d.id} form={form} setForm={setForm} saving={update.isPending} t={t}
              onSave={() => update.mutate({ id: d.id, body: form })} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={d.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{d.name}</div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn-ghost btn-sm py-0.5 px-1.5" onClick={() => startEdit(d)}>
                    {t('companies.edit')}</button>
                  <button className="btn-ghost btn-sm py-0.5 px-1.5" style={{ color: 'var(--status-nonconforme)' }}
                          onClick={() => remove.mutate(d.id)}>{t('org.delete')}</button>
                </div>
              </div>
              <div className="text-sm mt-2">{d.manager_name || '—'}</div>
              <div className="text-xs text-ink-muted mt-1 data">{d.manager_phone || '—'}</div>
              <div className="text-xs text-ink-muted">{d.manager_email || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EMPTY_PROCESSOR = { name: '', contact: '', service: '', has_contract: false,
  contract_date: '', notes: '', data_access: [] }

function ProcessorForm({ form, setForm, onSave, onCancel, saving, refs, t }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleData = (id) => setForm({ ...form, data_access: form.data_access.includes(id)
    ? form.data_access.filter((x) => x !== id) : [...form.data_access, id] })
  return (
    <div className="card mb-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <div><label className="flabel">{t('proc.subName')} *</label>
          <input className="input" value={form.name} onChange={set('name')} /></div>
        <div><label className="flabel">{t('proc.subContact')}</label>
          <input className="input" value={form.contact} onChange={set('contact')} /></div>
        <div><label className="flabel">{t('proc.subService')}</label>
          <input className="input" value={form.service} onChange={set('service')} /></div>
        <div><label className="flabel">{t('proc.subContractDate')}</label>
          <input className="input" type="date" value={form.contract_date || ''} onChange={set('contract_date')} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm mt-3">
        <input type="checkbox" checked={form.has_contract}
               onChange={(e) => setForm({ ...form, has_contract: e.target.checked })} />
        {t('proc.subHasContract')}
      </label>
      <div className="mt-3">
        <label className="flabel">{t('proc.subContractFile')}</label>
        <input type="file" className="text-xs block mt-1"
               onChange={(e) => setForm({ ...form, contract_file: e.target.files[0] })} />
      </div>
      <div className="mt-3">
        <label className="flabel">{t('proc.subDataAccess')}</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {(refs?.data_categories ?? []).map((r) => (
            <button key={r.id} type="button"
              className="text-xs font-semibold rounded-pill px-3 py-1 border transition-colors"
              style={form.data_access.includes(r.id)
                ? { background: 'var(--brand-primary-600)', color: '#fff', borderColor: 'var(--brand-primary-600)' }
                : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }}
              onClick={() => toggleData(r.id)}>{r.label_fr}</button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <label className="flabel">{t('proc.subNotes')}</label>
        <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-primary btn-sm" disabled={!form.name || saving} onClick={onSave}>
          {t('missions.save')}</button>
        <button className="btn-ghost btn-sm" onClick={onCancel}>{t('missions.cancel')}</button>
      </div>
    </div>
  )
}

function SousTraitantsTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_PROCESSOR)

  const { data: processors } = useQuery({ queryKey: ['processors', companyId],
    queryFn: () => api.get(`/processors/?company=${companyId}`).then((r) => r.data.results ?? r.data) })
  const { data: refs } = useQuery({ queryKey: ['refs'],
    queryFn: () => api.get('/refs/').then((r) => r.data) })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['processors', companyId] })
  const toFormData = (body) => {
    const fd = new FormData()
    Object.entries(body).forEach(([k, v]) => {
      if (k === 'data_access') v.forEach((id) => fd.append('data_access', id))
      else if (v != null && v !== '') fd.append(k, v)
    })
    return fd
  }
  const create = useMutation({
    mutationFn: (body) => api.post('/processors/', toFormData({ company: companyId, ...body })),
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_PROCESSOR) },
  })
  const update = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/processors/${id}/`, toFormData(body)),
    onSuccess: () => { invalidate(); setEditingId(null); setForm(EMPTY_PROCESSOR) },
  })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/processors/${id}/`), onSuccess: invalidate })

  const startEdit = (p) => {
    setEditingId(p.id); setShowForm(false)
    setForm({ name: p.name, contact: p.contact, service: p.service, has_contract: p.has_contract,
      contract_date: p.contract_date || '', notes: p.notes, data_access: p.data_access })
  }
  const startAdd = () => { setEditingId(null); setForm(EMPTY_PROCESSOR); setShowForm(true) }

  if (!processors || !refs) return <Spinner />

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold">{t('proc.subtitle')}</h3>
        {!showForm && !editingId && (
          <button className="btn-primary btn-sm ms-auto" onClick={startAdd}>{t('proc.subAdd')}</button>
        )}
      </div>

      {showForm && (
        <ProcessorForm form={form} setForm={setForm} saving={create.isPending} refs={refs} t={t}
          onSave={() => create.mutate(form)} onCancel={() => setShowForm(false)} />
      )}

      {!processors.length && !showForm ? (
        <div className="card text-center py-10"><p className="text-ink-secondary">{t('proc.subEmpty')}</p></div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
          {processors.map((p) => editingId === p.id ? (
            <ProcessorForm key={p.id} form={form} setForm={setForm} saving={update.isPending} refs={refs} t={t}
              onSave={() => update.mutate({ id: p.id, body: form })} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="flex gap-1 shrink-0">
                  <button className="btn-ghost btn-sm py-0.5 px-1.5" onClick={() => startEdit(p)}>
                    {t('companies.edit')}</button>
                  <button className="btn-ghost btn-sm py-0.5 px-1.5" style={{ color: 'var(--status-nonconforme)' }}
                          onClick={() => remove.mutate(p.id)}>{t('org.delete')}</button>
                </div>
              </div>
              <div className="text-sm mt-2">{p.service || '—'}</div>
              <div className="text-xs text-ink-muted mt-1">{p.contact || '—'}</div>
              <div className="text-xs mt-2 flex items-center gap-2">
                <span className="badge" style={p.has_contract
                  ? { color: 'var(--status-conforme)', background: 'var(--status-conforme-bg)' }
                  : { color: 'var(--status-manquant)', background: 'var(--status-manquant-bg)' }}>
                  {p.has_contract ? t('proc.subContractYes') : t('proc.subContractNo')}
                </span>
                {p.contract_date && <span className="text-ink-muted data">{p.contract_date}</span>}
              </div>
              {p.contract_file && (
                <a className="text-xs underline block mt-1" href={p.contract_file} target="_blank" rel="noreferrer">
                  {t('docValide.download')}</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SECURITY_ORDER = ['acces', 'authentification', 'mots_de_passe', 'sauvegardes', 'antivirus', 'parefeu',
  'chiffrement', 'journalisation', 'habilitations', 'physique', 'incidents', 'confidentialite',
  'sensibilisation', 'charte']

function SecurityItemCard({ item, onSave, t }) {
  const [notes, setNotes] = useState(item.notes || '')
  return (
    <div className="card mb-3">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm flex-1">{t(`security.items.${item.item}`)}</span>
        <div className="flex gap-2">
          {['oui', 'non'].map((v) => (
            <button key={v}
              className={item.in_place === (v === 'oui') ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => onSave({ in_place: v === 'oui' })}>
              {v === 'oui' ? t('diag.yes') : t('diag.no')}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: '1fr auto' }}>
        <input className="input py-1 text-xs" placeholder={t('security.notes')} value={notes}
               onChange={(e) => setNotes(e.target.value)} onBlur={() => onSave({ notes })} />
        <input type="file" className="text-xs"
               onChange={(e) => e.target.files[0] && onSave({ evidence: e.target.files[0] })} />
      </div>
      {item.evidence && (
        <a className="text-xs underline mt-2 inline-block" href={item.evidence} target="_blank" rel="noreferrer">
          {t('docValide.download')}</a>
      )}
    </div>
  )
}

function SecuriteTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const { data: items } = useQuery({ queryKey: ['security-checklist', companyId],
    queryFn: () => api.get(`/security-checklist/?company=${companyId}`).then((r) => r.data.results ?? r.data) })
  const update = useMutation({
    mutationFn: ({ id, body }) => {
      const fd = new FormData()
      Object.entries(body).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
      return api.patch(`/security-checklist/${id}/`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security-checklist', companyId] }),
  })

  if (!items) return <Spinner />
  const sorted = [...items].sort((a, b) => SECURITY_ORDER.indexOf(a.item) - SECURITY_ORDER.indexOf(b.item))
  const done = items.filter((i) => i.in_place != null).length

  return (
    <div className="max-w-2xl">
      <div className="card mb-4 py-3 text-sm text-ink-secondary">
        {t('security.progress')} : <b className="text-ink">{done} / {items.length}</b>
      </div>
      {sorted.map((it) => (
        <SecurityItemCard key={it.id} item={it} t={t} onSave={(body) => update.mutate({ id: it.id, body })} />
      ))}
    </div>
  )
}

const RIGHTS_ORDER = ['information', 'acces', 'rectification', 'opposition']
const NIVEAU_OPTIONS = ['a_verifier', 'conforme', 'partiel', 'non_conforme']

function RightCard({ item, onSave, t }) {
  const [procedure, setProcedure] = useState(item.procedure || '')
  const [responsable, setResponsable] = useState(item.responsable || '')
  const [delai, setDelai] = useState(item.delai_interne || '')
  return (
    <div className="card mb-3">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-semibold text-sm flex-1">{t(`rights.droits.${item.droit}`)}</span>
        <StatusBadge status={item.niveau} />
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        <div><label className="flabel">{t('rights.mecanisme')}</label>
          <div className="flex gap-2 mt-1">
            {['oui', 'non'].map((v) => (
              <button key={v}
                className={item.mecanisme_existe === (v === 'oui') ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                onClick={() => onSave({ mecanisme_existe: v === 'oui' })}>
                {v === 'oui' ? t('diag.yes') : t('diag.no')}
              </button>
            ))}
          </div></div>
        <div><label className="flabel">{t('rights.responsable')}</label>
          <input className="input" value={responsable} onChange={(e) => setResponsable(e.target.value)}
                 onBlur={() => onSave({ responsable })} /></div>
        <div><label className="flabel">{t('rights.delai')}</label>
          <input className="input" value={delai} onChange={(e) => setDelai(e.target.value)}
                 onBlur={() => onSave({ delai_interne: delai })} /></div>
        <div><label className="flabel">{t('rights.niveau')}</label>
          <select className="input" value={item.niveau} onChange={(e) => onSave({ niveau: e.target.value })}>
            {NIVEAU_OPTIONS.map((n) => <option key={n} value={n}>{t(`status.${n}`)}</option>)}
          </select></div>
      </div>
      <div className="mt-3">
        <label className="flabel">{t('rights.procedure')}</label>
        <textarea className="input" rows={2} value={procedure} onChange={(e) => setProcedure(e.target.value)}
                  onBlur={() => onSave({ procedure })} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={item.formulaire_existe}
                 onChange={(e) => onSave({ formulaire_existe: e.target.checked })} />
          {t('rights.formulaire')}
        </label>
        <input type="file" className="text-xs"
               onChange={(e) => e.target.files[0] && onSave({ preuve: e.target.files[0] })} />
        {item.preuve && (
          <a className="text-xs underline" href={item.preuve} target="_blank" rel="noreferrer">
            {t('docValide.download')}</a>
        )}
      </div>
    </div>
  )
}

function DroitsTab({ companyId }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const { data: items } = useQuery({ queryKey: ['rights-procedures', companyId],
    queryFn: () => api.get(`/rights-procedures/?company=${companyId}`).then((r) => r.data.results ?? r.data) })
  const update = useMutation({
    mutationFn: ({ id, body }) => {
      const fd = new FormData()
      Object.entries(body).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
      return api.patch(`/rights-procedures/${id}/`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rights-procedures', companyId] }),
  })

  if (!items) return <Spinner />
  const sorted = [...items].sort((a, b) => RIGHTS_ORDER.indexOf(a.droit) - RIGHTS_ORDER.indexOf(b.droit))

  return (
    <div className="max-w-2xl">
      {sorted.map((it) => (
        <RightCard key={it.id} item={it} t={t} onSave={(body) => update.mutate({ id: it.id, body })} />
      ))}
    </div>
  )
}

function DeclarationSection({ title, children }) {
  return (
    <div className="card mb-3">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      {children}
    </div>
  )
}

function DeclarationTab({ companyId }) {
  const { t, L } = useApp()
  const { data: report } = useQuery({ queryKey: ['validation-check', companyId],
    queryFn: () => api.get(`/companies/${companyId}/validation-check/`).then((r) => r.data) })

  if (!report) return <Spinner />

  return (
    <div className="max-w-2xl">
      <div className="card mb-4 py-3 text-sm" style={report.ready
        ? { background: 'var(--status-conforme-bg)', color: 'var(--status-conforme)' }
        : { background: 'var(--status-averifier-bg)', color: 'var(--status-averifier)' }}>
        {report.ready ? t('declaration.ready') : t('declaration.notReady')}
      </div>

      {report.missing_profile.length > 0 && (
        <DeclarationSection title={t('declaration.missingProfile')}>
          <ul className="list-disc ps-5 text-sm">
            {report.missing_profile.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </DeclarationSection>
      )}

      <DeclarationSection title={t('declaration.processings')}>
        <p className="text-sm">{t('declaration.processingsCount')} : <b>{report.processings_count}</b>
          {' · '}{t('declaration.toVerify')} : <b>{report.to_verify_processings}</b></p>
        {report.incomplete_processings.length > 0 && (
          <ul className="list-disc ps-5 text-sm mt-2">
            {report.incomplete_processings.map((p) => (
              <li key={p.id}>
                <Link className="underline" to={`/companies/${companyId}/processings/${p.id}`}>
                  {p.reference} · {p.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </DeclarationSection>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <DeclarationSection title={t('declaration.security')}>
          <p className="text-sm">{report.security_total - report.security_todo} / {report.security_total}</p>
        </DeclarationSection>
        <DeclarationSection title={t('declaration.rights')}>
          <p className="text-sm">{4 - report.rights_todo} / 4</p>
        </DeclarationSection>
        <DeclarationSection title={t('declaration.gaps')}>
          <p className="text-sm">{report.open_gaps} ({report.critical_gaps} {t('declaration.critical')})</p>
        </DeclarationSection>
        {report.dpo_alert && (
          <DeclarationSection title={t('declaration.dpo')}>
            <p className="text-sm">{t(`declaration.dpoAlert.${report.dpo_alert}`)}</p>
          </DeclarationSection>
        )}
      </div>

      {report.missing_documents.length > 0 && (
        <DeclarationSection title={t('declaration.missingDocuments')}>
          <ul className="list-disc ps-5 text-sm">
            {report.missing_documents.map((d) => <li key={d.code}>{L(d, 'title_fr', 'title_ar')}</li>)}
          </ul>
        </DeclarationSection>
      )}

      <button className="btn-primary btn-sm mt-2" disabled={report.blocking}
              onClick={() => dl(`/companies/${companyId}/export/declaration.pdf`, `declaration_${companyId}.pdf`)}>
        {t('declaration.generate')}
      </button>
      {report.blocking && <p className="text-xs text-ink-muted mt-2">{t('declaration.blockingHint')}</p>}
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
