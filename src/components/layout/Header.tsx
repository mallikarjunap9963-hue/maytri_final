import React, { useState, useEffect } from 'react'
import {
  Plus,
  Bell,
  Calendar,
  LogOut,
  User,
  Activity,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaytriLogo } from '@/components/common/MaytriLogo'
import type { TabType } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'
import { ApiService } from '@/services/apiService'

import logoPng from '@/assets/logo.png'

interface HeaderProps {
  darkMode?: boolean
  setDarkMode?: (val: boolean) => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedProject?: string
  setSelectedProject?: (val: string) => void
  onOpenAddLead: () => void
  onOpenScheduleVisit?: () => void
  currentUser: { name: string; email: string; role: string } | null
  onLogout: () => void
  activeTab?: TabType
  setActiveTab?: (tab: TabType) => void
  onNavigateToKyc?: () => void
  isMobileMenuOpen?: boolean
  onToggleMobileMenu?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenAddLead,
  currentUser,
  onLogout,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  // Live Partner Profile State from backend GET /api/partners/profile (with synchronous localStorage cache to prevent flicker)
  const [profileData, setProfileData] = useState<{
    name: string
    superiorCode: string
    designation: string
  } | null>(() => {
    const cachedName = localStorage.getItem('maytri_profile_name') || localStorage.getItem('maytri_last_user_name')
    const cachedCode = localStorage.getItem('maytri_profile_code')
    const cachedDesig = localStorage.getItem('maytri_profile_designation')
    if (cachedName && !cachedName.includes('@')) {
      return {
        name: cachedName,
        superiorCode: cachedCode || 'MAYTRIA02',
        designation: cachedDesig || 'CP_Head',
      }
    }
    return null
  })

  useEffect(() => {
    ApiService.getPartnerProfile().then((res) => {
      if (res.ok && res.data) {
        const p = res.data?.data || res.data?.profile || res.data
        const fullName =
          p.full_name ||
          `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() ||
          p.company_name ||
          ''

        const supCode =
          p.partner_code || p.superior_code || p.superior_info?.code || p.superior_info || ''

        const rawType = p.partner_type || p.designation || p.role || ''
        const desig =
          rawType === 'CP_HEAD'
            ? 'CP_Head'
            : rawType === 'CHANNEL_PARTNER'
              ? 'Channel Partner'
              : rawType || 'Partner'

        if (fullName || supCode) {
          setProfileData({
            name: fullName || 'Partner',
            superiorCode: supCode || 'MAYTRIA02',
            designation: desig || 'CP_Head',
          })
          if (fullName) {
            localStorage.setItem('maytri_profile_name', fullName)
            localStorage.setItem('maytri_last_user_name', fullName)
          }
          if (supCode) {
            localStorage.setItem('maytri_profile_code', supCode)
          }
          if (desig) {
            localStorage.setItem('maytri_profile_designation', desig)
          }
        }
      }
    })
  }, [])

  // Resolve clean human display name (never show raw email)
  const getDisplayName = (): string => {
    if (profileData?.name && !profileData.name.includes('@')) return profileData.name

    const cached = localStorage.getItem('maytri_profile_name') || localStorage.getItem('maytri_last_user_name')
    if (cached && !cached.includes('@')) return cached

    const raw = currentUser?.name || ''
    if (raw && !raw.includes('@')) return raw

    const email = currentUser?.email || ''
    if (email) {
      const stored =
        localStorage.getItem(`maytri_user_name_${email.toLowerCase()}`) ||
        localStorage.getItem('maytri_last_user_name')
      if (stored && !stored.includes('@')) return stored

      const prefix = email.split('@')[0]
      const words = prefix.replace(/[._0-9]/g, ' ').trim().split(/\s+/).filter(Boolean)
      if (words.length > 0) {
        return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }

    return 'Partner'
  }

  const displayName = getDisplayName()

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P'

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-18 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-6 md:px-8 shadow-2xs">
      {/* Brand Logo ONLY on the Left */}
      <div className="flex items-center">
        <img
          src={logoPng}
          alt="Maytri Group"
          className="h-8 sm:h-13 w-auto object-contain shrink-0"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/maytri-logo.svg'
          }}
        />
      </div>

      {/* Right Quick Actions: Add Lead + Profile + Mobile Toggler (Right Side) + Desktop Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Add Lead Button */}
        <Button
          onClick={onOpenAddLead}
          size="sm"
          className="h-8 sm:h-9.5 px-2.5 sm:px-4 text-xs font-extrabold bg-[#0092b3] hover:bg-[#007d99] text-white shadow-xs rounded-xl cursor-pointer flex items-center gap-1.5"
          title="Add New Customer Lead"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Add Lead</span>
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden md:block" />

        {/* User Profile - Initials Badge on Mobile (< sm), Full Pill on Desktop (sm+) */}
        {/* Mobile Initials Badge (< sm) */}
        <div
          className="sm:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-50 to-[#0092b3]/15 border border-[#0092b3]/30 text-[#0092b3] font-black text-xs shadow-2xs shrink-0 cursor-default"
          title={`${displayName} (${profileData?.designation || 'CP_Head'})`}
        >
          {userInitials}
        </div>

        {/* Desktop Profile Pill (sm+) */}
        <div className="hidden sm:flex items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 px-3 py-1.5 shadow-2xs transition-all cursor-default font-outfit shrink-0">
          <div className="text-left leading-tight">
            <p className="text-xs font-black text-slate-800 tracking-tight uppercase truncate max-w-[130px] md:max-w-[200px]">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mt-0.5">
              <span className="font-mono text-slate-600 font-semibold">
                {profileData?.superiorCode || localStorage.getItem('maytri_profile_code') || 'IP451201'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0092b3] font-extrabold">
                {profileData?.designation || localStorage.getItem('maytri_profile_designation') || currentUser?.role || 'CP_Head'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggler (Placed on the RIGHT SIDE for mobile) */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-slate-700 hover:text-[#0092b3] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
            title={isMobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-slate-800" />
            ) : (
              <Menu className="h-5 w-5 text-slate-800" />
            )}
          </button>
        )}

        {/* Desktop Sign Out Button (Hidden on mobile, mobile signout is in drawer) */}
        <button
          onClick={onLogout}
          className="hidden md:flex h-9 px-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs shadow-red-600/20 transition-all cursor-pointer items-center justify-center gap-1.5 shrink-0"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  )
}
