// Génération de fichiers Word (.docx) pour le Questionnaire MRAFEQ (FR et AR) :
// - une version vierge (questions + espace pour répondre à la main)
// - une version remplie (réponses saisies dans l'application), avec bloc de signature.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx'

const BLANK_LINE = '..........................................................................................'
const RULE_COLOR = '999999'

const CHROME = {
  fr: {
    title: 'Questionnaire de diagnostic des traitements de données à caractère personnel',
    subtitle: 'Plateforme MRAFEQ — Accompagnement à la conformité',
    blank: 'Version vierge — à compléter manuellement',
    filledPrefix: 'Réponses —', noName: 'entreprise non renseignée',
    partie1: "Partie 1 — Identification de l'entreprise",
    partie2: 'Partie 2 — Activités utilisant des données personnelles',
    activitiesQuestion: "Dans quelles activités de l'entreprise recueillez-vous, enregistrez-vous, utilisez-vous ou conservez-vous des informations concernant des personnes ?",
    otherOption: 'Autre',
    fichesTitle: 'Fiches de traitement',
    ficheGeneric: 'Fiche de traitement (à dupliquer pour chaque activité sélectionnée en Partie 2)',
    aucunTraitement: 'Aucun traitement renseigné.',
    traitementPrefix: 'Traitement',
    partieDiag: 'Partie 21 — Questions de diagnostic complémentaires',
    partieFinal: 'Partie 22 — Question ouverte finale',
    validation: 'Validation',
    faitA: 'Fait à ', dateLine: ', le ..... / ..... / ..........',
    nomQualite: "Nom, prénom et qualité du responsable de l'entreprise :",
    signature: 'Signature :',
    filenameBlank: 'questionnaire_mrafeq_vierge.docx',
    filenamePrefix: 'questionnaire_mrafeq_',
  },
  ar: {
    title: 'استبيان تشخيص ومعالجة المعطيات الشخصية داخل المؤسسة',
    subtitle: 'منصة مرافق — المرافقة في الامتثال',
    blank: 'نسخة فارغة — تُعبأ يدوياً',
    filledPrefix: 'إجابات —', noName: 'مؤسسة غير محددة',
    partie1: 'القسم 1 — معلومات المؤسسة',
    partie2: 'القسم 2 — اكتشاف المعالجات',
    activitiesQuestion: 'ما هي العمليات التي تقوم بها المؤسسة والتي تتطلب جمع أو تسجيل أو استعمال معلومات تخص أشخاصاً؟',
    otherOption: 'أخرى',
    fichesTitle: 'بطاقات المعالجة',
    ficheGeneric: 'بطاقة معالجة (تُكرر لكل نشاط يتم اختياره في القسم 2)',
    aucunTraitement: 'لم يتم تحديد أي معالجة.',
    traitementPrefix: 'معالجة',
    partieDiag: 'القسم 21 — أسئلة إضافية للتشخيص الداخلي',
    partieFinal: 'القسم 22 — سؤال ختامي مفتوح',
    validation: 'المصادقة',
    faitA: 'حرر في ', dateLine: '، بتاريخ ..... / ..... / ..........',
    nomQualite: 'اسم ولقب وصفة المسؤول عن المؤسسة:',
    signature: 'التوقيع:',
    filenameBlank: 'questionnaire_mrafeq_farigh.docx',
    filenamePrefix: 'questionnaire_mrafeq_',
  },
}

function label(text, rtl) {
  return new Paragraph({
    spacing: { before: 220, after: 60 }, bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined,
    children: [new TextRun({ text, bold: true, rightToLeft: rtl })],
  })
}
function h1(text, rtl, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 }, text,
    bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined, ...opts,
  })
}
function h2(text, rtl) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 120 }, text,
    bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined,
  })
}
function plain(text, rtl, opts = {}) {
  return new Paragraph({ text, bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined, ...opts })
}
function optionLine(text, checked, filled, rtl) {
  return new Paragraph({
    indent: rtl ? { right: 220 } : { left: 220 }, bidirectional: rtl, alignment: rtl ? AlignmentType.RIGHT : undefined,
    children: [new TextRun({ text: `${filled ? (checked ? '☒' : '☐') : '☐'}  ${text}`, bold: filled && checked, rightToLeft: rtl })],
  })
}

// Rend un champ du schéma en paragraphes docx.
// filled=false  -> formulaire vierge (toutes les questions, lignes/cases à remplir à la main)
// filled=true   -> réponses de `answers` (les champs conditionnels masqués si la condition n'est pas remplie)
function fieldParagraphs(field, answers, filled, rtl, otherOption) {
  if (filled && field.showIf) {
    const { key, equals, includes, notIncludes } = field.showIf
    const dep = answers[key]
    const visible = equals !== undefined ? dep === equals
      : includes !== undefined ? Array.isArray(dep) && dep.includes(includes)
      : notIncludes !== undefined ? !Array.isArray(dep) || !dep.includes(notIncludes)
      : true
    if (!visible) return []
  }
  const value = answers ? answers[field.key] : undefined
  const otherValue = answers ? answers[`${field.key}__autre`] : undefined

  if (field.type === 'text' || field.type === 'select') {
    return [label(field.label, rtl), filled ? plain(value || '—', rtl) : plain(BLANK_LINE, rtl)]
  }
  if (field.type === 'textarea') {
    return [label(field.label, rtl), ...(filled
      ? [plain(value || '—', rtl)]
      : [plain(BLANK_LINE, rtl), plain(BLANK_LINE, rtl), plain(BLANK_LINE, rtl)])]
  }
  if (field.type === 'radio') {
    return [label(field.label, rtl), ...field.options.map((opt) => optionLine(opt, value === opt, filled, rtl))]
  }
  if (field.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : []
    const otherLabel = field.otherLabel || otherOption
    const paras = [label(field.label, rtl), ...field.options.map((opt) => optionLine(opt, arr.includes(opt), filled, rtl))]
    if (field.other) {
      const otherText = filled && arr.includes(otherLabel) ? (otherValue || '—') : BLANK_LINE
      paras.push(optionLine(`${otherLabel} : ${otherText}`, arr.includes(otherLabel), filled, rtl))
    }
    return paras
  }
  return [label(field.label, rtl)]
}

