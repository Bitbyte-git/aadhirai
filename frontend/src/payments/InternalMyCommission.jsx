import PaymentsPageBase from './PaymentsPageBase'

const ROLE_LABELS = {
  admin: 'Super Stockist', dealer: 'Distributor', sub_dealer: 'Wholesale Dealer', promotor: 'Retailer',
}

export default function InternalMyCommission() {
  const role = localStorage.getItem('role')
  return (
    <PaymentsPageBase
      view="my_commission"
      kicker={ROLE_LABELS[role] || 'My Account'}
      title="My Commission"
      note="Your own commission share, credited to you on every successful order in your chain."
      revenueLabel="My Commission Earned"
      coinsLabel="AUG Coins Credited"
    />
  )
}
