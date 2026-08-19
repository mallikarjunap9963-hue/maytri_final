import React, { useState, useEffect, useMemo } from 'react'
import {
  GitFork,
  RefreshCw,
  Crown,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Check,
  Copy,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  ArrowDown,
  ArrowRight,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/data/appData'
import { ApiService, AuthToken } from '@/services/apiService'
import { NetworkTreeSkeleton } from '@/components/common/Skeletons'
import { cn } from '@/lib/utils'

interface NetworkTreeTabProps {
  onNavigateTab?: (tab: any, partnerName?: string) => void
}

export interface PartnerNode {
  id: string | number
  code: string
  name: string
  role: string
  email?: string
  phone?: string
  teamCount: number
  children?: PartnerNode[]
}

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

const DEFAULT_CP_HEAD_TREE: PartnerNode[] = [
  {
    id: 'head-1',
    code: 'MAYTRIA02',
    name: 'POKALA REDDY',
    role: 'CP_HEAD',
    email: 'mallikarjunap9963@gmail.com',
    teamCount: 4,
    children: [
      {
        id: 'cp-101',
        code: 'MAYTRIB01',
        name: 'Dharish REDDY',
        role: 'CHANNEL_PARTNER',
        email: 'dharish@example.com',
        phone: '+91 98765 43210',
        teamCount: 0,
        children: [],
      },
      {
        id: 'cp-102',
        code: 'MAYTRIB02',
        name: 'gopi Naidhu',
        role: 'CHANNEL_PARTNER',
        email: 'gopi@example.com',
        phone: '+91 98765 43211',
        teamCount: 0,
        children: [],
      },
      {
        id: 'cp-103',
        code: 'MAYTRIB04',
        name: 'Naveen Gandham',
        role: 'CHANNEL_PARTNER',
        email: 'naveen@example.com',
        phone: '+91 98765 43212',
        teamCount: 0,
        children: [],
      },
      {
        id: 'cp-104',
        code: 'MAYTRIB07',
        name: 'Ravindhar monapati',
        role: 'CHANNEL_PARTNER',
        email: 'ravindhar@example.com',
        phone: '+91 98765 43213',
        teamCount: 0,
        children: [],
      },
    ],
  },
]

// ==========================================
// VERTICAL METRO-TREE TIMELINE NODE
// ==========================================
interface MetroTreeNodeProps {
  node: PartnerNode
  index?: number
  isLast?: boolean
  defaultExpanded?: boolean
  onCopyCode: (code: string) => void
  copiedCode: string | null
  partnerLeadCount?: number
  onNavigateToLeads?: (partnerName: string) => void
  getLeadCountForNode?: (name: string, code?: string) => number
}

const MetroTreeNode: React.FC<MetroTreeNodeProps> = ({
  node,
  index = 1,
  isLast = false,
  defaultExpanded = true,
  onCopyCode,
  copiedCode,
  partnerLeadCount = 0,
  onNavigateToLeads,
  getLeadCountForNode,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded)
  const hasChildren = node.children && node.children.length > 0

  useEffect(() => {
    setIsOpen(defaultExpanded)
  }, [defaultExpanded])

  const initials =
    node.name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CP'

  return (
    <div className="relative flex items-start group">
      {/* 1. LEFT METRO SPINE RAIL */}
      <div className="flex flex-col items-center mr-4 sm:mr-6 shrink-0 relative self-stretch">
        {/* Step Circular Node Badge */}
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs transition-all duration-200 z-10 bg-white border-2 border-[#0092b3] text-[#0092b3] group-hover:bg-[#0092b3] group-hover:text-white group-hover:shadow-md">
          {String(index).padStart(2, '0')}
        </div>

        {/* Continuous Vertical Line to next sibling */}
        {!isLast && (
          <div className="w-0.5 bg-gradient-to-b from-[#0092b3]/60 via-slate-300 to-slate-200 flex-1 my-1" />
        )}
      </div>

      {/* 2. RIGHT PARTNER CARD */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden border-slate-200/90 hover:border-[#0092b3]/60">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Partner Details */}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 truncate" title={node.name}>
                    {node.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Channel Partner
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* Partner Code with 1-Click Copy */}
                  <button
                    type="button"
                    onClick={() => onCopyCode(node.code)}
                    className="font-mono text-xs font-bold text-[#0092b3] hover:text-[#007d99] bg-cyan-50 hover:bg-cyan-100/80 px-2 py-0.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border border-cyan-200/60"
                    title="Click to copy Partner Code"
                  >
                    <span>{node.code}</span>
                    {copiedCode === node.code ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>

                  {/* Contact Info (if available) */}
                  {node.phone && (
                    <span className="text-slate-500 font-medium flex items-center gap-1 text-[11.5px]">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{node.phone}</span>
                    </span>
                  )}
                  {node.email && (
                    <span className="text-slate-500 font-medium flex items-center gap-1 text-[11.5px] truncate max-w-[180px]">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span className="truncate">{node.email}</span>
                    </span>
                  )}
                </div>
              </div>

            {/* Right Metric: Partner Leads Action Button (Navigates to All Leads with filter) */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigateToLeads?.(node.name)
                }}
                className="group/lead-btn flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-50/80 hover:bg-[#0092b3] text-[#0092b3] hover:text-white border border-cyan-200/80 hover:border-[#0092b3] transition-all shadow-2xs hover:shadow-xs cursor-pointer text-right"
                title={`View All Leads for ${node.name}`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 group-hover/lead-btn:text-cyan-100 uppercase tracking-wider block leading-tight">
                    Partner Leads
                  </span>
                  <span className="text-xs font-black leading-tight flex items-center gap-1 justify-end">
                    <span>{partnerLeadCount} Leads</span>
                    <ArrowRight className="h-3 w-3 inline transition-transform group-hover/lead-btn:translate-x-0.5" />
                  </span>
                </div>
              </button>

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-cyan-50 text-slate-500 hover:text-[#0092b3] border border-slate-200 hover:border-cyan-200 flex items-center justify-center transition-colors cursor-pointer"
                  title={isOpen ? 'Collapse Sub-tree' : 'Expand Sub-tree'}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Recursive Nested Sub-branches if any */}
          {hasChildren && isOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100 pl-4 sm:pl-6 space-y-4">
              {node.children!.map((subChild, subIdx) => (
                <MetroTreeNode
                  key={subChild.id || subChild.code}
                  node={subChild}
                  index={subIdx + 1}
                  isLast={subIdx === node.children!.length - 1}
                  defaultExpanded={defaultExpanded}
                  onCopyCode={onCopyCode}
                  copiedCode={copiedCode}
                  partnerLeadCount={getLeadCountForNode ? getLeadCountForNode(subChild.name, subChild.code) : 0}
                  onNavigateToLeads={onNavigateToLeads}
                  getLeadCountForNode={getLeadCountForNode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export const NetworkTreeTab: React.FC<NetworkTreeTabProps> = ({ onNavigateTab }) => {
  const [partnerNodes, setPartnerNodes] = useState<PartnerNode[]>([])
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [expandAll] = useState(true)
  const [isCpHead, setIsCpHead] = useState<boolean>(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<{
    name: string
    code: string
    superior_code?: string
  }>({
    name: 'Channel Partner',
    code: 'CP-101',
  })

  const handleCopyCode = (code: string) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const loadTreeData = async () => {
    setLoading(true)
    try {
      const [treeRes, profileRes, teamRes, leadsRes] = await Promise.all([
        ApiService.getPartnerTree().catch(() => null),
        ApiService.getPartnerProfile().catch(() => null),
        ApiService.getMyTeam().catch(() => null),
        ApiService.getLeads().catch(() => []),
      ])

      setAllLeads(Array.isArray(leadsRes) ? leadsRes : [])

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
        (cpHeadStatus ? 'POKALA REDDY' : 'Channel Partner')
      const myCode =
        profile?.partner_code ||
        localStorage.getItem('maytri_profile_code') ||
        (cpHeadStatus ? 'MAYTRIA02' : 'CP-101')
      const myEmail = profile?.user?.email || user?.email || profile?.email || ''
      const superiorCode = profile?.superior_code || profile?.superiorCode || ''

      setPartnerProfile({
        name: myName,
        code: myCode,
        superior_code: superiorCode,
      })

      let builtNodes: PartnerNode[] = []

      if (cpHeadStatus) {
        if (treeRes && treeRes.ok && treeRes.data) {
          const raw = treeRes.data.data || treeRes.data.tree || treeRes.data.items || treeRes.data
          if (Array.isArray(raw) && raw.length > 0) {
            builtNodes = raw
              .filter((item: any) => isApprovedAccount(item))
              .map((item: any, idx: number) => {
                const approvedChildren = (item.children || [])
                  .filter((c: any) => isApprovedAccount(c))
                  .map((c: any, cIdx: number) => ({
                    id: c.id || cIdx + 101,
                    code: c.partner_code || c.code || `MAYTRIB0${cIdx + 1}`,
                    name:
                      c.full_name ||
                      c.name ||
                      `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
                      'Channel Partner',
                    role: c.role || c.partner_type || 'CHANNEL_PARTNER',
                    email: c.user?.email || c.email || '',
                    phone: c.user?.mobile || c.mobile || c.phone || '',
                    teamCount: c.team_count || 0,
                    children: [],
                  }))

                return {
                  id: item.id || idx + 1,
                  code: item.partner_code || item.code || `MAYTRIA0${idx + 1}`,
                  name:
                    item.full_name ||
                    item.name ||
                    `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                    'CP Head',
                  role: item.role || item.partner_type || 'CP_HEAD',
                  email: item.user?.email || item.email || '',
                  phone: item.user?.mobile || item.mobile || item.phone || '',
                  teamCount: approvedChildren.length,
                  children: approvedChildren,
                }
              })
          }
        }

        if (builtNodes.length === 0) {
          const teamData = teamRes?.ok ? teamRes.data?.data || teamRes.data : null
          const rawTeam =
            teamData?.team ||
            teamData?.items ||
            teamData?.members ||
            (Array.isArray(teamData) ? teamData : [])

          const approvedMembers = (Array.isArray(rawTeam) ? rawTeam : []).filter((m: any) =>
            isApprovedAccount(m)
          )

          const childrenNodes: PartnerNode[] = approvedMembers.map((m: any, idx: number) => ({
            id: m.id || idx + 10,
            code: m.partner_code || m.code || `MAYTRIB0${idx + 1}`,
            name:
              m.full_name ||
              m.name ||
              `${m.first_name || ''} ${m.last_name || ''}`.trim() ||
              'Channel Partner',
            role: 'CHANNEL_PARTNER',
            email: m.email || m.user?.email || '',
            phone: m.mobile || m.phone || '',
            teamCount: 0,
            children: [],
          }))

          builtNodes = [
            {
              id: profile?.id || 'head-1',
              code: myCode,
              name: myName,
              role: 'CP_HEAD',
              email: myEmail,
              teamCount: childrenNodes.length,
              children: childrenNodes.length > 0 ? childrenNodes : DEFAULT_CP_HEAD_TREE[0].children,
            },
          ]
        }
      } else {
        builtNodes = []
      }

      setPartnerNodes(builtNodes)
    } catch (err) {
      console.warn('Failed to load tree:', err)
      setPartnerNodes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTreeData()
  }, [])

  const totalDownlinesCount = useMemo(() => {
    return partnerNodes.reduce(
      (acc, curr) => acc + (curr.children ? curr.children.length : 0),
      0
    )
  }, [partnerNodes])

  // Helper to compute lead count assigned or sourced by partner
  const getPartnerLeadCount = (partnerName: string, partnerCode?: string): number => {
    if (!partnerName) return 0
    const nLower = partnerName.toLowerCase().trim()
    const cLower = (partnerCode || '').toLowerCase().trim()

    return allLeads.filter((l) => {
      const assigned = (l.assignedTo || '').toLowerCase().trim()
      const src = (l.source || '').toLowerCase().trim()

      if (assigned && (assigned === nLower || assigned.includes(nLower) || nLower.includes(assigned))) {
        return true
      }
      if (src && (src === nLower || src.includes(nLower) || nLower.includes(src))) {
        return true
      }
      if (cLower && (assigned.includes(cLower) || src.includes(cLower))) {
        return true
      }
      return false
    }).length
  }

  // ==========================================
  // CHANNEL PARTNER NOTICE BANNER VIEW
  // ==========================================
  if (!isCpHead) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto font-sans selection:bg-[#0092b3] selection:text-white animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-cyan-50/40 p-6 sm:p-10 shadow-xs">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#0092b3]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0092b3]/10 text-[#0092b3] border border-[#0092b3]/20 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Channel Partner Node</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Network Tree Not Applicable
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                As an independent <span className="font-bold text-slate-900">Channel Partner</span>, you operate directly with Maytri Group. Multi-tier downline networks and team hierarchies are configured exclusively for <span className="font-bold text-[#0092b3]">Channel Partner Heads (CP Heads)</span>.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                You can directly register leads, schedule visits, and track conversions from your portal.
              </p>
            </div>

            {/* Account Info Pill */}
            <div className="shrink-0 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 min-w-[260px]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Your Network Node
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
                  <span className="text-slate-500 font-semibold">Role:</span>
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
    <div className="space-y-6 max-w-5xl mx-auto font-sans selection:bg-[#0092b3] selection:text-white">
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0092b3] to-cyan-700 text-white flex items-center justify-center shadow-xs">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Network Hierarchy Tree
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Hierarchical vertical tree connecting your partner downlines
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Refresh Action */}
          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Downlines:</span>
              <strong className="text-slate-900 font-black">{totalDownlinesCount} Active</strong>
            </span>

            <Button
              variant="outline"
              onClick={loadTreeData}
              disabled={loading}
              className="h-9 px-3.5 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-[#0092b3]', loading && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. MAIN VERTICAL METRO HIERARCHY TREE */}
      {loading ? (
        <NetworkTreeSkeleton />
      ) : partnerNodes.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200/90 shadow-2xs text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <GitFork className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-900">No approved partner hierarchy found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {partnerNodes.map((headNode) => {
            const children = headNode.children || []

            return (
              <div key={headNode.id || headNode.code} className="space-y-4">
                {/* ROOT CP HEAD HERO CARD */}
                <div className="relative overflow-hidden rounded-3xl border border-[#0092b3]/40 bg-gradient-to-br from-cyan-50/70 via-white to-white p-5 sm:p-7 shadow-xs">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-[#0092b3]/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Crown Avatar */}
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0092b3] to-cyan-700 text-white font-black text-base flex items-center justify-center shadow-md shadow-[#0092b3]/25 shrink-0 ring-4 ring-white">
                        <Crown className="h-7 w-7" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-[#0092b3] text-white shadow-2xs">
                            CP Head (Root Executive)
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Active Node
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          {headNode.name}
                        </h3>

                        <div className="flex items-center gap-3 flex-wrap text-xs pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-semibold">Partner Code:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(headNode.code)}
                              className="font-mono text-xs font-bold text-[#0092b3] bg-white hover:bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Click to copy code"
                            >
                              <span>{headNode.code}</span>
                              {copiedCode === headNode.code ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-400" />
                              )}
                            </button>
                          </div>

                          {headNode.email && (
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{headNode.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Stat: Click to view all leads */}
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('leads')}
                      className="shrink-0 bg-white/90 backdrop-blur-xs border border-cyan-200/70 hover:border-[#0092b3] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4 min-w-[200px] justify-between md:justify-end text-left cursor-pointer group/stat"
                      title="View All Network Leads"
                    >
                      <div>
                        <span className="text-[10px] font-black text-[#0092b3] uppercase tracking-wider block">
                          Total Leads
                        </span>
                        <h4 className="text-2xl font-black text-slate-900 mt-0.5 group-hover/stat:text-[#0092b3] transition-colors flex items-center gap-1">
                          <span>{allLeads.length}</span>
                          <ArrowRight className="h-4 w-4 opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                        </h4>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#0092b3] group-hover/stat:bg-[#0092b3] group-hover/stat:text-white transition-colors flex items-center justify-center font-bold">
                        <Users className="h-5 w-5" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* STEM DROP TO TIMELINE RAIL */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#0092b3] to-slate-300" />
                  <div className="h-6 px-3 rounded-full bg-slate-100 border border-slate-200 text-[10.5px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                    <ArrowDown className="h-3 w-3 text-[#0092b3]" />
                    <span>Downline Network Hierarchy</span>
                  </div>
                  <div className="w-0.5 h-6 bg-slate-300" />
                </div>

                {/* VERTICAL METRO TIMELINE CONTAINER */}
                <div className="bg-slate-50/60 p-4 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs">
                  {children.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-200">
                      No downline partners registered yet
                    </div>
                  ) : (
                    <div className="space-y-0 max-w-3xl mx-auto">
                      {children.map((child, cIdx) => (
                        <MetroTreeNode
                          key={child.id || child.code}
                          node={child}
                          index={cIdx + 1}
                          isLast={cIdx === children.length - 1}
                          defaultExpanded={expandAll}
                          onCopyCode={handleCopyCode}
                          copiedCode={copiedCode}
                          partnerLeadCount={getPartnerLeadCount(child.name, child.code)}
                          onNavigateToLeads={(partnerName) => onNavigateTab?.('leads', partnerName)}
                          getLeadCountForNode={getPartnerLeadCount}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NetworkTreeTab
