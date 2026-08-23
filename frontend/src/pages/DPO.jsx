import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const STATUS_OPTIONS = ['aucun', 'en_cours', 'designe']
const STATUS_TONE = {
  aucun: { color: 'var(--status-manquant)', background: 'var(--status-manquant-bg)' },
  en_cours: { color: 'var(--status-averifier)', background: 'var(--status-averifier-bg)' },
  designe: { color: 'var(--status-conforme)', background: 'var(--status-conforme-bg)' },
}
const FIELDS = [
  { key: 'dpo_name', label: 'dpoPage.name' },
  { key: 'dpo_poste', label: 'dpoPage.poste' },
  { key: 'dpo_phone', label: 'dpoPage.phone' },
  { key: 'dpo_email', label: 'dpoPage.email', type: 'email' },
  { key: 'dpo_specialite', label: 'dpoPage.specialite' },
]

export default function DPO() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id
  const company = companies?.find((c) => c.id === cid)

  const { data: generated } = useQuery({ queryKey: ['generated-documents', cid], enabled: !!cid,
    queryFn: () => api.get(`/generated-documents/?company=${cid}`).then((r) => r.data.results ?? r.data) })
  const decisionDocs = (generated ?? []).filter((d) => d.template_category === 'decision')
  const validatedDecision = decisionDocs.find((d) => d.status === 'valide')
  const hasValidatedDecision = !!validatedDecision
  const hasGeneratedDecision = decisionDocs.length > 0

  const update = useMutation({
    mutationFn: (body) => api.patch(`/companies/${cid}/`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setEditing(false) },
  })

  if (!companies) return <Spinner />

  const startEdit = () => {
    setForm({ dpo_status: company.dpo_status, ...Object.fromEntries(FIELDS.map((f) => [f.key, company[f.key]])) })
    setEditing(true)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('dpoPage.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => { setCompanyId(Number(e.target.value)); setEditing(false) }}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card max-w-xl mb-4">
        {!editing && (
          <div className="flex items-center mb-3">
            <span className="badge" style={STATUS_TONE[company.dpo_status]}>
              {t(`dpoPage.statusOptions.${company.dpo_status}`)}
            </span>
            <button className="btn-secondary btn-sm ms-auto" onClick={startEdit}>{t('companies.edit')}</button>
          </div>
        )}

        {editing ? (
          <>
            <label className="flabel">{t('dpoPage.status')}</label>
            <div className="flex flex-wrap gap-2 mb-4 mt-1">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} type="button"
                        className={form.dpo_status === s ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        onClick={() => setForm({ ...form, dpo_status: s })}>
                  {t(`dpoPage.statusOptions.${s}`)}
                </button>
              ))}
            </div>
            {form.dpo_status !== 'aucun' && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
                {FIELDS.map((f) => (
                  <div key={f.key}><label className="flabel">{t(f.label)}</label>
                    <input className="input" type={f.type || 'text'} value={form[f.key] || ''}
                           onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} /></div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button className="btn-primary btn-sm" disabled={update.isPending}
                      onClick={() => update.mutate(form)}>{t('companies.save')}</button>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>{t('companies.cancel')}</button>
            </div>
          </>
        ) : company.dpo_status !== 'aucun' && (
          FIELDS.map((f) => (
            <div key={f.key} className="flex gap-4 py-2 border-b border-line last:border-0 text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t(f.label)}</span>
              <span className="min-w-0">{company[f.key] || '—'}</span>
            </div>
          ))
        )}
      </div>

      {company.dpo_status === 'designe' && (
        <div className="card max-w-xl py-3 text-sm flex items-center gap-3 flex-wrap"
             style={hasValidatedDecision
               ? { background: 'var(--status-conforme-bg)', color: 'var(--status-conforme)' }
               : { background: 'var(--status-averifier-bg)', color: 'var(--status-averifier)' }}>
          <span>
            {hasValidatedDecision ? t('dpoPage.decisionValidated')
              : hasGeneratedDecision ? t('dpoPage.decisionGenerated') : t('dpoPage.decisionMissing')}
            {' '}<Link className="underline font-semibold" to="/documents-valides">{t('dpoPage.goToDocuments')}</Link>
          </span>
          {hasValidatedDecision && company.dpo_name && (
            <a className="btn-primary btn-sm ms-auto" href={validatedDecision.file} target="_blank" rel="noreferrer">
              {t('dpoPage.downloadDecision')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
