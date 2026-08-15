import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { downloadFile as dl } from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

const FIELDS = [
  ['name', 'proc.name'], ['purpose', 'proc.purpose'], ['department', 'proc.department'],
  ['owner_name', 'proc.owner'], ['data_sources', 'proc.sources'],
  ['retention_duration', 'proc.retention'], ['recipients', 'proc.recipients'],
]
const STATUSES = ['propose','brouillon','renseigne','a_verifier','verifie','valide','rejete']
const ASSESS = ['conforme','partiel','non_conforme','manquant','a_verifier']

function VersionHistory({ pid }) {
  const { t, lang } = useApp()
  const [selected, setSelected] = useState([])
  const { data: history } = useQuery({ queryKey: ['processing-history', pid],
    queryFn: () => api.get(`/processings/${pid}/history/`).then((r) => r.data) })

  if (!history) return null
  const toggle = (i) => setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].slice(-2)))
  const sorted = [...selected].sort((x, y) => x - y)
  const [a, b] = sorted.length === 2 ? sorted.map((i) => history[i]) : [null, null]
  const diffKeys = a && b ? Object.keys(a.new_value || {}).filter((k) =>
    String(a.new_value?.[k] ?? '') !== String(b.new_value?.[k] ?? '')) : []

  return (
    <div className="card mb-4">
      <h3 className="font-semibold mb-3 text-sm">{t('proc.history')}</h3>
      {!history.length ? (
        <p className="text-sm text-ink-secondary">{t('proc.noHistory')}</p>
      ) : (
        <ul className="text-sm space-y-1">
          {history.map((h, i) => {
            const v = h.new_value?.version_major && h.new_value?.version_minor != null
              ? `v${h.new_value.version_major}.${h.new_value.version_minor}` : `#${i + 1}`
            return (
              <li key={h.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
                <span className="data font-semibold">{v}</span>
                <span className="text-ink-muted">
                  {new Date(h.created_at).toLocaleString(lang === 'ar' ? 'ar' : 'fr')}</span>
                <span className="text-ink-muted">— {h.username || '—'}</span>
              </li>
            )
          })}
        </ul>
      )}
      {sorted.length === 2 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase text-ink-muted mb-2">{t('proc.compare')}</h4>
          {diffKeys.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[420px]">
                <thead><tr>
                  <th className="th">{t('proc.field')}</th>
                  <th className="th">{t('proc.before')}</th>
                  <th className="th">{t('proc.after')}</th>
                </tr></thead>
                <tbody>
                  {diffKeys.map((k) => (
                    <tr key={k}>
                      <td className="td data">{k}</td>
                      <td className="td">{a.new_value?.[k] || '—'}</td>
                      <td className="td">{b.new_value?.[k] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-ink-secondary">{t('proc.noDiff')}</p>}
        </div>
      )}
    </div>
  )
}

const EMPTY_DATA_ITEM = { custom_label: '', category: '', is_sensitive: false, source: '',
  purpose: '', retention: '', recipient: '' }

function DataItemForm({ form, setForm, onSave, onCancel, saving, refs, t }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="card mb-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        <div><label className="flabel">{t('proc.dataLabel')}</label>
          <input className="input" value={form.custom_label} onChange={set('custom_label')} /></div>
        <div><label className="flabel">{t('proc.dataCategory')}</label>
          <select className="input" value={form.category} onChange={set('category')}>
            <option value="">—</option>
            {(refs?.data_categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.label_fr}</option>)}
          </select></div>
        <div><label className="flabel">{t('proc.dataSource')}</label>
          <input className="input" value={form.source} onChange={set('source')} /></div>
        <div><label className="flabel">{t('proc.dataRetention')}</label>
          <input className="input" value={form.retention} onChange={set('retention')} /></div>
        <div><label className="flabel">{t('proc.dataRecipient')}</label>
          <input className="input" value={form.recipient} onChange={set('recipient')} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm mt-3">
        <input type="checkbox" checked={form.is_sensitive}
               onChange={(e) => setForm({ ...form, is_sensitive: e.target.checked })} />
        {t('proc.dataSensitive')}
      </label>
      <div className="mt-3">
        <label className="flabel">{t('proc.dataPurpose')}</label>
        <textarea className="input" rows={2} value={form.purpose} onChange={set('purpose')} />
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-primary btn-sm" disabled={(!form.custom_label && !form.category) || saving}
                onClick={onSave}>{t('missions.save')}</button>
        <button className="btn-ghost btn-sm" onClick={onCancel}>{t('missions.cancel')}</button>
      </div>
    </div>
  )
}

function DataItemsSection({ pid, refs }) {
  const { t, lang } = useApp()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_DATA_ITEM)

  const { data: items } = useQuery({ queryKey: ['data-items', pid],
    queryFn: () => api.get(`/processing-data-items/?processing=${pid}`).then((r) => r.data.results ?? r.data) })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['data-items', pid] })
  const create = useMutation({
    mutationFn: (body) => api.post('/processing-data-items/', { processing: pid, ...body, category: body.category || null }),
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_DATA_ITEM) },
  })
  const update = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/processing-data-items/${id}/`, { ...body, category: body.category || null }),
    onSuccess: () => { invalidate(); setEditingId(null); setForm(EMPTY_DATA_ITEM) },
  })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/processing-data-items/${id}/`), onSuccess: invalidate })

  const startEdit = (it) => {
    setEditingId(it.id); setShowForm(false)
    setForm({ custom_label: it.custom_label, category: it.category || '', is_sensitive: it.is_sensitive,
      source: it.source, purpose: it.purpose, retention: it.retention, recipient: it.recipient })
  }

  if (!items) return null
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-semibold text-sm">{t('proc.dataItems')}</h3>
        {!showForm && !editingId && (
          <button className="btn-secondary btn-sm ms-auto"
                  onClick={() => { setEditingId(null); setForm(EMPTY_DATA_ITEM); setShowForm(true) }}>
            {t('proc.dataAdd')}</button>
        )}
      </div>
      {showForm && (
        <DataItemForm form={form} setForm={setForm} saving={create.isPending} refs={refs} t={t}
          onSave={() => create.mutate(form)} onCancel={() => setShowForm(false)} />
      )}
      {!items.length && !showForm ? (
        <p className="text-sm text-ink-secondary">{t('proc.dataEmpty')}</p>
      ) : (
        items.map((it) => editingId === it.id ? (
          <DataItemForm key={it.id} form={form} setForm={setForm} saving={update.isPending} refs={refs} t={t}
            onSave={() => update.mutate({ id: it.id, body: form })} onCancel={() => setEditingId(null)} />
        ) : (
          <div key={it.id} className="flex items-start gap-3 py-2 border-b border-line last:border-0 text-sm">
            <div className="flex-1">
              <div className="font-semibold">
                {it.custom_label || (lang === 'ar' && it.category_label_ar ? it.category_label_ar : it.category_label_fr)}
                {it.is_sensitive && (
                  <span className="badge ms-2"
                        style={{ color: 'var(--status-nonconforme)', background: 'var(--status-nonconforme-bg)' }}>
                    {t('proc.dataSensitive')}</span>
                )}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">
                {[it.source && `${t('proc.dataSource')} : ${it.source}`,
                  it.retention && `${t('proc.dataRetention')} : ${it.retention}`,
                  it.recipient && `${t('proc.dataRecipient')} : ${it.recipient}`].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="btn-ghost btn-sm py-0.5 px-1.5" onClick={() => startEdit(it)}>
                {t('companies.edit')}</button>
              <button className="btn-ghost btn-sm py-0.5 px-1.5" style={{ color: 'var(--status-nonconforme)' }}
                      onClick={() => remove.mutate(it.id)}>{t('org.delete')}</button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function ProcessingSheet() {
  const { id, pid } = useParams()
  const { t, L } = useApp()
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  const { data: proc } = useQuery({ queryKey: ['processing', pid],
    queryFn: () => api.get(`/processings/${pid}/`).then((r) => r.data) })
  const { data: refs } = useQuery({ queryKey: ['refs'],
    queryFn: () => api.get('/refs/').then((r) => r.data) })
  const { data: assessments } = useQuery({ queryKey: ['assessments', pid],
    queryFn: () => api.get(`/assessments/?processing=${pid}`).then((r) => r.data) })
  const { data: processors } = useQuery({ queryKey: ['processors', id],
    queryFn: () => api.get(`/processors/?company=${id}`).then((r) => r.data.results ?? r.data) })

  useEffect(() => { if (proc && !form) setForm(proc) }, [proc])

  const FILE_FIELDS = ['transfer_evidence', 'consent_evidence']
  const save = useMutation({
    mutationFn: (body) => {
      const hasNewFile = FILE_FIELDS.some((k) => body[k] instanceof File)
      if (hasNewFile) {
        const fd = new FormData()
        Object.entries(body).forEach(([k, v]) => {
          if (FILE_FIELDS.includes(k)) { if (v instanceof File) fd.append(k, v) }
          else if (Array.isArray(v)) v.forEach((x) => fd.append(k, x))
          else if (v != null) fd.append(k, v)
        })
        return api.patch(`/processings/${pid}/`, fd)
      }
      const clean = { ...body }
      FILE_FIELDS.forEach((k) => { if (typeof clean[k] === 'string') delete clean[k] })
      return api.patch(`/processings/${pid}/`, clean)
    },
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500)
      qc.invalidateQueries({ queryKey: ['processing', pid] }) },
  })
  const patchAssessment = useMutation({
    mutationFn: ({ aid, status }) => api.patch(`/assessments/${aid}/`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments', pid] })
      qc.invalidateQueries({ queryKey: ['score'] }) },
  })

  if (!form || !refs) return <Spinner />
  const toggleM2M = (field, refId) => {
    const list = form[field].includes(refId)
      ? form[field].filter((x) => x !== refId) : [...form[field], refId]
    setForm({ ...form, [field]: list })
  }
  const M2M = [
    ['subject_categories', 'proc.subjects', refs.subject_categories],
    ['data_categories', 'proc.datas', refs.data_categories],
    ['security_measures', 'proc.security', refs.security_measures],
    ['processors', 'proc.processors', processors ?? []],
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div>
          <div className="text-xs text-ink-muted data">{proc.reference} · <Link to={`/companies/${id}`}
            className="underline">{proc.company_name}</Link></div>
          <h1 className="text-xl font-bold">{t('proc.title')} — {proc.name}</h1>
        </div>
        <div className="ms-auto flex items-center gap-3">
          <span className="text-xs text-ink-muted data">{t('proc.version')} {proc.version}</span>
          <button className="btn-ghost btn-sm"
                  onClick={() => dl(`/processings/${pid}/export/fiche.pdf/`, `fiche_${proc.reference}.pdf`)}>
            {t('proc.exportPdf')}</button>
          <StatusBadge status={form.status} />
          <select className="input w-auto py-1 text-sm" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          {FIELDS.map(([f, label]) => (
            <div key={f}>
              <label className="flabel">{t(label)}</label>
              <input className="input" value={form[f] || ''}
                     onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="flabel">{t('proc.storageType')}</label>
            <select className="input" value={form.storage_type || ''}
                    onChange={(e) => setForm({ ...form, storage_type: e.target.value })}>
              <option value="">—</option>
              <option value="papier">Papier</option>
              <option value="informatique">Informatique</option>
              <option value="mixte">Mixte</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.transfer_abroad}
                   onChange={(e) => setForm({ ...form, transfer_abroad: e.target.checked })} />
            {t('proc.transfer')}</label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.consent_required}
                   onChange={(e) => setForm({ ...form, consent_required: e.target.checked })} />
            {t('proc.consent')}</label>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3 text-sm">{t('proc.recipientsTitle')}</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <div><label className="flabel">{t('proc.recipientCategory')}</label>
            <input className="input" value={form.recipient_category || ''}
                   onChange={(e) => setForm({ ...form, recipient_category: e.target.value })} /></div>
          <div><label className="flabel">{t('proc.recipientFrequency')}</label>
            <input className="input" value={form.recipient_frequency || ''}
                   onChange={(e) => setForm({ ...form, recipient_frequency: e.target.value })} /></div>
          <div><label className="flabel">{t('proc.recipientMode')}</label>
            <input className="input" value={form.recipient_mode || ''}
                   onChange={(e) => setForm({ ...form, recipient_mode: e.target.value })} /></div>
        </div>
        <div className="mt-3">
          <label className="flabel">{t('proc.recipientPurpose')}</label>
          <textarea className="input" rows={2} value={form.recipient_purpose || ''}
                    onChange={(e) => setForm({ ...form, recipient_purpose: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium mt-3">
          <input type="checkbox" checked={form.recipient_has_contract}
                 onChange={(e) => setForm({ ...form, recipient_has_contract: e.target.checked })} />
          {t('proc.recipientHasContract')}</label>
        <div className="mt-3">
          <label className="flabel">{t('proc.recipientSecurity')}</label>
          <textarea className="input" rows={2} value={form.recipient_security_measures || ''}
                    onChange={(e) => setForm({ ...form, recipient_security_measures: e.target.value })} />
        </div>
      </div>

      <DataItemsSection pid={pid} refs={refs} />

      {M2M.map(([field, label, list]) => (
        <div key={field} className="card mb-4">
          <h3 className="font-semibold mb-3 text-sm">{t(label)}</h3>
          <div className="flex flex-wrap gap-2">
            {list.map((r) => {
              const on = form[field].includes(r.id)
              return (
                <button key={r.id}
                  className="text-xs font-semibold rounded-pill px-3 py-1 border transition-colors"
                  style={on
                    ? { background: 'var(--brand-primary-600)', color: '#fff', borderColor: 'var(--brand-primary-600)' }
                    : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }}
                  onClick={() => toggleM2M(field, r.id)}>{r.name ?? L(r)}</button>
              )
            })}
          </div>
        </div>
      ))}

      {form.transfer_abroad && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3 text-sm">{t('proc.transferTitle')}</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div><label className="flabel">{t('proc.transferCountry')}</label>
              <input className="input" value={form.transfer_country || ''}
                     onChange={(e) => setForm({ ...form, transfer_country: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferRecipient')}</label>
              <input className="input" value={form.transfer_recipient || ''}
                     onChange={(e) => setForm({ ...form, transfer_recipient: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferProvider')}</label>
              <input className="input" value={form.transfer_provider || ''}
                     onChange={(e) => setForm({ ...form, transfer_provider: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferMode')}</label>
              <input className="input" value={form.transfer_mode || ''}
                     onChange={(e) => setForm({ ...form, transfer_mode: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferHosting')}</label>
              <input className="input" value={form.transfer_hosting || ''}
                     onChange={(e) => setForm({ ...form, transfer_hosting: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 mt-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div><label className="flabel">{t('proc.transferDataTypes')}</label>
              <textarea className="input" rows={2} value={form.transfer_data_types || ''}
                        onChange={(e) => setForm({ ...form, transfer_data_types: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferDetails')}</label>
              <textarea className="input" rows={2} value={form.transfer_details || ''}
                        onChange={(e) => setForm({ ...form, transfer_details: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.transferGuarantees')}</label>
              <textarea className="input" rows={2} value={form.transfer_guarantees || ''}
                        onChange={(e) => setForm({ ...form, transfer_guarantees: e.target.value })} /></div>
          </div>
          <div className="mt-3">
            <label className="flabel">{t('proc.transferEvidence')}</label>
            <input type="file" className="text-xs block mt-1"
                   onChange={(e) => setForm({ ...form, transfer_evidence: e.target.files[0] })} />
            {typeof form.transfer_evidence === 'string' && form.transfer_evidence && (
              <a className="text-xs underline block mt-1" href={form.transfer_evidence} target="_blank" rel="noreferrer">
                {t('docValide.download')}</a>
            )}
          </div>
        </div>
      )}

      {form.consent_required && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3 text-sm">{t('proc.consentTitle')}</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div><label className="flabel">{t('proc.consentMethod')}</label>
              <input className="input" value={form.consent_method || ''}
                     onChange={(e) => setForm({ ...form, consent_method: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.consentSupport')}</label>
              <input className="input" value={form.consent_support || ''}
                     onChange={(e) => setForm({ ...form, consent_support: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.consentDate')}</label>
              <input className="input" type="date" value={form.consent_date || ''}
                     onChange={(e) => setForm({ ...form, consent_date: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.consentProof')}</label>
              <input className="input" value={form.consent_proof || ''}
                     onChange={(e) => setForm({ ...form, consent_proof: e.target.value })} /></div>
            <div><label className="flabel">{t('proc.consentEvidenceRetention')}</label>
              <input className="input" value={form.consent_evidence_retention || ''}
                     onChange={(e) => setForm({ ...form, consent_evidence_retention: e.target.value })} /></div>
          </div>
          <div className="mt-3">
            <label className="flabel">{t('proc.consentWithdrawal')}</label>
            <textarea className="input" rows={2} value={form.consent_withdrawal || ''}
                      onChange={(e) => setForm({ ...form, consent_withdrawal: e.target.value })} />
          </div>
          <div className="mt-3">
            <label className="flabel">{t('proc.consentEvidence')}</label>
            <input type="file" className="text-xs block mt-1"
                   onChange={(e) => setForm({ ...form, consent_evidence: e.target.files[0] })} />
            {typeof form.consent_evidence === 'string' && form.consent_evidence && (
              <a className="text-xs underline block mt-1" href={form.consent_evidence} target="_blank" rel="noreferrer">
                {t('docValide.download')}</a>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button className="btn-primary" disabled={save.isPending}
                onClick={() => save.mutate(form)}>{t('proc.save')}</button>
        {saved && <span className="text-sm font-semibold"
                        style={{ color: 'var(--status-conforme)' }}>{t('proc.saved')}</span>}
      </div>

      <VersionHistory pid={pid} />

      <div className="card p-0 overflow-x-auto">
        <h3 className="font-semibold p-4 pb-2">{t('proc.assessments')}</h3>
        <table className="w-full min-w-[560px] border-collapse">
          <thead><tr>
            <th className="th">{t('gaps.requirement')}</th><th className="th">{t('gaps.description')}</th>
            <th className="th">{t('proc.status')}</th>
          </tr></thead>
          <tbody>
            {(assessments ?? []).map((a) => (
              <tr key={a.id}>
                <td className="td data">{a.requirement_code}</td>
                <td className="td text-sm">{a.requirement_text}</td>
                <td className="td">
                  <select className="input py-1 text-xs w-auto" value={a.status}
                          onChange={(e) => patchAssessment.mutate({ aid: a.id, status: e.target.value })}>
                    {ASSESS.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
