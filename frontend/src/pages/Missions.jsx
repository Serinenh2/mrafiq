import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

export default function Missions() {
  const { t } = useApp()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const emptyForm = { company: '', consultant: '', subject: '', scope: '', start_date: '', end_date: '' }
  const [form, setForm] = useState(emptyForm)

  const { data: missions, isLoading } = useQuery({ queryKey: ['missions'],
    queryFn: () => api.get('/missions/').then((r) => r.data.results ?? r.data) })
  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const { data: consultants } = useQuery({ queryKey: ['consultants'],
    queryFn: () => api.get('/consultants/').then((r) => r.data) })

  const create = useMutation({
    mutationFn: (body) => api.post('/missions/', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); setShowForm(false); setForm(emptyForm) },
  })

  if (isLoading) return <Spinner />
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('missions.title')}</h1>
        <button className="btn-primary btn-sm ms-auto" onClick={() => setShowForm(!showForm)}>
          {t('missions.add')}</button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <div><label className="flabel">{t('missions.company')} *</label>
              <select className="input" value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}>
                <option value="">—</option>
                {(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="flabel">{t('missions.consultant')}</label>
              <select className="input" value={form.consultant}
                      onChange={(e) => setForm({ ...form, consultant: e.target.value })}>
                <option value="">—</option>
                {(consultants ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{`${u.first_name} ${u.last_name}`.trim() || u.username}</option>
                ))}
              </select></div>
            <div><label className="flabel">{t('missions.subject')} *</label>
              <input className="input" value={form.subject}
                     onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><label className="flabel">{t('missions.startDate')}</label>
              <input className="input" type="date" value={form.start_date}
                     onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="flabel">{t('missions.endDate')}</label>
              <input className="input" type="date" value={form.end_date}
                     onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><label className="flabel">{t('missions.scope')}</label>
              <input className="input" value={form.scope}
                     onChange={(e) => setForm({ ...form, scope: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary btn-sm" disabled={!form.company || !form.subject || create.isPending}
                    onClick={() => create.mutate({ ...form, company: Number(form.company),
                      consultant: form.consultant ? Number(form.consultant) : null })}>
              {t('missions.save')}</button>
            <button className="btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm(emptyForm) }}>
              {t('missions.cancel')}</button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead><tr>
            <th className="th">{t('missions.reference')}</th><th className="th">{t('missions.subject')}</th>
            <th className="th">{t('missions.company')}</th><th className="th">{t('missions.consultant')}</th>
            <th className="th">{t('proc.status')}</th>
          </tr></thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id} className="hover:bg-primary-50">
                <td className="td data">{m.reference}</td>
                <td className="td"><Link className="font-semibold" to={`/missions/${m.id}`}>{m.subject}</Link></td>
                <td className="td">{m.company_name}</td>
                <td className="td">{m.consultant_name || '—'}</td>
                <td className="td"><StatusBadge status={m.status} /></td>
              </tr>
            ))}
            {!missions.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('missions.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
