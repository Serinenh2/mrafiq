import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'
import DocumentPreviewModal from '../components/DocumentPreviewModal'

export default function DocumentsValides() {
  const { t, L, lang } = useApp()
  const qc = useQueryClient()
  const [companyId, setCompanyId] = useState(null)
  const [previewing, setPreviewing] = useState(null) // { title, kind: 'template'|'generated', id }
  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id
  const { data: templates } = useQuery({ queryKey: ['document-templates'],
    queryFn: () => api.get('/document-templates/').then((r) => r.data.results ?? r.data) })
  const { data: generated } = useQuery({ queryKey: ['generated-documents', cid], enabled: !!cid,
    queryFn: () => api.get(`/generated-documents/?company=${cid}`).then((r) => r.data.results ?? r.data) })

  const generate = useMutation({
    mutationFn: (templateId) => api.post(`/document-templates/${templateId}/generate/`, { company: cid }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generated-documents', cid] }),
  })
  const validate = useMutation({
    mutationFn: (docId) => api.post(`/generated-documents/${docId}/validate/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generated-documents', cid] }),
  })
  const modify = useMutation({
    mutationFn: ({ docId, file }) => {
      const fd = new FormData(); fd.append('file', file)
      return api.patch(`/generated-documents/${docId}/`, fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generated-documents', cid] }),
  })

  const previewUrl = previewing && (previewing.kind === 'template'
    ? `/document-templates/${previewing.id}/preview/` : `/generated-documents/${previewing.id}/preview/`)
  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ['doc-preview', previewing?.kind, previewing?.id], enabled: !!previewing,
    queryFn: () => api.get(previewUrl).then((r) => r.data),
  })

  if (!companies || !templates) return <Spinner />

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('docValide.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => setCompanyId(Number(e.target.value))}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        {templates.map((tpl) => {
          const latest = (generated ?? []).find((d) => d.template === tpl.id)
          return (
          <div key={tpl.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold">{L(tpl, 'title_fr', 'title_ar')}</div>
              <span className="badge shrink-0" style={tpl.mergeable
                ? { color: 'var(--status-conforme)', background: 'var(--status-conforme-bg)' }
                : { color: 'var(--status-averifier)', background: 'var(--status-averifier-bg)' }}>
                {tpl.mergeable ? t('docValide.auto') : t('docValide.manual')}
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-2 line-clamp-3">
              {lang === 'ar' && tpl.description_ar ? tpl.description_ar : tpl.description_fr}
            </p>
            {latest && <div className="mt-2"><StatusBadge status={latest.status} /></div>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button className="btn-ghost btn-sm"
                      onClick={() => setPreviewing({ title: L(tpl, 'title_fr', 'title_ar'), kind: 'template', id: tpl.id })}>
                {t('docValide.preview')}
              </button>
              <button className="btn-secondary btn-sm" disabled={generate.isPending || !cid}
                      onClick={() => generate.mutate(tpl.id)}>
                {t('docValide.generate')}
              </button>
              {latest && (
                <>
                  <a className="btn-ghost btn-sm" href={latest.file} target="_blank" rel="noreferrer">
                    {t('docValide.download')}</a>
                  <label className="btn-ghost btn-sm cursor-pointer">
                    {t('docValide.modify')}
                    <input type="file" className="hidden"
                           onChange={(e) => e.target.files[0] && modify.mutate({ docId: latest.id, file: e.target.files[0] })} />
                  </label>
                  {latest.status === 'genere' && (
                    <button className="btn-secondary btn-sm" onClick={() => validate.mutate(latest.id)}>
                      {t('docValide.validate')}</button>
                  )}
                </>
              )}
            </div>
          </div>
          )
        })}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead><tr>
            <th className="th">{t('docValide.document')}</th>
            <th className="th">{t('diaglist.started')}</th>
            <th className="th">{t('proc.status')}</th>
            <th className="th"></th>
          </tr></thead>
          <tbody>
            {(generated ?? []).map((d) => (
              <tr key={d.id} className="hover:bg-primary-50">
                <td className="td font-semibold">{L(d, 'template_title_fr', 'template_title_ar')}</td>
                <td className="td data text-sm">{d.generated_at?.slice(0, 10)}</td>
                <td className="td"><StatusBadge status={d.status} /></td>
                <td className="td whitespace-nowrap">
                  <button className="btn-ghost btn-sm"
                          onClick={() => setPreviewing({ title: L(d, 'template_title_fr', 'template_title_ar'), kind: 'generated', id: d.id })}>
                    {t('docValide.preview')}</button>
                  <a className="btn-ghost btn-sm ms-2" href={d.file} target="_blank" rel="noreferrer">
                    {t('docValide.download')}</a>
                  <label className="btn-ghost btn-sm ms-2 cursor-pointer">
                    {t('docValide.modify')}
                    <input type="file" className="hidden"
                           onChange={(e) => e.target.files[0] && modify.mutate({ docId: d.id, file: e.target.files[0] })} />
                  </label>
                  {d.status === 'genere' && (
                    <button className="btn-secondary btn-sm ms-2" onClick={() => validate.mutate(d.id)}>
                      {t('docValide.validate')}</button>
                  )}
                </td>
              </tr>
            ))}
            {!generated?.length && <tr><td className="td text-ink-muted" colSpan={4}>{t('common.empty')}</td></tr>}
          </tbody>
        </table>
      </div>

      {previewing && (
        <DocumentPreviewModal title={previewing.title} preview={previewData} loading={previewLoading}
                              onClose={() => setPreviewing(null)} />
      )}
    </div>
  )
}
