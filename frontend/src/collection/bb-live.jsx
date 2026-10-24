import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerFooter from './CustomerFooter'

const TEAM369_SHOWCASE_URL = 'https://gold-showcase.vercel.app/'



function ShopCard({ shop }) {
  const [hovered, setHovered] = useState(false)



  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`,
      '_blank'
    )
  }

  const callShop = () => {
    if (shop.phone) {
      window.open(`tel:${shop.phone}`)
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + (shop.address || ''))}`,
        '_blank'
      )
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#8B1A1A' : '#f0e8e0'}`,
        borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? '0 12px 40px rgba(139,26,26,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Image / Icon */}
      <div style={{
        height: 140, overflow: 'hidden',
        background: 'linear-gradient(135deg,#f5f0e8,#e8ddd5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: 56, filter: 'drop-shadow(0 4px 8px rgba(184,134,11,0.3))' }}>💍</div>

        {/* Distance badge */}
        {shop.distance !== null && shop.distance !== undefined && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(139,26,26,0.85)', color: '#fff',
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            backdropFilter: 'blur(4px)',
          }}>
            📍 {shop.distance < 1
              ? `${Math.round(shop.distance * 1000)} m`
              : `${shop.distance.toFixed(1)} km`}
          </div>
        )}

        {/* Open/Closed */}
        {shop.opening_hours && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: shop.opening_hours === 'open' ? '#059669' : '#6b7280',
            color: '#fff', fontSize: 9, fontWeight: 800,
            padding: '3px 8px', borderRadius: 20,
          }}>
            {shop.opening_hours === 'open' ? '● OPEN' : '● HOURS N/A'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        {/* Name */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#1a0a0a',
          fontFamily: '"Playfair Display", Georgia, serif',
          lineHeight: 1.3, marginBottom: 6,
        }}>
          {shop.name}
        </div>

        {/* Address */}
        {shop.address && (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, lineHeight: 1.4 }}>
            📍 {shop.address}
          </div>
        )}

        {/* Phone */}
        {shop.phone && (
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 8 }}>
            📞 {shop.phone}
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
            background: 'rgba(139,26,26,0.07)', color: '#8B1A1A',
            border: '1px solid rgba(139,26,26,0.15)',
          }}>
            💍 Jewellery Store
          </span>
          {shop.brand && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
              background: 'rgba(184,134,11,0.08)', color: '#b8860b',
              border: '1px solid rgba(184,134,11,0.2)',
            }}>
              {shop.brand}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={openDirections}
            style={{
              flex: 1, padding: '9px 0',
              background: 'linear-gradient(90deg,#8B1A1A,#b91c1c)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            🗺️ Get Direction
          </button>
          <button
            onClick={callShop}
            style={{
              flex: 1, padding: '9px 0',
              background: 'transparent',
              border: '1.5px solid #8B1A1A', borderRadius: 10,
              color: '#8B1A1A', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8B1A1A'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B1A1A' }}
          >
            {shop.phone ? '📞 Call Now' : '🔍 View on Maps'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BBLive() {
  (useNavigate());
  ;useState(null);
  ;useState(true);
  ;useState(false);
  ;useState('');
  ;useState([]);
  ;useState(false);
  ;useState('');
  ;useState('jewelry');
  useState(0);

  const SEARCH_TYPES = [
    { label: '✦ All Jewellery', value: 'jewelry' },
    { label: 'Gold', value: 'gold jewelry' },
    { label: 'Diamond', value: 'diamond jewelry' },
    { label: 'Silver', value: 'silver jewelry' },
    { label: 'Bridal', value: 'bridal jewelry' },
  ]

  // ── Fetch from OpenStreetMap Overpass API (FREE) ──
  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f1', fontFamily: '"Montserrat", Inter, system-ui, sans-serif' }}>

      <main style={{ padding: '28px clamp(16px, 3vw, 40px) 44px' }}>
        <section style={{
          maxWidth: 1540,
          margin: '0 auto',
          border: '1px solid rgba(7,59,63,0.16)',
          borderRadius: 18,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 22px 60px rgba(7,59,63,0.12)',
        }}>
          <div style={{
            minHeight: 64,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid rgba(7,59,63,0.12)',
            background: 'linear-gradient(90deg,#073B3F,#0b5257)',
            color: '#fff',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', opacity: .78 }}>
                Team369 Live
              </div>
              <h1 style={{
                margin: '4px 0 0',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(22px, 2vw, 32px)',
                lineHeight: 1.1,
              }}>
                Gold Showcase
              </h1>
            </div>

            <button
              type="button"
              onClick={() => window.open(TEAM369_SHOWCASE_URL, '_blank', 'noopener,noreferrer')}
              style={{
                minHeight: 38,
                padding: '0 16px',
                border: '1px solid rgba(255,255,255,.42)',
                borderRadius: 999,
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Open Full Website
            </button>
          </div>

          <iframe
            title="Team369 Gold Showcase"
            src={TEAM369_SHOWCASE_URL}
            style={{
              display: 'block',
              width: '100%',
              height: 'calc(100vh - 265px)',
              minHeight: 620,
              border: 0,
              background: '#fff',
            }}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </main>

      <CustomerFooter />
    </div>
  )







  // Re-fetch on filter change






}

