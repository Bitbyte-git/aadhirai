import { useState, useRef, useEffect } from 'react'

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  align = 'left',
  className = '',
  style = {},
  buttonStyle = {},
  menuStyle = {},
  variant = 'teal', // 'teal' | 'gold' | 'default'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? opt.key, label: opt.label ?? opt.name ?? String(opt.value) }
    }
    return { value: opt, label: String(opt) }
  })

  const selectedOpt = normalizedOptions.find((o) => o.value === value)
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder

  const isTeal = variant === 'teal'
  const primaryColor = isTeal ? '#073B3F' : '#BB8958'

  return (
    <div
      ref={ref}
      className={`bb-custom-dropdown ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: 0,
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 16px',
          borderRadius: '12px',
          border: `1.5px solid ${open ? primaryColor : '#D1DFDE'}`,
          background: '#FFFFFF',
          color: primaryColor,
          fontSize: '13px',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          outline: 'none',
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          boxShadow: open ? `0 0 0 3px rgba(7,59,63,0.12)` : '0 2px 6px rgba(7,59,63,0.04)',
          ...buttonStyle,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 150,
            minWidth: '100%',
            maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1.5px solid rgba(189, 207, 206, 0.85)',
            borderRadius: '14px',
            boxShadow: '0 20px 48px rgba(7, 59, 63, 0.18)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            boxSizing: 'border-box',
            maxHeight: '280px',
            overflowY: 'auto',
            ...menuStyle,
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  background: isSelected ? 'rgba(7, 59, 63, 0.08)' : 'transparent',
                  color: isSelected ? primaryColor : '#173230',
                  fontWeight: isSelected ? 800 : 650,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  transition: 'background .12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(7, 59, 63, 0.04)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
