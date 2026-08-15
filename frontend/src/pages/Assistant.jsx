import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import { Spinner } from '../components/ui'

const QUESTIONS = ['risques', 'incomplets', 'manquantes', 'documents', 'actions_prioritaires',
  'sous_traitants', 'actions_retard', 'synthese', 'services_non_interroges']

const KIND_LABEL_KEY = { INFORMATION_COLLECTEE: 'assistant.kindInfo', ANALYSE: 'assistant.kindAnalyse' }
const KIND_TONE = {
  INFORMATION_COLLECTEE: { color: 'var(--status-manquant)', background: 'var(--status-manquant-bg)' },
  ANALYSE: { color: 'var(--status-averifier)', background: 'var(--status-averifier-bg)' },
}

export default function Assistant() {
  const { t } = useApp()
  const [companyId, setCompanyId] = useState(null)
  const [transcript, setTranscript] = useState([])
  const endRef = useRef(null)

  const { data: companies } = useQuery({ queryKey: ['companies'],
    queryFn: () => api.get('/companies/').then((r) => r.data.results ?? r.data) })
  const cid = companyId ?? companies?.[0]?.id

  const ask = useMutation({
    mutationFn: (q) => api.get(`/companies/${cid}/assistant/?q=${q}`).then((r) => r.data),
    onSuccess: (data, q) => setTranscript((tr) => [...tr, { q, data }]),
  })

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])
  useEffect(() => { setTranscript([]) }, [cid])

  if (!companies) return <Spinner />

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold">{t('assistant.title')}</h1>
        <select className="input w-auto ms-auto" value={cid ?? ''} aria-label={t('carto.pick')}
                onChange={(e) => { setCompanyId(Number(e.target.value)) }}>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card mb-4">
        <p className="text-xs text-ink-muted mb-3">{t('assistant.hint')}</p>
        <div className="flex flex-wrap gap-2">
          {QUESTIONS.map((q) => (
            <button key={q} className="btn-secondary btn-sm" disabled={ask.isPending}
                    onClick={() => ask.mutate(q)}>
              {t(`assistant.questions.${q}`)}
            </button>
          ))}
        </div>
      </div>

      {!transcript.length && !ask.isPending ? (
        <div className="card text-center py-10">
          <p className="text-ink-secondary">{t('assistant.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {transcript.map((entry, i) => (
            <div key={i}>
              <div className="flex justify-end mb-2">
                <div className="rounded-2xl px-4 py-2 text-sm max-w-[70%]"
                     style={{ background: 'var(--brand-primary-600)', color: '#fff' }}>
                  {t(`assistant.questions.${entry.q}`)}
                </div>
              </div>
              <div className="card">
                <span className="badge mb-2 inline-block" style={KIND_TONE[entry.data.kind]}>
                  {t(KIND_LABEL_KEY[entry.data.kind])}
                </span>
                {entry.data.items.length ? (
                  <ul className="text-sm space-y-1">
                    {entry.data.items.map((it, j) => (
                      <li key={j}>• {it.label}{it.ref ? ` — ${it.ref}` : ''}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-ink-secondary">{t('assistant.none')}</p>}
                <p className="text-xs text-ink-muted mt-3">{t('assistant.source')} : {entry.data.source}</p>
                {entry.data.note && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--status-partiel)' }}>
                    {entry.data.note}</p>
                )}
              </div>
            </div>
          ))}
          {ask.isPending && <Spinner />}
          <div ref={endRef} />
        </div>
      )}
    </div>
  )
}
