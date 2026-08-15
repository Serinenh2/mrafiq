import CompanyPersonPage from '../components/CompanyPersonPage'

export default function ResponsableTraitements() {
  return (
    <CompanyPersonPage titleKey="resp.title" fields={[
      { key: 'controller_name', label: 'resp.name' },
      { key: 'controller_qualite', label: 'resp.qualite' },
      { key: 'controller_phone', label: 'resp.phone' },
      { key: 'controller_email', label: 'resp.email', type: 'email' },
    ]} />
  )
}
