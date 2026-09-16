import PaymentsPageBase from './PaymentsPageBase'

export default function GeneralCustomerRevenue() {
  return (
    <PaymentsPageBase
      view="general_customer_revenue"
      kicker="Super Admin"
      title="General Customer Revenue"
      note="Orders from General Customers only — customers who signed up directly (no referral link), so no one in a chain earns commission on these. A subset of All Sales."
      revenueLabel="General Customer Sales"
      coinsLabel="AUG Coins Used"
      showBreakdown
    />
  )
}
