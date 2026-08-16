import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'
import QuestionnaireField from '../components/QuestionnaireField'
import {
  ENTREPRISE_FIELDS, ACTIVITIES, FICHE_SECTIONS, DIAG_FIELDS, FINAL_FIELDS,
  RULES, COMPANY_RULES, PRIORITY_ORDER,
} from '../data/questionnaireSchema'
import {
  AR_ENTREPRISE_FIELDS, AR_ACTIVITIES, AR_FICHE_SECTIONS, AR_DIAG_FIELDS, AR_FINAL_FIELDS,
  AR_RULES, AR_COMPANY_RULES, AR_PRIORITY_ORDER,
} from '../data/questionnaireSchema.ar'
import { downloadBlankQuestionnaire, downloadFilledQuestionnaire } from '../utils/questionnaireDocx'

function join(arr) { return Array.isArray(arr) && arr.length ? arr.join(', ') : '—' }

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  URL.revokeObjectURL(a.href)
}

export default function Questionnaire() {
  const { lang, t } = useApp()
  const isAr = lang === 'ar'

  const SCHEMA = isAr
    ? { entreprise: AR_ENTREPRISE_FIELDS, activities: AR_ACTIVITIES, fiche: AR_FICHE_SECTIONS,
        diag: AR_DIAG_FIELDS, final: AR_FINAL_FIELDS, rules: AR_RULES, companyRules: AR_COMPANY_RULES,
        priorityOrder: AR_PRIORITY_ORDER, mainActivityKey: 'mainActivity' }
    : { entreprise: ENTREPRISE_FIELDS, activities: ACTIVITIES, fiche: FICHE_SECTIONS,
        diag: DIAG_FIELDS, final: FINAL_FIELDS, rules: RULES, companyRules: COMPANY_RULES,
        priorityOrder: PRIORITY_ORDER, mainActivityKey: 'sector' }

  const STEPS = [
    t('questionnaire.stepEntreprise'), t('questionnaire.stepActivites'), t('questionnaire.stepFiches'),
    t('questionnaire.stepDiagnostic'), t('questionnaire.stepSynthese'),
  ]

  const { data: templates } = useQuery({ queryKey: ['processing-templates'],
    queryFn: () => api.get('/processing-templates/').then((r) => r.data) })
  const sectorOptions = useMemo(() => [...new Set((templates ?? [])
    .map((tpl) => (isAr && tpl.domain_ar ? tpl.domain_ar : tpl.domain_fr))
    .filter(Boolean))].sort(), [templates, isAr])
  const entrepriseFields = useMemo(() => SCHEMA.entreprise.map((f) =>
    f.key === SCHEMA.mainActivityKey ? { ...f, options: sectorOptions } : f), [SCHEMA.entreprise, SCHEMA.mainActivityKey, sectorOptions])

  const [step, setStep] = useState(0)
  const [company, setCompany] = useState({})
  const [activities, setActivities] = useState([])
  const [activitiesOtherLabel, setActivitiesOtherLabel] = useState('')
  const [traitements, setTraitements] = useState([]) // [{ id, activity, answers }]
  const [activeTraitementIdx, setActiveTraitementIdx] = useState(0)
  const [diagComp, setDiagComp] = useState({})
  const [finalOpen, setFinalOpen] = useState({})

  const toggleActivity = (activity) => {
    const checked = activities.includes(activity)
    if (checked) {
      setActivities(activities.filter((a) => a !== activity))
      setTraitements(traitements.filter((t) => t.activity !== activity))
    } else {
      setActivities([...activities, activity])
      setTraitements([...traitements, { id: `${Date.now()}-${activity}`, activity, answers: {} }])
    }
  }

  const addOtherActivity = () => {
    const label = activitiesOtherLabel.trim()
    if (!label) return
    setTraitements([...traitements, { id: `${Date.now()}-${label}`, activity: label, answers: {} }])
    setActivitiesOtherLabel('')
  }

  const removeTraitement = (id) => {
    setTraitements(traitements.filter((t) => t.id !== id))
    setActiveTraitementIdx(0)
  }

  const setTraitementAnswers = (id, answers) => {
    setTraitements(traitements.map((t) => (t.id === id ? { ...t, answers } : t)))
  }

  const cartographie = useMemo(() => traitements.map((t, i) => ({
    code: `T${String(i + 1).padStart(3, '0')}`,
    nom: t.answers.nom || t.activity,
    service: t.answers.service || '—',
    finalite: join(t.answers.finalites),
    personnes: join(t.answers.personnes),
  })), [traitements])

  const planActions = useMemo(() => {
    const rows = []
    traitements.forEach((t, i) => {
      const code = `T${String(i + 1).padStart(3, '0')}`
      SCHEMA.rules.forEach((rule) => {
        if (rule.test(t.answers)) {
          rows.push({
            id: `${t.id}-${rule.id}`, code, traitement: t.answers.nom || t.activity,
            constat: rule.label, risque: rule.risk, priorite: rule.priority,
            action: rule.action, responsable: t.answers.responsable || '—', document: rule.doc,
          })
        }
      })
    })
    SCHEMA.companyRules.forEach((rule) => {
      if (rule.test(diagComp)) {
        rows.push({
          id: `entreprise-${rule.id}`, code: '—', traitement: t('questionnaire.entrepriseTransversal'),
          constat: rule.label, risque: rule.risk, priorite: rule.priority,
          action: rule.action, responsable: '—', document: rule.doc,
        })
      }
    })
    return rows.sort((a, b) => SCHEMA.priorityOrder[a.priorite] - SCHEMA.priorityOrder[b.priorite])
  }, [traitements, diagComp, SCHEMA.rules, SCHEMA.companyRules, SCHEMA.priorityOrder])

  const exportAll = () => downloadJson(
    { entreprise: company, activites: activities, traitements, diagnosticComplementaire: diagComp, autresTraitements: finalOpen },
    'questionnaire_mrafeq.json',
  )

  const [docBusy, setDocBusy] = useState(null) // 'blank' | 'filled' | null, pendant la génération du .docx

  const handleDownloadBlank = async () => {
    setDocBusy('blank')
    try {
      await downloadBlankQuestionnaire({
        lang, entrepriseFields, activities: SCHEMA.activities, ficheSections: SCHEMA.fiche,
        diagFields: SCHEMA.diag, finalFields: SCHEMA.final,
      })
    } finally { setDocBusy(null) }
  }
  const handleDownloadFilled = async () => {
    setDocBusy('filled')
    try {
      await downloadFilledQuestionnaire({
        lang, entrepriseFields, allActivities: SCHEMA.activities, ficheSections: SCHEMA.fiche,
        diagFields: SCHEMA.diag, finalFields: SCHEMA.final,
        company, activities, traitements, diagComp, finalOpen,
      })
    } finally { setDocBusy(null) }
  }

  const activeTraitement = traitements[activeTraitementIdx]
  const priorityTone = (priorite) => {
    const rank = SCHEMA.priorityOrder[priorite]
    return rank === 0 ? 'nonconforme' : rank === 1 ? 'partiel' : 'conforme'
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h1 className="text-xl font-bold">{t('questionnaire.title')}</h1>
        <div className="ms-auto flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-secondary">{t('questionnaire.downloadLabel')}</span>
          <button className="btn-secondary btn-sm" disabled={!!docBusy} onClick={handleDownloadBlank}>
            {docBusy === 'blank' ? t('questionnaire.generating') : t('questionnaire.blankWord')}
          </button>
          <button className="btn-primary btn-sm" disabled={!!docBusy} onClick={handleDownloadFilled}>
            {docBusy === 'filled' ? t('questionnaire.generating') : t('questionnaire.filledWord')}
          </button>
          <button className="btn-ghost btn-sm" onClick={exportAll}>JSON</button>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-line overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} className={i === step ? 'tab-active' : 'tab'} onClick={() => setStep(i)}>{s}</button>
        ))}
      </div>

      {step === 0 && (
        <div className="card grid gap-4">
          <p className="text-sm text-ink-secondary">{t('questionnaire.entrepriseIntro')}</p>
          {entrepriseFields.map((f) => (
            <QuestionnaireField key={f.key} field={f} answers={company} setAnswers={setCompany} />
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <p className="text-sm text-ink-secondary mb-3">{t('questionnaire.activitiesIntro')}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SCHEMA.activities.map((a) => (
              <label key={a} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={activities.includes(a)} onChange={() => toggleActivity(a)} />
                {a}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input className="input" placeholder={t('questionnaire.otherActivityPlaceholder')} value={activitiesOtherLabel}
                   onChange={(e) => setActivitiesOtherLabel(e.target.value)} />
            <button className="btn-secondary btn-sm shrink-0" onClick={addOtherActivity}>{t('questionnaire.addBtn')}</button>
          </div>
          {!!traitements.length && (
            <div className="mt-4 text-sm text-ink-secondary">
              {traitements.length} {t('questionnaire.potentialCount')} {traitements.map((t2) => t2.activity).join(', ')}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        !traitements.length ? (
          <div className="card text-ink-muted text-sm">{t('questionnaire.noTraitements')}</div>
        ) : (
          <div>
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {traitements.map((tr, i) => (
                <button key={tr.id} className={i === activeTraitementIdx ? 'tab-active' : 'tab'}
                        onClick={() => setActiveTraitementIdx(i)}>
                  {tr.answers.nom || tr.activity}
                </button>
              ))}
            </div>
            {activeTraitement && (
              <div>
                <div className="flex justify-end mb-3">
                  <button className="btn-ghost btn-sm" onClick={() => removeTraitement(activeTraitement.id)}>
                    {t('questionnaire.removeTraitement')}
                  </button>
                </div>
                <div className="grid gap-4">
                  {SCHEMA.fiche.map((section) => (
                    <div key={section.id} className="card grid gap-4">
                      <h2 className="font-semibold text-sm text-ink-secondary uppercase tracking-wide">{section.title}</h2>
                      {section.fields.map((f) => (
                        <QuestionnaireField key={f.key} field={f} answers={activeTraitement.answers}
                          setAnswers={(a) => setTraitementAnswers(activeTraitement.id, a)} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <div className="card grid gap-4">
            <h2 className="font-semibold text-sm text-ink-secondary uppercase tracking-wide">
              {t('questionnaire.diagComplementTitle')}
            </h2>
            {SCHEMA.diag.map((f) => (
              <QuestionnaireField key={f.key} field={f} answers={diagComp} setAnswers={setDiagComp} />
            ))}
          </div>
          <div className="card grid gap-4">
            <h2 className="font-semibold text-sm text-ink-secondary uppercase tracking-wide">{t('questionnaire.finalQuestionTitle')}</h2>
            {SCHEMA.final.map((f) => (
              <QuestionnaireField key={f.key} field={f} answers={finalOpen} setAnswers={setFinalOpen} />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-5">
          <div className="card p-0 overflow-x-auto">
            <div className="p-4 pb-0 font-semibold text-sm text-ink-secondary uppercase tracking-wide">{t('questionnaire.cartoTitle')}</div>
            <table className="w-full min-w-[640px] border-collapse mt-3">
              <thead><tr>
                <th className="th">{t('questionnaire.thCode')}</th><th className="th">{t('questionnaire.thTraitement')}</th>
                <th className="th">{t('questionnaire.thService')}</th><th className="th">{t('questionnaire.thFinalite')}</th>
                <th className="th">{t('questionnaire.thPersonnes')}</th>
              </tr></thead>
              <tbody>
                {cartographie.map((r) => (
                  <tr key={r.code}>
                    <td className="td data font-semibold">{r.code}</td>
                    <td className="td">{r.nom}</td>
                    <td className="td">{r.service}</td>
                    <td className="td text-sm">{r.finalite}</td>
                    <td className="td text-sm">{r.personnes}</td>
                  </tr>
                ))}
                {!cartographie.length && <tr><td className="td text-ink-muted" colSpan={5}>{t('questionnaire.noTraitementRow')}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card p-0 overflow-x-auto">
            <div className="p-4 pb-0 font-semibold text-sm text-ink-secondary uppercase tracking-wide">
              {t('questionnaire.planTitle')} ({planActions.length} {planActions.length > 1 ? t('questionnaire.gapsDetected') : t('questionnaire.gapDetected')})
            </div>
            <table className="w-full min-w-[860px] border-collapse mt-3">
              <thead><tr>
                <th className="th">{t('questionnaire.thTraitement')}</th><th className="th">{t('questionnaire.thConstat')}</th>
                <th className="th">{t('questionnaire.thRisque')}</th><th className="th">{t('questionnaire.thPriorite')}</th>
                <th className="th">{t('questionnaire.thAction')}</th><th className="th">{t('questionnaire.thResponsable')}</th>
                <th className="th">{t('questionnaire.thDocument')}</th>
              </tr></thead>
              <tbody>
                {planActions.map((r) => (
                  <tr key={r.id}>
                    <td className="td text-sm">{r.code !== '—' ? `${r.code} — ${r.traitement}` : r.traitement}</td>
                    <td className="td text-sm">{r.constat}</td>
                    <td className="td text-sm text-ink-secondary">{r.risque}</td>
                    <td className="td">
                      <span className="badge" style={{
                        color: `var(--status-${priorityTone(r.priorite)})`,
                        background: `var(--status-${priorityTone(r.priorite)}-bg)`,
                      }}>{r.priorite}</span>
                    </td>
                    <td className="td text-sm">{r.action}</td>
                    <td className="td text-sm">{r.responsable}</td>
                    <td className="td text-sm">{r.document}</td>
                  </tr>
                ))}
                {!planActions.length && <tr><td className="td text-ink-muted" colSpan={7}>{t('questionnaire.noGapRow')}</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={exportAll}>{t('questionnaire.downloadDossier')}</button>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-5">
        <button className="btn-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('questionnaire.prev')}</button>
        <button className="btn-primary" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>{t('questionnaire.next')}</button>
      </div>
    </div>
  )
}
