import React, { useState, useEffect } from 'react'
import {
  Users,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Copy,
  Check,
  LayoutGrid,
  List,
  Building2,
  ShieldAlert,
  Sparkles,
  UserCheck,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ApiService, AuthToken } from '@/services/apiService'
import { TableDataSkeleton } from '@/components/common/Skeletons'
import { cn } from '@/lib/utils'

interface MyTeamTabProps {
  onNavigateTab?: (tab: any) => void
}

export interface TeamMember {
  id: string
  name: string
  code: string
  role: 'CP_HEAD' | 'CHANNEL_PARTNER' | string
  phone: string
  email: string
  city: string
  status: 'Active' | 'Pending' | 'Inactive'
  joinDate?: string
}

// Helper to check if a partner account is approved
const isApprovedAccount = (item: any): boolean => {
  if (!item) return false
  if (item.is_approved === true) return true
  const rawStatus = String(item.kyc_status || item.status || '').toUpperCase().trim()
  if (
    rawStatus === 'APPROVED' ||
    rawStatus === 'ACTIVE' ||
    rawStatus === 'CONFIRMED' ||
    rawStatus.includes('APPROV')
  ) {
    return true
  }
  if (item.user?.is_approved === true) return true
  return false
}

// Robust helper to extract phone number from diverse backend structures
const extractPhone = (item: any): string => {
  if (!item) return '-'
  const candidates = [
    item.mobile,
    item.phone,
    item.mobile_number,
    item.mobile_no,
    item.phone_number,
    item.phone_no,
    item.contact,
    item.contact_number,
    item.contact_no,
    item.cell,
    item.whatsapp,
    item.whatsapp_number,
    item.registered_mobile,
    // Nested user
    item.user?.mobile,
    item.user?.phone,
    item.user?.mobile_number,
    item.user?.mobile_no,
    item.user?.phone_number,
    item.user?.phone_no,
    item.user?.contact_number,
    item.user?.contact_no,
    item.user?.registered_mobile,
    // Nested partner
    item.partner?.mobile,
    item.partner?.phone,
    item.partner?.mobile_number,
    item.partner?.user?.mobile,
    item.partner?.user?.phone,
    // Nested profile
    item.profile?.mobile,
    item.profile?.phone,
    item.profile?.user?.mobile,
    // Nested kyc
    item.kyc?.mobile,
    item.kyc?.phone,
    item.kyc_details?.mobile,
    item.kyc_details?.phone,
    item.kyc_data?.mobile,
    // User login username fallback if 10-digit mobile
    item.user?.username,
    item.username,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && c.trim() !== '-') {
      const clean = c.trim()
      if (clean.includes('@')) continue
      const digits = clean.replace(/\D/g, '')
      if (digits.length >= 10) {
        return clean
      }
      if (clean.length >= 7 && !clean.includes('@')) {
        return clean
      }
    } else if (typeof c === 'number' && c > 10000000) {
      return String(c)
    }
  }

  return '-'
}

// Robust helper to extract email from diverse backend structures
const extractEmail = (item: any): string => {
  if (!item) return '-'
  const candidates = [
    item.email,
    item.user?.email,
    item.user_email,
    item.partner?.email,
    item.partner?.user?.email,
    item.kyc?.email,
    item.kyc_details?.email,
    item.user?.username,
    item.username,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('@')) {
      return c.trim()
    }
  }

  return '-'
}

