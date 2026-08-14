import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'
import CompanyForm, { EMPTY_COMPANY } from '../components/CompanyForm'

export default function Companies() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_COMPANY)
  const { data, isLoading } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const create = useMutation({
    mutationFn: (body) => api.post('/companies/', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setShowForm(false); setForm(EMPTY_COMPANY) },
  })

  if (isLoading) return <Spinner />
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('companies.title')}</h1>
        <button className="btn-primary btn-sm ms-auto" onClick={() => setShowForm(!showForm)}>
          {t('companies.add')}</button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <CompanyForm form={form} onChange={setForm} />
          <div className="flex gap-2 mt-4">
            <button className="btn-primary btn-sm" disabled={!form.name || create.isPending}
                    onClick={() => create.mutate(form)}>{t('companies.save')}</button>
            <button className="btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm(EMPTY_COMPANY) }}>
              {t('companies.cancel')}</button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead><tr>
            <th className="th">{t('companies.name')}</th><th className="th">{t('companies.sector')}</th>
            <th className="th">{t('companies.wilaya')}</th><th className="th">{t('companies.employees')}</th>
            <th className="th">{t('companies.processings')}</th>
          </tr></thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-primary-50">
                <td className="td"><Link className="font-semibold" to={`/companies/${c.id}`}>{c.name}</Link>
                  <div className="text-xs text-ink-muted">{c.legal_form}</div></td>
                <td className="td">{c.sector}</td>
                <td className="td data">{c.wilaya}</td>
                <td className="td data">{c.employees_count}</td>
                <td className="td data">{c.processing_count}</td>
              </tr>
            ))}
            {!data.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('common.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
