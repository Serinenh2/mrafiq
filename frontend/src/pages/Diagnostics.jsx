import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

export default function Diagnostics() {
  const { t } = useApp()
  const { data } = useQuery({ queryKey: ['diagnostics-all'],
    queryFn: () => api.get('/diagnostics/').then((r) => r.data.results ?? r.data) })
  if (!data) return <Spinner />
  return (
    <div>
      <h1 className="text-xl font-bold mb-5">{t('diaglist.title')}</h1>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead><tr>
            <th className="th">{t('registre.company')}</th>
            <th className="th">{t('diaglist.started')}</th>
            <th className="th">{t('diaglist.answers')}</th>
            <th className="th">{t('proc.status')}</th>
            <th className="th"></th>
          </tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-primary-50">
                <td className="td font-semibold">{d.company_name}</td>
                <td className="td data text-sm">{d.created_at?.slice(0, 10)}</td>
                <td className="td data">{d.answers?.length ?? 0}</td>
                <td className="td"><StatusBadge status={d.status} /></td>
                <td className="td">
                  <Link className="btn-ghost btn-sm" to={`/companies/${d.company}?tab=diagnostic`}>
                    {t('diaglist.open')}</Link>
                </td>
              </tr>
            ))}
            {!data.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('common.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
