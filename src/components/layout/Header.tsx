import React, { useState, useEffect } from 'react'
import {
  Plus,
  Bell,
  Calendar,
  LogOut,
  User,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaytriLogo } from '@/components/common/MaytriLogo'
import type { TabType } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'
import { ApiService } from '@/services/apiService'

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
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenAddLead,
  currentUser,
  onLogout,
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

  return (
    <header className="sticky top-0 z-40 flex h-16 sm:h-18 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 md:px-8 shadow-xs">
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <MaytriLogo size="md" />
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onOpenAddLead}
          size="sm"
          variant="default"
          className="gap-1.5 h-9.5 px-4 text-xs font-extrabold bg-[#0092b3] hover:bg-[#007d99] text-white shadow-sm rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Pill Widget matching requested design */}
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 px-3.5 py-1.5 shadow-2xs transition-all cursor-pointer font-outfit">
          {/* User Name, Code & Designation */}
          <div className="text-left leading-tight">
            <p className="text-xs font-black text-slate-800 tracking-tight uppercase">
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mt-0.5">
              <span className="font-mono text-slate-600 font-semibold">{profileData?.superiorCode || localStorage.getItem('maytri_profile_code') || 'IP451201'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0092b3] font-extrabold">{profileData?.designation || localStorage.getItem('maytri_profile_designation') || currentUser?.role || 'CP_Head'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="h-8.5 px-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  )
}