function activitiesParagraphs(allActivities, selected, filled, rtl, chrome) {
  return [
    label(chrome.activitiesQuestion, rtl),
    ...allActivities.map((a) => optionLine(a, (selected || []).includes(a), filled, rtl)),
    optionLine(chrome.otherOption, false, false, rtl),
  ]
}

function signatureBlock(rtl, chrome) {
  return [
    h1(chrome.validation, rtl),
    plain(chrome.faitA + BLANK_LINE.slice(0, 30) + chrome.dateLine, rtl, { spacing: { before: 200 } }),
    label(chrome.nomQualite, rtl),
    plain(BLANK_LINE, rtl),
    label(chrome.signature, rtl),
    new Table({
      width: { size: 45, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [new TableCell({
        children: [plain('', rtl), plain('', rtl), plain('', rtl), plain('', rtl)],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR },
          left: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR },
          right: { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR },
        },
      })] })],
    }),
  ]
}

function ficheSectionsParagraphs(ficheSections, answers, filled, rtl, otherOption) {
  return ficheSections.flatMap((section) => [
    h2(section.title, rtl),
    ...section.fields.flatMap((f) => fieldParagraphs(f, answers, filled, rtl, otherOption)),
  ])
}

function buildDocument({
  filled, lang, entrepriseFields, activities, ficheSections, diagFields, finalFields,
  company, selectedActivities, traitements, diagComp, finalOpen,
}) {
  const rtl = lang === 'ar'
  const chrome = CHROME[rtl ? 'ar' : 'fr']

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, bidirectional: rtl, text: chrome.title }),
    new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: rtl, spacing: { after: 300 },
      children: [new TextRun({ text: chrome.subtitle, italics: true, rightToLeft: rtl })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, bidirectional: rtl, spacing: { after: 400 },
      children: [new TextRun({
        text: filled ? `${chrome.filledPrefix} ${company?.name || chrome.noName}` : chrome.blank,
        bold: true, rightToLeft: rtl,
      })] }),

    h1(chrome.partie1, rtl),
    ...entrepriseFields.flatMap((f) => fieldParagraphs(f, company, filled, rtl, chrome.otherOption)),

    h1(chrome.partie2, rtl),
    ...activitiesParagraphs(activities, selectedActivities, filled, rtl, chrome),
  ]

  if (filled) {
    children.push(h1(chrome.fichesTitle, rtl))
    if (!traitements.length) {
      children.push(plain(chrome.aucunTraitement, rtl))
    } else {
      traitements.forEach((t, i) => {
        children.push(h1(`${chrome.traitementPrefix} T${String(i + 1).padStart(3, '0')} — ${t.answers.nom || t.activity}`, rtl, { pageBreakBefore: true }))
        children.push(...ficheSectionsParagraphs(ficheSections, t.answers, true, rtl, chrome.otherOption))
      })
    }
  } else {
    children.push(h1(chrome.ficheGeneric, rtl, { pageBreakBefore: true }))
    children.push(...ficheSectionsParagraphs(ficheSections, {}, false, rtl, chrome.otherOption))
  }

  children.push(h1(chrome.partieDiag, rtl, { pageBreakBefore: true }))
  children.push(...diagFields.flatMap((f) => fieldParagraphs(f, diagComp, filled, rtl, chrome.otherOption)))

  children.push(h1(chrome.partieFinal, rtl))
  children.push(...finalFields.flatMap((f) => fieldParagraphs(f, finalOpen, filled, rtl, chrome.otherOption)))

  children.push(...signatureBlock(rtl, chrome))

  return { doc: new Document({ sections: [{ properties: {}, children }] }), chrome }
}

function slugify(s) {
  return (s || '').toString().trim().toLowerCase()
    .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'entreprise'
}

async function downloadDocx(doc, filename) {
  const blob = await Packer.toBlob(doc)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function downloadBlankQuestionnaire({ lang, entrepriseFields, activities, ficheSections, diagFields, finalFields }) {
  const { doc, chrome } = buildDocument({
    filled: false, lang, entrepriseFields, activities, ficheSections, diagFields, finalFields,
    company: {}, selectedActivities: [], traitements: [], diagComp: {}, finalOpen: {},
  })
  await downloadDocx(doc, chrome.filenameBlank)
}

export async function downloadFilledQuestionnaire({
  lang, entrepriseFields, allActivities, ficheSections, diagFields, finalFields,
  company, activities, traitements, diagComp, finalOpen,
}) {
  const { doc, chrome } = buildDocument({
    filled: true, lang, entrepriseFields, activities: allActivities, ficheSections, diagFields, finalFields,
    company, selectedActivities: activities, traitements, diagComp, finalOpen,
  })
  await downloadDocx(doc, `${chrome.filenamePrefix}${slugify(company?.name)}.docx`)
}
