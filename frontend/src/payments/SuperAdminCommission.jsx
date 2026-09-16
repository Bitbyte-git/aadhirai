import PaymentsPageBase from './PaymentsPageBase'

export default function SuperAdminCommission() {
  return (
    <PaymentsPageBase
      view="super_admin_commission"
      kicker="Super Admin"
      title="Super Admin Commission"
      note="Leftover unallocated commission balance from the payout pool, retained by Super Admin on every successful recharge."
      revenueLabel="Commission Balance"
    />
  )
}
