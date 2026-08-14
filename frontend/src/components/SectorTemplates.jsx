import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'

const norm = (s) => (s || '').trim().toLowerCase()

function buildDescription(tpl, lang, t) {
  const pick = (fr, ar) => (lang === 'ar' && ar ? ar : fr)
  const category = pick(tpl.category_fr, tpl.category_ar)
  const subjects = pick(tpl.subject_categories_fr, tpl.subject_categories_ar)
  const data = pick(tpl.data_categories_fr, tpl.data_categories_ar)
  const bits = [category]
  if (subjects) bits.push(`${t('sectorTpl.subjects')} : ${subjects}`)
  if (data) bits.push(`${t('sectorTpl.dataCats')} : ${data}`)
  return bits.filter(Boolean).join('\n\n')
}

export default function SectorTemplates({ companyId, sector }) {
  const { t, lang } = useApp()
  const qc = useQueryClient()
  const [addedIds, setAddedIds] = useState({})
  const { data: templates } = useQuery({ queryKey: ['processing-templates'],
    queryFn: () => api.get('/processing-templates/').then((r) => r.data) })
  const { data: existing } = useQuery({ queryKey: ['processings', companyId], enabled: !!companyId,
    queryFn: () => api.get(`/processings/?company=${companyId}`).then((r) => r.data) })

  const create = useMutation({
    mutationFn: (body) => api.post('/processings/', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['processings', companyId] }),
  })

  if (!sector || !templates) return null
  const existingNames = new Set((existing ?? []).map((p) => norm(p.name)))
  const matches = templates.filter((tpl) =>
    (norm(tpl.domain_fr) === norm(sector) || norm(tpl.domain_ar) === norm(sector))
    && !existingNames.has(norm(tpl.name_fr)) && !existingNames.has(norm(tpl.name_ar)))
  if (!matches.length) return null

  const addOne = (tpl) => {
    setAddedIds((s) => ({ ...s, [tpl.id]: true }))
    create.mutate({
      company: companyId,
      name: lang === 'ar' && tpl.name_ar ? tpl.name_ar : tpl.name_fr,
      purpose: lang === 'ar' && tpl.purpose_ar ? tpl.purpose_ar : tpl.purpose_fr,
      retention_duration: lang === 'ar' && tpl.retention_ar ? tpl.retention_ar : tpl.retention_fr,
      description: buildDescription(tpl, lang, t),
    })
  }

  return (
    <div className="card mb-4">
      <h3 className="font-semibold mb-1">{t('sectorTpl.title')}</h3>
      <p className="text-xs text-ink-muted mb-3">{t('sectorTpl.hint').replace('{sector}', sector)}</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
        {matches.map((tpl) => (
          <div key={tpl.id} className="rounded-lg border border-line p-3">
            <div className="text-sm font-semibold">{lang === 'ar' && tpl.name_ar ? tpl.name_ar : tpl.name_fr}</div>
            <p className="text-xs text-ink-secondary mt-1 line-clamp-3">
              {lang === 'ar' && tpl.purpose_ar ? tpl.purpose_ar : tpl.purpose_fr}
            </p>
            <div className="text-xs text-ink-muted mt-1">
              {lang === 'ar' && tpl.retention_ar ? tpl.retention_ar : tpl.retention_fr}
            </div>
            <button className="btn-secondary btn-sm mt-2" disabled={addedIds[tpl.id]}
                    onClick={() => addOne(tpl)}>
              {addedIds[tpl.id] ? t('sectorTpl.added') : t('sectorTpl.add')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
