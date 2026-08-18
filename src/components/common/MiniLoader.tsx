import React from 'react'
import logoPng from '@/assets/logo.png'

export const MiniLoader: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-200">
      {/* Centered Circular Spinner with Zoomed Prominent Logo */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute w-32 h-32 rounded-full bg-[#0092b3]/25 blur-2xl animate-pulse pointer-events-none" />

        {/* Animated Circular Spinner Ring */}
        <div className="h-24 w-24 rounded-full border-[3.5px] border-slate-200/70 border-t-[#0092b3] border-r-[#0092b3]/50 animate-spin" />

        {/* Centered Circular Logo Container with Zoomed In Logo */}
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm border border-slate-100 overflow-hidden">
          <img
            src={logoPng}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/maytri-logo.svg'
            }}
            alt="Maytri Logo"
            className="h-16 w-16 object-contain scale-125 select-none"
          />
        </div>
      </div>
    </div>
  )
}

export default MiniLoader
