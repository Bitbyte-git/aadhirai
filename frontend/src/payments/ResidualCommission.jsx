import PaymentsPageBase from './PaymentsPageBase'

export default function ResidualCommission() {
  return (
    <PaymentsPageBase
      view="super_admin_commission"
      kicker="Super Admin"
      title="Residual Commission"
      note="Leftover unallocated commission balance from the payout pool, retained by Super Admin on every successful recharge."
      revenueLabel="Commission Balance"
      coinsLabel="AUG Coins Credited"
    />
  )
}
