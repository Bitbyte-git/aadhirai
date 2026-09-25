import { useNavigate } from 'react-router-dom'
import InternalRoleNavbar from './InternalRoleNavbar'

// ── One navbar for every shop page (dashboard, network, reports, coins,
// jewellery) — same menus as the admin navbar, minus commission/rewards ──
export default function ShopNavbar({ onProfile }) {
  const navigate = useNavigate()
  const openProfile = onProfile || (() => navigate('/shop-dashboard'))

  return (
    <InternalRoleNavbar
      roleTitle="SHOP"
      homePath="/shop-dashboard"
      managementItems={[
        { label: 'Dashboard', path: '/shop-dashboard' },
        { label: 'My Profile', action: openProfile },
        { label: 'Create Shop', path: '/add-shop' },
        { label: 'Shop List', path: '/superadmin/manage-users/shops' },
        { label: 'Network Grid', path: '/shop-hierarchy-grid' },
        { label: 'Network Tree', path: '/shop-hierarchy-tree' },
      ]}
      celebrationItems={[]}
      announcementItems={[]}
      coinItems={[
        { label: 'Buy Coin', path: '/buy-coin' },
        { label: 'Available Coins', path: '/available-coins' },
        { label: 'Coin Requests', path: '/coin-requests-page' },
        { label: 'Coin Transactions', path: '/coin-transactions' },
      ]}
      jewelleryItems={[
        { label: 'Buy Jewellery', path: '/add-jewellery' },
        { label: 'Available Jewellery', path: '/available-jewellery' },
        { label: 'Jewellery Requests', path: '/jewellery-requests' },
        { label: 'My Transactions', path: '/jewellery-transactions' },
      ]}
      reportItems={[
        { label: 'Shop Report', path: '/shop-report' },
        { label: 'Shop List', path: '/superadmin/manage-users/shops' },
        { label: 'Network Grid', path: '/shop-hierarchy-grid' },
        { label: 'Network Tree', path: '/shop-hierarchy-tree' },
      ]}
      actionItems={[
        { label: 'Profile', icon: 'user', action: openProfile },
        { label: 'Create Shop', icon: 'rate', action: () => navigate('/add-shop') },
        { label: 'Announcements', icon: 'bell' },
        { label: 'Logout', icon: 'logout', variant: 'danger', action: () => { localStorage.clear(); navigate('/login') } },
      ]}
    />
  )
}
