import PaymentsPageBase from './PaymentsPageBase'

export default function SuperAdminPayments() {
  return (
    <PaymentsPageBase
      view="all_sales"
      kicker="Super Admin"
      title="All Sales"
      note="Track platform-wide sales, order value, transactions and payment performance."
      revenueLabel="Total Order Value"
      coinsLabel="Coins Sold"
      showBreakdown
    />
  )
}
