import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Copy,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ApiService, AuthToken } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'
import { TableDataSkeleton } from '@/components/common/Skeletons'
import { cn } from '@/lib/utils'

export interface TeamMember {
  id: string
  name: string
  code: string
  role: 'CP_HEAD' | 'CHANNEL_PARTNER' | string
  phone: string
  email: string
  city: string
  parentSponsor?: string
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

export const MyTeamTab: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
      const isCpHead =
        rawType.toUpperCase() === 'CP_HEAD' ||
        rawType.toUpperCase().includes('HEAD')

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
      const myPhone = profile?.mobile || profile?.phone || user?.mobile || '-'
      const myEmail = profile?.email || profile?.user?.email || user?.email || '-'
      const myCity = profile?.city || 'Hyderabad'

      if (isCpHead) {
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
            // Filter: ONLY show approved accounts
            const approvedItems = rawItems.filter((item: any) => isApprovedAccount(item))

            if (approvedItems.length > 0) {
              const mapped: TeamMember[] = approvedItems.map((item: any, idx: number) => ({
                id: String(item.id || item.code || `cp-${idx + 1}`),
                name:
                  item.full_name ||
                  item.name ||
                  `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                  'Partner Member',
                code: item.partner_code || item.code || `MAY-CP-${100 + idx + 1}`,
                role: item.role || item.partner_type || 'CHANNEL_PARTNER',
                phone: item.mobile || item.phone || '-',
                email: item.email || item.user?.email || '-',
                city: item.city || 'Hyderabad',
                parentSponsor: item.superior_code || item.superior_info?.code || profile?.partner_code || undefined,
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
                  extractedChildren.push({
                    ...child,
                    superior_code: child.superior_code || root.partner_code || root.code,
                  })
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
                `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                'Channel Partner',
              code: item.partner_code || item.code || `MAY-CP-${100 + idx + 1}`,
              role: item.role || item.partner_type || 'CHANNEL_PARTNER',
              phone: item.mobile || item.phone || '-',
              email: item.email || item.user?.email || '-',
              city: item.city || 'Hyderabad',
              parentSponsor: item.superior_code || profile?.partner_code || undefined,
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
        // 2. CHANNEL PARTNER LOGIN: Show ONLY Channel Partner details if approved (NO CP Head data)
        // ==========================================
        const isApproved = isApprovedAccount(profile) || profile?.is_approved === true || profile?.is_active !== false

        if (isApproved) {
          const mySelfMember: TeamMember = {
            id: String(profile?.id || 'cp-self'),
            name: myName,
            code: myCode,
            role: 'CHANNEL_PARTNER',
            phone: myPhone,
            email: myEmail,
            city: myCity,
            parentSponsor: profile?.superior_code || profile?.superior_info?.code || undefined,
            status: 'Active',
            joinDate: profile?.created_at ? profile.created_at.split('T')[0] : '2026-08-01',
          }

          setTeamMembers([mySelfMember])
        } else {
          setTeamMembers([])
        }
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

  if (loading) {
    return <TableDataSkeleton rows={5} columns={5} />
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* UNIFIED MY TEAM CARD */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        {/* CARD HEADER WITH TITLE, SUBTITLE & VIEW TOGGLE / REFRESH */}
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 pt-4 px-5 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                  My Team
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                  Channel partner network members, sponsor codes, and contact details
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Grid / Table Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  viewMode === 'table' ? 'bg-[#0092b3] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  viewMode === 'grid' ? 'bg-[#0092b3] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeamData}
              className="h-8.5 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        {/* CARD CONTENT: TABLE, GRID, OR EMPTY STATE */}
        <CardContent className={cn(viewMode === 'table' ? 'p-0 overflow-x-auto' : 'p-5')}>
          {teamMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No Approved Team Members Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Your team list displays verified and approved channel partners registered under your sponsor network.
                </p>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#0092b3] text-white font-bold text-[11px] tracking-wide">
                  <th className="py-3.5 px-5">Partner Name</th>
                  <th className="py-3.5 px-4">Partner Code</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Sponsor Code</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {teamMembers.map((member, idx) => {
                  const isHead = member.role === 'CP_HEAD' || member.role.toLowerCase().includes('head')

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
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">{member.name}</p>
                            <p className="text-[10px] text-slate-400">Joined: {member.joinDate || '2026-08-01'}</p>
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

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <a href={`tel:${member.phone}`} className="font-bold text-slate-800 hover:underline">
                            {member.phone}
                          </a>
                        </div>
                        {member.email && member.email !== '-' && (
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{member.email}</span>
                          </div>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{member.city}</td>

                      {/* Sponsor Code */}
                      <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-600">
                        {member.parentSponsor || '-'}
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
              {teamMembers.map((member) => {
                const isHead = member.role === 'CP_HEAD' || member.role.toLowerCase().includes('head')

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
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
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

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile:</span>
                        <a href={`tel:${member.phone}`} className="font-bold text-slate-900 hover:underline">
                          {member.phone}
                        </a>
                      </div>

                      {member.email && member.email !== '-' && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Email:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[140px]">{member.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">City:</span>
                        <span className="font-semibold text-slate-800">{member.city}</span>
                      </div>

                      {member.parentSponsor && (
                        <div className="flex items-center justify-between text-slate-600 border-t border-slate-200/60 pt-1 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Sponsor Code:</span>
                          <span className="font-mono font-bold text-[#0092b3]">{member.parentSponsor}</span>
                        </div>
                      )}
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
