// Rendu générique d'un champ de questionnaire (texte, choix unique, choix multiple)
// piloté par les schémas déclaratifs de src/data/questionnaireSchema*.js (FR et AR).

function fieldVisible(field, answers) {
  if (!field.showIf) return true
  const { key, equals, includes, notIncludes } = field.showIf
  const dep = answers[key]
  if (equals !== undefined) return dep === equals
  if (includes !== undefined) return Array.isArray(dep) && dep.includes(includes)
  if (notIncludes !== undefined) return !Array.isArray(dep) || !dep.includes(notIncludes)
  return true
}

export default function QuestionnaireField({ field, answers, setAnswers }) {
  if (!fieldVisible(field, answers)) return null
  const value = answers[field.key]
  const otherKey = `${field.key}__autre`
  const set = (v) => setAnswers({ ...answers, [field.key]: v })
  const setOther = (v) => setAnswers({ ...answers, [otherKey]: v })

  if (field.type === 'text') {
    return (
      <div>
        <label className="flabel">{field.label}</label>
        <input className="input" value={value || ''} onChange={(e) => set(e.target.value)} />
      </div>
    )
  }
  if (field.type === 'textarea') {
    return (
      <div>
        <label className="flabel">{field.label}</label>
        <textarea className="input" rows={2} value={value || ''} onChange={(e) => set(e.target.value)} />
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <div>
        <label className="flabel">{field.label}</label>
        <select className="input" value={value || ''} onChange={(e) => set(e.target.value)}>
          <option value="">—</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    )
  }
  if (field.type === 'radio') {
    return (
      <div>
        <label className="flabel">{field.label}</label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {field.options.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name={field.key} checked={value === opt} onChange={() => set(opt)} />
              {opt}
            </label>
          ))}
        </div>
      </div>
    )
  }
  if (field.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : []
    const toggle = (opt) => {
      const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]
      set(next)
    }
    const otherLabel = field.otherLabel || 'Autre'
    const otherChecked = arr.includes(otherLabel)
    return (
      <div>
        <label className="flabel">{field.label}</label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {field.options.map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={arr.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
          {field.other && (
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" checked={otherChecked} onChange={() => toggle(otherLabel)} />
              {otherLabel}
            </label>
          )}
        </div>
        {field.other && otherChecked && (
          <input className="input mt-2" placeholder={field.otherPlaceholder || 'Préciser...'} value={answers[otherKey] || ''}
                 onChange={(e) => setOther(e.target.value)} />
        )}
      </div>
    )
  }
  return null
}
