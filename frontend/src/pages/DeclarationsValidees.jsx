import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'
import DocumentPreviewModal from '../components/DocumentPreviewModal'

const COLUMNS = [
  { key: 'domain', fr: 'domain_fr', ar: 'domain_ar', label: 'colDomain' },
  { key: 'name', fr: 'name_fr', ar: 'name_ar', label: 'colName' },
  { key: 'purpose', fr: 'purpose_fr', ar: 'purpose_ar', label: 'colPurpose' },
  { key: 'category', fr: 'category_fr', ar: 'category_ar', label: 'colCategory' },
  { key: 'subjects', fr: 'subject_categories_fr', ar: 'subject_categories_ar', label: 'colSubjects' },
  { key: 'data', fr: 'data_categories_fr', ar: 'data_categories_ar', label: 'colData' },
  { key: 'retention', fr: 'retention_fr', ar: 'retention_ar', label: 'colRetention' },
]

const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD')
  .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')

export default function DeclarationsValidees() {
  const { t, lang } = useApp()
  const isAr = lang === 'ar'
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [previewing, setPreviewing] = useState(null) // { id, title }

  const { data: templates } = useQuery({ queryKey: ['processing-templates'],
    queryFn: () => api.get('/processing-templates/').then((r) => r.data) })
  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ['declarations-preview', previewing?.id, lang], enabled: !!previewing,
    queryFn: () => api.get(`/processing-templates/${previewing.id}/preview/?lang=${lang}`).then((r) => r.data) })

  const rows = useMemo(() => (templates ?? []).map((tpl) => {
    const row = { id: tpl.id }
    COLUMNS.forEach((c) => { row[c.key] = (isAr && tpl[c.ar] ? tpl[c.ar] : tpl[c.fr]) || '' })
    return row
  }), [templates, isAr])

  const optionsFor = (key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort()

  const filtered = useMemo(() => {
    const q = normalize(search)
    return rows.filter((r) => {
      for (const c of COLUMNS) {
        if (filters[c.key] && r[c.key] !== filters[c.key]) return false
      }
      if (!q) return true
      return normalize(COLUMNS.map((c) => r[c.key]).join(' ')).includes(q)
    })
  }, [rows, filters, search])

  const setFilter = (key, value) => setFilters({ ...filters, [key]: value })
  const resetAll = () => { setSearch(''); setFilters({}) }
  const hasActiveFilters = !!search || Object.values(filters).some(Boolean)

  if (!templates) return <Spinner />

  return (
    <div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <h1 className="text-xl font-bold">{t('bddCatalog.title')}</h1>
        <button className="btn-ghost btn-sm ms-auto" disabled={!hasActiveFilters} onClick={resetAll}>
          {t('bddCatalog.reset')}
        </button>
      </div>
      <p className="text-sm text-ink-muted mb-4">{t('bddCatalog.intro')}</p>

      <div className="card mb-4">
        <input className="input mb-4" placeholder={t('bddCatalog.search')} value={search}
               onChange={(e) => setSearch(e.target.value)} />
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {COLUMNS.map((c) => (
            <div key={c.key}>
              <label className="flabel">{t(`bddCatalog.${c.label}`)}</label>
              <select className="input" value={filters[c.key] || ''} onChange={(e) => setFilter(c.key, e.target.value)}>
                <option value="">{t('bddCatalog.all')}</option>
                {optionsFor(c.key).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-ink-secondary mb-2">
        {filtered.length} {filtered.length > 1 ? t('bddCatalog.resultsPlural') : t('bddCatalog.results')}
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <thead><tr>
            {COLUMNS.map((c) => <th key={c.key} className="th">{t(`bddCatalog.${c.label}`)}</th>)}
            <th className="th"></th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-primary-50">
                <td className="td font-semibold">{r.domain}</td>
                <td className="td">{r.name}</td>
                <td className="td text-sm">{r.purpose}</td>
                <td className="td text-sm">{r.category}</td>
                <td className="td text-sm">{r.subjects}</td>
                <td className="td text-sm">{r.data}</td>
                <td className="td text-sm">{r.retention}</td>
                <td className="td">
                  <button className="btn-ghost btn-sm" onClick={() => setPreviewing({ id: r.id, title: r.name })}>
                    {t('docValide.preview')}
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td className="td text-ink-muted" colSpan={COLUMNS.length + 1}>{t('bddCatalog.empty')}</td></tr>}
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
