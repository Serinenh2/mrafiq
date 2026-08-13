import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

const FIELDS = [
  ['name', 'proc.name'], ['purpose', 'proc.purpose'], ['department', 'proc.department'],
  ['owner_name', 'proc.owner'], ['data_sources', 'proc.sources'],
  ['retention_duration', 'proc.retention'], ['recipients', 'proc.recipients'],
]
const STATUSES = ['propose','brouillon','renseigne','a_verifier','verifie','valide','rejete']
const ASSESS = ['conforme','partiel','non_conforme','manquant','a_verifier']

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

  useEffect(() => { if (proc && !form) setForm(proc) }, [proc])

  const save = useMutation({
    mutationFn: (body) => api.patch(`/processings/${pid}/`, body),
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
                  onClick={() => toggleM2M(field, r.id)}>{L(r)}</button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 mb-6">
        <button className="btn-primary" disabled={save.isPending}
                onClick={() => save.mutate(form)}>{t('proc.save')}</button>
        {saved && <span className="text-sm font-semibold"
                        style={{ color: 'var(--status-conforme)' }}>{t('proc.saved')}</span>}
      </div>

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
