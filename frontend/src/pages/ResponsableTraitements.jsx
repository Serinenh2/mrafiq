import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const FIELDS = [
  { key: 'controller_name', label: 'resp.name' },
  { key: 'controller_phone', label: 'resp.phone' },
  { key: 'controller_email', label: 'resp.email', type: 'email' },
]

export default function ResponsableTraitements() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)

  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id
  const company = companies?.find((c) => c.id === cid)

  const { data: dossierItems } = useQuery({ queryKey: ['anpdp-dossier-for-resp', cid], enabled: !!cid,
    queryFn: () => api.get(`/anpdp-dossier/?company=${cid}`).then((r) => r.data.results ?? r.data) })
  const delegationItem = (dossierItems ?? []).find((i) => i.item === 'delegation_signature')

  const update = useMutation({
    mutationFn: (body) => api.patch(`/companies/${cid}/`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setEditing(false) },
  })
  const uploadDelegation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData(); fd.append('file', file); fd.append('available', 'true')
      return api.patch(`/anpdp-dossier/${delegationItem.id}/`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anpdp-dossier-for-resp', cid] }),
  })

  if (!companies) return <Spinner />

  const startEdit = () => {
    setForm(Object.fromEntries([...FIELDS.map((f) => [f.key, company[f.key]]), ['controller_qualite', company.controller_qualite]]))
    setEditing(true)
  }
  const qualiteIsGerant = form?.controller_qualite === 'Gérant'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('resp.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => { setCompanyId(Number(e.target.value)); setEditing(false) }}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card max-w-xl mb-4">
        {!editing && (
          <div className="flex items-center mb-3">
            <button className="btn-secondary btn-sm ms-auto" onClick={startEdit}>{t('companies.edit')}</button>
          </div>
        )}
        {editing ? (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
              <div><label className="flabel">{t('resp.name')}</label>
                <input className="input" value={form.controller_name || ''}
                       onChange={(e) => setForm({ ...form, controller_name: e.target.value })} /></div>

              <div>
                <label className="flabel">{t('resp.qualite')}</label>
                <select className="input" value={qualiteIsGerant ? 'Gérant' : 'Autres'}
                        onChange={(e) => setForm({ ...form, controller_qualite: e.target.value === 'Gérant' ? 'Gérant' : '' })}>
                  <option value="Gérant">{t('resp.gerant')}</option>
                  <option value="Autres">{t('resp.autres')}</option>
                </select>
                {!qualiteIsGerant && (
                  <input className="input mt-2" placeholder={t('resp.posteOccupe')} value={form.controller_qualite || ''}
                         onChange={(e) => setForm({ ...form, controller_qualite: e.target.value })} />
                )}
              </div>

              {FIELDS.slice(1).map((f) => (
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
          <>
            <div className="flex gap-4 py-2 border-b border-line text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t('resp.name')}</span>
              <span className="min-w-0">{company.controller_name || '—'}</span>
            </div>
            <div className="flex gap-4 py-2 border-b border-line text-sm">
              <span className="w-44 shrink-0 text-ink-secondary">{t('resp.qualite')}</span>
              <span className="min-w-0">{company.controller_qualite || '—'}</span>
            </div>
            {FIELDS.slice(1).map((f) => (
              <div key={f.key} className="flex gap-4 py-2 border-b border-line last:border-0 text-sm">
                <span className="w-44 shrink-0 text-ink-secondary">{t(f.label)}</span>
                <span className="min-w-0">{company[f.key] || '—'}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card max-w-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="btn-secondary btn-sm cursor-pointer">
            {t('resp.importDelegation')}
            <input type="file" className="hidden" disabled={!delegationItem}
                   onChange={(e) => e.target.files[0] && uploadDelegation.mutate(e.target.files[0])} />
          </label>
          {delegationItem?.file && (
            <a className="text-xs underline" href={delegationItem.file} target="_blank" rel="noreferrer">
              {t('resp.delegationImported')}</a>
          )}
        </div>
        <p className="text-xs text-ink-muted mt-2">{t('resp.delegationHint')}</p>
      </div>
    </div>
  )
}
