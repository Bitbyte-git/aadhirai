import PaymentsPageBase from './PaymentsPageBase'

export default function SuperAdminPayments() {
  return (
    <PaymentsPageBase
      view="all_sales"
      kicker="Super Admin"
      title="All Sales"
      note="Full order value across the entire platform — no commission or any deduction, straight order totals."
      revenueLabel="Total Order Value"
      showBreakdown
    />
  )
}
