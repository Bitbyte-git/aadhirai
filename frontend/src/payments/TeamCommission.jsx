import PaymentsPageBase from './PaymentsPageBase'

const ROLE_LABELS = {
  admin: 'Super Stockist', dealer: 'Distributor', sub_dealer: 'Wholesale Dealer', promotor: 'Retailer',
}

export default function TeamCommission() {
  const role = localStorage.getItem('role')
  return (
    <PaymentsPageBase
      view="team_commission"
      kicker={ROLE_LABELS[role] || 'My Account'}
      title="Team Commission"
      note="Commission earned by everyone in your downline team — the people below you in the hierarchy."
      revenueLabel="Team Commission Earned"
      coinsLabel="AUG Coins Credited"
    />
  )
}
