import React from 'react'
import logoPng from '@/assets/logo.png'

interface MaytriLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  layout?: 'horizontal' | 'vertical'
}

export const MaytriLogo: React.FC<MaytriLogoProps> = ({
  className = '',
  size = 'md',
  layout = 'horizontal',
}) => {
  const heights = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-24',
  }

  const verticalHeights = {
    sm: 'h-20',
    md: 'h-28',
    lg: 'h-36',
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <img
          src={logoPng}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/maytri-logo.svg'
          }}
          alt="Maytri Group"
          className={`${verticalHeights[size]} w-auto object-contain shrink-0`}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoPng}
        onError={(e) => {
          ;(e.target as HTMLImageElement).src = '/maytri-logo.svg'
        }}
        alt="Maytri Group"
        className={`${heights[size]} w-auto object-contain shrink-0`}
      />
    </div>
  )
}
