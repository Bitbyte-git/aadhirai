import PaymentsPageBase from './PaymentsPageBase'

export default function MyCommission() {
  return (
    <PaymentsPageBase
      view="my_commission"
      kicker="Super Admin"
      title="My Commission"
      note="Your own fixed 1% share, credited to you on every successful recharge across the platform."
      revenueLabel="My Commission Earned"
      coinsLabel="AUG Coins Credited"
    />
  )
}
