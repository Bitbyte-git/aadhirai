import PaymentsPageBase from './PaymentsPageBase'

export default function AthiraiRevenue() {
  return (
    <PaymentsPageBase
      view="athirai_revenue"
      kicker="Super Admin"
      title="Athirai Revenue"
      note="Athirai's real net revenue — 73% of every order value, after the 27% commission pool is set aside for the hierarchy chain and Super Admin. No commission money mixed in here, pure company sales share."
      revenueLabel="Athirai Net Revenue (73%)"
      coinsLabel="AUG Coins Used"
      showBreakdown
    />
  )
}
