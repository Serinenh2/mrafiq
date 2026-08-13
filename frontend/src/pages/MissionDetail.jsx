import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { StatusBadge, Spinner } from '../components/ui'

const STATUSES = ['preparation', 'diagnostic', 'cartographie', 'analyse', 'plan_action',
  'mise_conformite', 'verification', 'finalisation', 'cloturee']

export default function MissionDetail() {
  const { id } = useParams()
  const { t } = useApp()
  const qc = useQueryClient()
  const [form, setForm] = useState(null)

  const { data: mission } = useQuery({ queryKey: ['mission', id],
    queryFn: () => api.get(`/missions/${id}/`).then((r) => r.data) })

  useEffect(() => {
    if (mission) setForm({ scope: mission.scope || '', start_date: mission.start_date || '',
      end_date: mission.end_date || '', notes: mission.notes || '' })
  }, [mission])

  const patch = useMutation({
    mutationFn: (body) => api.patch(`/missions/${id}/`, body),
    onSuccess: (r) => qc.setQueryData(['mission', id], r.data),
  })

  if (!mission || !form) return <Spinner />

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">{mission.subject}</h1>
          <div className="text-xs text-ink-muted">
            <span className="data">{mission.reference}</span> ·{' '}
            <Link to={`/companies/${mission.company}`} className="font-medium">{mission.company_name}</Link>
            {mission.consultant_name && <> · {mission.consultant_name}</>}
          </div>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <StatusBadge status={mission.status} />
          <select className="input py-1 text-xs w-auto" value={mission.status}
                  onChange={(e) => patch.mutate({ status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <div><label className="flabel">{t('missions.startDate')}</label>
            <input className="input" type="date" value={form.start_date || ''}
                   onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><label className="flabel">{t('missions.endDate')}</label>
            <input className="input" type="date" value={form.end_date || ''}
                   onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
        </div>
        <div className="mt-4"><label className="flabel">{t('missions.scope')}</label>
          <textarea className="input" rows={3} value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value })} /></div>
        <div className="mt-4"><label className="flabel">{t('missions.notes')}</label>
          <textarea className="input" rows={3} value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="mt-4">
          <button className="btn-primary btn-sm" disabled={patch.isPending}
                  onClick={() => patch.mutate(form)}>{t('missions.save')}</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">{t('missions.quickLinks')}</h3>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary btn-sm" to={`/companies/${mission.company}?tab=diagnostic`}>
            {t('missions.linkDiag')}</Link>
          <Link className="btn-secondary btn-sm" to="/cartographie">{t('missions.linkCarto')}</Link>
          <Link className="btn-secondary btn-sm" to={`/companies/${mission.company}?tab=actions`}>
            {t('missions.linkActions')}</Link>
        </div>
      </div>
    </div>
  )
}