export const MyTeamTab: React.FC<MyTeamTabProps> = ({ onNavigateTab }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isCpHead, setIsCpHead] = useState<boolean>(true)
  const [partnerProfile, setPartnerProfile] = useState<{
    name: string
    code: string
    phone: string
    email: string
    city: string
    superior_code?: string
  }>({
    name: 'Channel Partner',
    code: 'MAY-CP-01',
    phone: '-',
    email: '-',
    city: 'Hyderabad',
  })

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      const [teamRes, profileRes, treeRes] = await Promise.all([
        ApiService.getMyTeam().catch(() => null),
        ApiService.getPartnerProfile().catch(() => null),
        ApiService.getPartnerTree().catch(() => null),
      ])

      const profile = profileRes?.ok
        ? profileRes.data?.data || profileRes.data?.profile || profileRes.data
        : null
      const user = AuthToken.getUser()
      const cachedDesignation = localStorage.getItem('maytri_profile_designation')
      const cachedRole = localStorage.getItem('maytri_user_role')
      const rawType =
        profile?.partner_type ||
        profile?.designation ||
        profile?.role ||
        cachedDesignation ||
        user?.role ||
        cachedRole ||
        ''
      const cpHeadStatus =
        rawType.toUpperCase() === 'CP_HEAD' ||
        rawType.toUpperCase().includes('HEAD')

      setIsCpHead(cpHeadStatus)

      const myName =
        profile?.full_name ||
        `${profile?.user?.first_name || user?.first_name || ''} ${profile?.user?.last_name || user?.last_name || ''}`.trim() ||
        localStorage.getItem('maytri_profile_name') ||
        localStorage.getItem('maytri_last_user_name') ||
        'Channel Partner'
      const myCode =
        profile?.partner_code ||
        localStorage.getItem('maytri_profile_code') ||
        'MAY-CP-01'
      const myPhone = extractPhone(profile) || extractPhone(user) || '-'
      const myEmail = extractEmail(profile) || extractEmail(user) || '-'
      const myCity = profile?.city || 'Hyderabad'
      const superiorCode = profile?.superior_code || profile?.superiorCode || ''

      setPartnerProfile({
        name: myName,
        code: myCode,
        phone: myPhone,
        email: myEmail,
        city: myCity,
        superior_code: superiorCode,
      })

      if (cpHeadStatus) {
        // ==========================================
        // 1. CP HEAD LOGIN: Show only APPROVED team members
        // ==========================================
        if (teamRes && teamRes.ok && teamRes.data) {
          const rawItems =
            teamRes.data.items ||
            teamRes.data.data?.items ||
            teamRes.data.team ||
            teamRes.data.data?.team ||
            teamRes.data.members ||
            teamRes.data.data?.members ||
            teamRes.data.downlines ||
            teamRes.data.data?.downlines ||
            teamRes.data.partners ||
            teamRes.data.results ||
            (Array.isArray(teamRes.data?.data) ? teamRes.data.data : null) ||
            (Array.isArray(teamRes.data) ? teamRes.data : [])

          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const approvedItems = rawItems.filter((item: any) => isApprovedAccount(item))

            if (approvedItems.length > 0) {
              const mapped: TeamMember[] = approvedItems.map((item: any, idx: number) => ({
                id: String(item.id || item.code || `cp-${idx + 1}`),
                name:
                  item.full_name ||
                  item.name ||
                  `${item.first_name || item.user?.first_name || ''} ${item.last_name || item.user?.last_name || ''}`.trim() ||
                  item.company_name ||
                  'Partner Member',
                code: item.partner_code || item.cp_code || item.code || `MAY-CP-${100 + idx + 1}`,
                role: item.role || item.partner_type || 'CHANNEL_PARTNER',
                phone: extractPhone(item),
                email: extractEmail(item),
                city: item.city || item.user?.city || 'Hyderabad',
                status: 'Active',
                joinDate: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              }))

              setTeamMembers(mapped)
              return
            }
          }
        }

        // Check tree endpoint as fallback for CP Head downlines
        if (treeRes && treeRes.ok && treeRes.data) {
          const treeData = treeRes.data.data || treeRes.data.tree || treeRes.data.items || treeRes.data
          const treeList = Array.isArray(treeData) ? treeData : [treeData]

          const extractedChildren: any[] = []
          treeList.forEach((root: any) => {
            if (root && Array.isArray(root.children)) {
              root.children.forEach((child: any) => {
                if (isApprovedAccount(child)) {
                  extractedChildren.push(child)
                }
              })
            }
          })

          if (extractedChildren.length > 0) {
            const mapped: TeamMember[] = extractedChildren.map((item: any, idx: number) => ({
              id: String(item.id || item.code || `cp-tree-${idx + 1}`),
              name:
                item.full_name ||
                item.name ||
                `${item.first_name || item.user?.first_name || ''} ${item.last_name || item.user?.last_name || ''}`.trim() ||
                item.company_name ||
                'Channel Partner',
              code: item.partner_code || item.cp_code || item.code || `MAY-CP-${100 + idx + 1}`,
              role: item.role || item.partner_type || 'CHANNEL_PARTNER',
              phone: extractPhone(item),
              email: extractEmail(item),
              city: item.city || item.user?.city || 'Hyderabad',
              status: 'Active',
              joinDate: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            }))

            setTeamMembers(mapped)
            return
          }
        }

        setTeamMembers([])
      } else {
        // ==========================================
        // 2. CHANNEL PARTNER: Independent partner level (No team downline)
        // ==========================================
        setTeamMembers([])
      }
    } catch {
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamData()
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredMembers = teamMembers

  if (loading) {
    return <TableDataSkeleton />
  }

  // ==========================================
  // CHANNEL PARTNER VIEW (NO TEAM REQUIRED)
  // ==========================================
  if (!isCpHead) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto font-sans selection:bg-[#0092b3] selection:text-white animate-in fade-in duration-300">
        {/* Header banner / Info card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-cyan-50/40 p-6 sm:p-10 shadow-xs">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#0092b3]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0092b3]/10 text-[#0092b3] border border-[#0092b3]/20 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Channel Partner Account</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                No Team Management Required
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                As an independent <span className="font-bold text-slate-900">Channel Partner</span>, team management and downline partner networks are exclusively configured for <span className="font-bold text-[#0092b3]">Channel Partner Heads (CP Heads)</span>.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                You have direct access to register buyer leads, schedule site visits, track deals, and browse project inventories without managing a partner hierarchy.
              </p>
            </div>

            {/* Account Info Pill */}
            <div className="shrink-0 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 min-w-[260px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Your Partner Profile
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Name:</span>
                  <span className="text-slate-900 font-bold">{partnerProfile.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Partner Code:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(partnerProfile.code)}
                    className="font-mono font-bold text-[#0092b3] bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{partnerProfile.code}</span>
                    {copiedCode === partnerProfile.code ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Designation:</span>
                  <span className="text-slate-700 font-bold">Channel Partner</span>
                </div>
                {partnerProfile.superior_code && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Superior Code:</span>
                    <span className="font-mono font-bold text-slate-700">{partnerProfile.superior_code}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* HEADER CARD */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                My Team
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Channel partner network members and contact details
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-white text-[#0092b3] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white text-[#0092b3] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={fetchTeamData}
              variant="outline"
              size="sm"
              className="h-8.5 border-slate-200 text-slate-700 hover:text-[#0092b3] hover:bg-slate-50 font-bold text-xs gap-1.5 rounded-xl px-3 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        {/* CARD CONTENT: TABLE, GRID, OR EMPTY STATE */}
        <CardContent className={cn(viewMode === 'table' ? 'p-0 overflow-x-auto' : 'p-5')}>
          {filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Approved Team Members Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Your team list displays verified and approved channel partners registered under your network.
                </p>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <table className="w-full text-left text-xs border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-[#0092b3] text-white font-bold text-[11px] tracking-wide">
                  <th className="py-3.5 px-5">Partner Name</th>
                  <th className="py-3.5 px-4">Partner Code</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredMembers.map((member, idx) => {
                  const isHead = member.role === 'CP_HEAD' || member.role.toLowerCase().includes('head')
                  const hasPhone = member.phone && member.phone !== '-'
                  const hasEmail = member.email && member.email !== '-'

                  return (
                    <tr
                      key={member.id}
                      className={cn(
                        'hover:bg-slate-50/70 transition-colors',
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      )}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-8.5 w-8.5 rounded-xl font-bold flex items-center justify-center text-xs shrink-0',
                              isHead ? 'bg-[#0092b3] text-white' : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join('')
                              .toUpperCase() || 'CP'}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-slate-400">Joined: {member.joinDate || '2026-08-18'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Partner Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(member.code)}
                          className="inline-flex items-center gap-1.5 hover:text-[#0092b3] cursor-pointer"
                          title="Click to copy code"
                        >
                          <span>{member.code}</span>
                          {copiedCode === member.code ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold',
                            isHead
                              ? 'bg-[#0092b3]/10 text-[#0092b3] border border-[#0092b3]/20'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          )}
                        >
                          {isHead ? 'CP Head' : 'Channel Partner'}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        {hasEmail ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                            <Mail className="h-3.5 w-3.5 text-[#0092b3] shrink-0" />
                            <a href={`mailto:${member.email}`} className="truncate max-w-[200px] font-semibold hover:text-[#0092b3] hover:underline">
                              {member.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Mobile Number */}
                      <td className="py-3.5 px-4">
                        {hasPhone ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="h-3.5 w-3.5 text-[#0092b3] shrink-0" />
                            <a href={`tel:${member.phone}`} className="font-bold text-slate-900 hover:text-[#0092b3] hover:underline">
                              {member.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMembers.map((member) => {
                const isHead = member.role === 'CP_HEAD' || member.role.toLowerCase().includes('head')
                const hasPhone = member.phone && member.phone !== '-'
                const hasEmail = member.email && member.email !== '-'

                return (
                  <Card
                    key={member.id}
                    className="border border-slate-200/90 shadow-2xs rounded-2xl bg-white p-4 space-y-3 hover:border-[#0092b3]/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0',
                            isHead ? 'bg-[#0092b3] text-white' : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || 'CP'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{member.name}</h4>
                          <span
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold mt-0.5',
                              isHead ? 'bg-[#0092b3]/10 text-[#0092b3]' : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {isHead ? 'CP Head' : 'Channel Partner'}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {member.status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Partner Code:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(member.code)}
                          className="font-mono font-bold text-slate-900 hover:text-[#0092b3] flex items-center gap-1 cursor-pointer"
                        >
                          <span>{member.code}</span>
                          {copiedCode === member.code ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {hasPhone && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile:</span>
                          <a href={`tel:${member.phone}`} className="font-bold text-slate-900 hover:text-[#0092b3] hover:underline">
                            {member.phone}
                          </a>
                        </div>
                      )}

                      {hasEmail && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Email:</span>
                          <a href={`mailto:${member.email}`} className="font-semibold text-slate-800 truncate max-w-[160px] hover:text-[#0092b3] hover:underline">
                            {member.email}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">City:</span>
                        <span className="font-semibold text-slate-800">{member.city}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MyTeamTab
