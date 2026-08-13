import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const dl = async (url, filename) => {
  const r = await api.get(url, { responseType: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(r.data); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

export default function Reports() {
  const { t } = useApp()
  const { data } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  if (!data) return <Spinner />
  return (
    <div>
      <h1 className="text-xl font-bold mb-1">{t('reports.title')}</h1>
      <p className="text-sm text-ink-secondary mb-5">{t('reports.desc')}</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        {data.map((c) => (
          <div key={c.id} className="card">
            <h3 className="font-semibold">{c.name}</h3>
            <div className="text-xs text-ink-muted mb-4">{c.sector} · <span className="data">{c.rc_number}</span></div>
            <div className="flex flex-col gap-2">
              <button className="btn-secondary btn-sm justify-start"
                onClick={() => dl(`/companies/${c.id}/export/registre.xlsx`, `registre_${c.id}.xlsx`)}>
                {t('reports.registre')}</button>
              <button className="btn-secondary btn-sm justify-start"
                onClick={() => dl(`/companies/${c.id}/export/rapport.pdf`, `rapport_${c.id}.pdf`)}>
                {t('reports.rapport')}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="card mt-4 py-3 text-sm"
           style={{ background: 'var(--status-averifier-bg)', color: 'var(--status-averifier)' }}>
        {t('reports.ged')}
      </div>
    </div>
  )
}
