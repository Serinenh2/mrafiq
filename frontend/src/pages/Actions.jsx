import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { SeverityBadge, Spinner } from '../components/ui'

const COLS = ['a_faire', 'en_cours', 'en_attente', 'termine']

export default function Actions() {
  const { t } = useApp()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['actions-all'],
    queryFn: () => api.get('/actions/').then((r) => r.data) })
  const patch = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/actions/${id}/`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actions-all'] }),
  })
  if (!data) return <Spinner />
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">{t('actions.title')}</h1>
      <div className="grid gap-4 items-start"
           style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>
        {COLS.map((col) => (
          <div key={col} className="rounded-lg p-3 bg-sunken min-h-40">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-secondary px-1 pb-2">
              {t(`status.${col}`)} · <span className="data">{data.filter((a) => a.status === col).length}</span>
            </div>
            {data.filter((a) => a.status === col).map((a) => {
              const late = a.due_date && a.due_date < today && !['termine','valide'].includes(a.status)
              return (
                <div key={a.id} className="card p-3 mb-2 shadow-none">
                  <div className="text-xs data text-ink-muted">{a.reference}</div>
                  <div className="text-sm font-semibold leading-snug">{a.title}</div>
                  <div className="text-xs text-ink-muted mt-1">{a.assignee}
                    {a.due_date && <span className="data ms-2"
                      style={late ? { color: 'var(--status-nonconforme)', fontWeight: 700 } : {}}>
                      {a.due_date}{late ? ` · ${t('actions.late')}` : ''}</span>}</div>
                  <select className="input py-1 text-xs mt-2" value={a.status}
                          onChange={(e) => patch.mutate({ id: a.id, status: e.target.value })}>
                    {[...COLS, 'valide'].map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
