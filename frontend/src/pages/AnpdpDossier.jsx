import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const ANPDP_ORDER = ['formulaire', 'rdv', 'contrat_sous_traitant', 'contrat_destinataire',
  'statuts', 'delegation_signature', 'registre_commerce', 'autorisation_activite']

function DossierItemRow({ item, onSave, t }) {
  return (
    <div className="card mb-3">
      <label className="flex items-start gap-2 text-sm font-semibold cursor-pointer">
        <input type="checkbox" className="mt-1" checked={!!item.available}
               onChange={(e) => onSave({ available: e.target.checked })} />
        <span>{t(`anpdpDossier.items.${item.item}`)}</span>
      </label>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <input type="file" className="file-input"
               onChange={(e) => e.target.files[0] && onSave({ file: e.target.files[0] })} />
        {item.file && (
          <a className="text-xs underline shrink-0" href={item.file} target="_blank" rel="noreferrer">
            {t('docValide.download')}</a>
        )}
      </div>
    </div>
  )
}

export default function AnpdpDossier() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)

  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id

  const { data: items } = useQuery({ queryKey: ['anpdp-dossier', cid], enabled: !!cid,
    queryFn: () => api.get(`/anpdp-dossier/?company=${cid}`).then((r) => r.data.results ?? r.data) })

  const update = useMutation({
    mutationFn: ({ id, body }) => {
      const fd = new FormData()
      Object.entries(body).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
      return api.patch(`/anpdp-dossier/${id}/`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anpdp-dossier', cid] }),
  })

  if (!companies) return <Spinner />

  const sorted = items ? [...items].sort((a, b) => ANPDP_ORDER.indexOf(a.item) - ANPDP_ORDER.indexOf(b.item)) : []
  const done = items ? items.filter((i) => i.available).length : 0

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-xl font-bold">{t('anpdpDossier.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => setCompanyId(Number(e.target.value))}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <p className="text-sm text-ink-muted mb-5">{t('anpdpDossier.note')}</p>

      {!items ? <Spinner /> : (
        <div className="max-w-2xl">
          <div className="card mb-4 py-3 text-sm text-ink-secondary">
            {t('anpdpDossier.progress')} : <b className="text-ink">{done} / {items.length}</b>
          </div>
          {sorted.map((it) => (
            <DossierItemRow key={it.id} item={it} t={t} onSave={(body) => update.mutate({ id: it.id, body })} />
          ))}
        </div>
      )}
    </div>
  )
}
