import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  GitFork,
  PhoneCall,
  X,
} from 'lucide-react'
import { MaytriLogo } from '@/components/common/MaytriLogo'
import { ApiService, AuthToken } from '@/services/apiService'
import { cn } from '@/lib/utils'

export type TabType =
  | 'overview'
  | 'projects'
  | 'myleads'
  | 'leads'
  | 'team'
  | 'tree'
  | 'users'
  | 'activities'
  | 'partners'
  | 'inventory'
  | 'visits'
  | 'bookings'
  | 'analytics'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  unreadVisitsCount?: number
  activeLeadsCount?: number
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isCpHead, setIsCpHead] = useState<boolean>(() => {
    const cachedDesig = localStorage.getItem('maytri_profile_designation')
    const cachedRole = localStorage.getItem('maytri_user_role')
    const user = AuthToken.getUser()
    const raw = (cachedDesig || user?.role || cachedRole || '').toUpperCase()
    return raw.includes('HEAD') || raw === 'CP_HEAD' || raw === 'ADMIN'
  })

  useEffect(() => {
    ApiService.getPartnerProfile().then((res) => {
      if (res?.ok && res.data) {
        const p = res.data?.data || res.data?.profile || res.data
        const rawType = (p?.partner_type || p?.designation || p?.role || '').toUpperCase()
        const cpHeadStatus = rawType === 'CP_HEAD' || rawType.includes('HEAD') || rawType === 'ADMIN'
        setIsCpHead(cpHeadStatus)
      }
    })
  }, [])

  const menuItems = [
    {
      id: 'overview' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'projects' as TabType,
      label: 'Projects',
      icon: Building2,
      badge: null,
    },
    // Only show "All Leads" if CP Head
    ...(isCpHead
      ? [
          {
            id: 'leads' as TabType,
            label: 'All Leads',
            icon: Users,
            badge: null,
          },
        ]
      : []),
    {
      id: 'myleads' as TabType,
      label: 'My Leads',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'team' as TabType,
      label: 'My Team',
      icon: Users,
      badge: null,
    },
    {
      id: 'tree' as TabType,
      label: 'My Network',
      icon: GitFork,
      badge: null,
    },
  ]

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId)
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Navigation Links */}
      <div className="space-y-4">
        {/* Mobile Header with Logo & Close Button */}
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-100">
          <MaytriLogo size="sm" />
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left',
                  isActive
                    ? 'bg-[#0092b3] text-white shadow-md shadow-[#0092b3]/20 font-extrabold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#0092b3]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5',
                      isActive ? 'text-white' : 'text-[#0092b3]'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] rounded-md font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-200 pt-3 px-2 space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-900 font-bold">
          <span className="flex items-center gap-1.5 text-slate-900">
            <PhoneCall className="h-3.5 w-3.5 text-[#2a94b5]" /> Sales Desk
          </span>
          <span className="font-extrabold text-slate-900">040-24200456</span>
        </div>
        <p className="text-[10px] text-slate-700 font-semibold text-center">
          Maytri Group v3.2
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP STICKY SIDEBAR */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4 py-6 hidden md:flex sticky top-16 sm:top-18 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] overflow-y-auto z-30">
        {sidebarContent}
      </aside>

      {/* MOBILE SLIDE-IN DRAWER & OVERLAY */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white p-5 shadow-2xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export default Sidebar
