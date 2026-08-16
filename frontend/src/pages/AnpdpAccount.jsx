import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const FIELDS = [
  { key: 'anpdp_created_at', label: 'anpdp.createdAt', type: 'date' },
  { key: 'anpdp_username', label: 'anpdp.username' },
  { key: 'anpdp_password', label: 'anpdp.password', type: 'password' },
]

export default function AnpdpAccount() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

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
    setForm(Object.fromEntries(FIELDS.map((f) => [f.key, company[f.key]])))
    setShowPassword(false)
    setEditing(true)
  }

  const hasAccount = !!(company.anpdp_username || company.anpdp_password || company.anpdp_created_at)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-xl font-bold">{t('anpdp.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => { setCompanyId(Number(e.target.value)); setEditing(false) }}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <p className="text-sm text-ink-muted mb-5">{t('anpdp.note')}</p>

      <div className="card max-w-xl">
        {!editing && (
          <div className="flex items-center mb-3">
            <button className="btn-secondary btn-sm ms-auto" onClick={startEdit}>{t('companies.edit')}</button>
          </div>
        )}

        {editing ? (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
              {FIELDS.map((f) => (
                <div key={f.key}><label className="flabel">{t(f.label)}</label>
                  {f.key === 'anpdp_password' ? (
                    <div className="flex gap-2">
                      <input className="input" type={showPassword ? 'text' : 'password'} value={form[f.key] || ''}
                             autoComplete="new-password"
                             onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                      <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? t('anpdp.hide') : t('anpdp.show')}
                      </button>
                    </div>
                  ) : (
                    <input className="input" type={f.type || 'text'} value={form[f.key] || ''}
                           onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary btn-sm" disabled={update.isPending}
                      onClick={() => update.mutate(form)}>{t('companies.save')}</button>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>{t('companies.cancel')}</button>
            </div>
          </>
        ) : hasAccount ? (
          <>
            <div className="flex gap-4 py-2 border-b border-line text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t('anpdp.createdAt')}</span>
              <span className="min-w-0 data">{company.anpdp_created_at || '—'}</span>
            </div>
            <div className="flex gap-4 py-2 border-b border-line text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t('anpdp.username')}</span>
              <span className="min-w-0">{company.anpdp_username || '—'}</span>
            </div>
            <div className="flex gap-4 py-2 text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t('anpdp.password')}</span>
              <span className="min-w-0 data">
                {company.anpdp_password ? (showPassword ? company.anpdp_password : '••••••••') : '—'}
              </span>
              {!!company.anpdp_password && (
                <button className="btn-ghost btn-sm" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? t('anpdp.hide') : t('anpdp.show')}
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-muted">{t('anpdp.empty')}</p>
        )}
      </div>
    </div>
  )
}
