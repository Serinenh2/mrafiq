import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

export default function Registre() {
  const { t } = useApp()
  const [q, setQ] = useState('')
  const { data } = useQuery({ queryKey: ['processings-all'],
    queryFn: () => api.get('/processings/').then((r) => r.data) })
  if (!data) return <Spinner />
  const rows = data.filter((p) =>
    (p.name + p.reference + (p.company_name || '')).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('registre.title')}</h1>
        <input className="input ms-auto max-w-60" placeholder={t('registre.search')}
               value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead><tr>
            <th className="th">{t('proc.reference')}</th><th className="th">{t('proc.name')}</th>
            <th className="th">{t('registre.company')}</th><th className="th">{t('proc.status')}</th>
            <th className="th">{t('proc.conformity')}</th>
          </tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-primary-50">
                <td className="td data">{p.reference}</td>
                <td className="td"><Link className="font-semibold"
                  to={`/companies/${p.company}/processings/${p.id}`}>{p.name}</Link></td>
                <td className="td">{p.company_name}</td>
                <td className="td"><StatusBadge status={p.status} /></td>
                <td className="td data">{p.conformity != null ? `${p.conformity} %` : '—'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('common.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
