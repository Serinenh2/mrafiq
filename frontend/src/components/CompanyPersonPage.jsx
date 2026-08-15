import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from './ui'

/** Page générique "une fiche personne par entreprise" (§ Responsable des traitements, § DPO). */
export default function CompanyPersonPage({ titleKey, fields }) {
  const { t } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id
  const company = companies?.find((c) => c.id === cid)

  const update = useMutation({
    mutationFn: (body) => api.patch(`/companies/${cid}/`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setEditing(false) },
  })

  if (!companies) return <Spinner />

  const startEdit = () => {
    setForm(Object.fromEntries(fields.map((f) => [f.key, company[f.key]])))
    setEditing(true)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t(titleKey)}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => { setCompanyId(Number(e.target.value)); setEditing(false) }}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card max-w-xl">
        {!editing && (
          <div className="flex items-center mb-3">
            <button className="btn-secondary btn-sm ms-auto" onClick={startEdit}>{t('companies.edit')}</button>
          </div>
        )}
        {editing ? (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
              {fields.map((f) => (
                <div key={f.key}><label className="flabel">{t(f.label)}</label>
                  <input className="input" type={f.type || 'text'} value={form[f.key] || ''}
                         onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} /></div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary btn-sm" disabled={update.isPending}
                      onClick={() => update.mutate(form)}>{t('companies.save')}</button>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>{t('companies.cancel')}</button>
            </div>
          </>
        ) : (
          fields.map((f) => (
            <div key={f.key} className="flex gap-4 py-2 border-b border-line last:border-0 text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t(f.label)}</span>
              <span className="min-w-0">{company[f.key] || '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
