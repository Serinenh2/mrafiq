import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useApp } from '../context/AppContext'

export const EMPTY_COMPANY = {
  name: '', legal_form: '', sector: '', main_activity: '', rc_number: '', nif: '', nis: '',
  address: '', wilaya: '', commune: '', website: '', employees_count: 0,
  contact_name: '', contact_email: '', contact_phone: '',
  secondary_activities: '', it_systems: '', it_providers: '', internal_organisation: '', notes: '',
}

export default function CompanyForm({ form, onChange }) {
  const { t, lang, L } = useApp()
  const set = (k) => (e) => onChange({ ...form, [k]: e.target.value })
  const { data: templates } = useQuery({ queryKey: ['processing-templates'],
    queryFn: () => api.get('/processing-templates/').then((r) => r.data) })
  const domains = [...new Set((templates ?? [])
    .map((tpl) => (lang === 'ar' && tpl.domain_ar ? tpl.domain_ar : tpl.domain_fr)))].sort()

  const { data: wilayas } = useQuery({ queryKey: ['wilayas'],
    queryFn: () => api.get('/wilayas/').then((r) => r.data) })
  const { data: communes } = useQuery({ queryKey: ['communes', form.wilaya], enabled: !!form.wilaya,
    queryFn: () => api.get(`/communes/?wilaya=${form.wilaya}`).then((r) => r.data) })

  const setWilaya = (e) => onChange({ ...form, wilaya: e.target.value, commune: '' })

  return (
    <>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <div><label className="flabel">{t('companies.name')} *</label>
          <input className="input" value={form.name} onChange={set('name')} /></div>
        <div><label className="flabel">{t('companies.legalForm')}</label>
          <input className="input" value={form.legal_form} onChange={set('legal_form')} /></div>
        <div><label className="flabel">{t('companies.sector')}</label>
          <input className="input" list="sector-domains" value={form.sector} onChange={set('sector')} />
          <datalist id="sector-domains">
            {domains.map((d) => <option key={d} value={d} />)}
          </datalist></div>
        <div><label className="flabel">{t('companies.mainActivity')}</label>
          <input className="input" value={form.main_activity} onChange={set('main_activity')} /></div>
        <div><label className="flabel">{t('companies.rc')}</label>
          <input className="input" value={form.rc_number} onChange={set('rc_number')} /></div>
        <div><label className="flabel">{t('companies.nif')}</label>
          <input className="input" value={form.nif} onChange={set('nif')} /></div>
        <div><label className="flabel">{t('companies.nis')}</label>
          <input className="input" value={form.nis} onChange={set('nis')} /></div>
        <div><label className="flabel">{t('companies.address')}</label>
          <input className="input" value={form.address} onChange={set('address')} /></div>
        <div><label className="flabel">{t('companies.wilaya')}</label>
          <select className="input" value={form.wilaya} onChange={setWilaya}>
            <option value="">—</option>
            {(wilayas ?? []).map((w) => (
              <option key={w.code} value={w.code}>{w.code} — {L(w, 'name_fr', 'name_ar')}</option>
            ))}
          </select></div>
        <div><label className="flabel">{t('companies.commune')}</label>
          <select className="input" value={form.commune} onChange={set('commune')} disabled={!form.wilaya}>
            <option value="">—</option>
            {(communes ?? []).map((c) => (
              <option key={c.id} value={c.name_fr}>{L(c, 'name_fr', 'name_ar')}</option>
            ))}
          </select></div>
        <div><label className="flabel">{t('companies.website')}</label>
          <input className="input" type="url" placeholder="https://" value={form.website} onChange={set('website')} /></div>
        <div><label className="flabel">{t('companies.employees')}</label>
          <input className="input" type="number" min="0" value={form.employees_count} onChange={set('employees_count')} /></div>
        <div><label className="flabel">{t('companies.contactName')}</label>
          <input className="input" value={form.contact_name} onChange={set('contact_name')} /></div>
        <div><label className="flabel">{t('companies.contactEmail')}</label>
          <input className="input" type="email" value={form.contact_email} onChange={set('contact_email')} /></div>
        <div><label className="flabel">{t('companies.contactPhone')}</label>
          <input className="input" value={form.contact_phone} onChange={set('contact_phone')} /></div>
      </div>
      <div className="grid gap-4 mt-4">
        <div><label className="flabel">{t('companies.secondaryActivities')}</label>
          <textarea className="input" rows={2} value={form.secondary_activities} onChange={set('secondary_activities')} /></div>
        <div><label className="flabel">{t('companies.itSystems')}</label>
          <textarea className="input" rows={2} value={form.it_systems} onChange={set('it_systems')} /></div>
        <div><label className="flabel">{t('companies.itProviders')}</label>
          <textarea className="input" rows={2} value={form.it_providers} onChange={set('it_providers')} /></div>
        <div><label className="flabel">{t('companies.internalOrganisation')}</label>
          <textarea className="input" rows={2} value={form.internal_organisation} onChange={set('internal_organisation')} /></div>
        <div><label className="flabel">{t('companies.notes')}</label>
          <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} /></div>
      </div>
    </>
  )
}
