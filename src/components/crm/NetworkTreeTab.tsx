import React, { useState, useEffect } from 'react'
import {
  GitFork,
  Users,
  Search,
  RefreshCw,
  Crown,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiService, AuthToken } from '@/services/apiService'
import { NetworkTreeSkeleton } from '@/components/common/Skeletons'
import { cn } from '@/lib/utils'

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
    teamCount: 2,
    children: [
      {
        id: 'cp-101',
        code: 'CP-101',
        name: 'Gumpu Himavamsi',
        role: 'CHANNEL_PARTNER',
        email: 'himavamsi@maytri.com',
        teamCount: 0,
        children: [],
      },
      {
        id: 'cp-102',
        code: 'CP-102',
        name: 'Malli Reddy',
        role: 'CHANNEL_PARTNER',
        email: 'malli.reddy@example.com',
        teamCount: 0,
        children: [],
      },
    ],
  },
]

interface OrgChartNodeProps {
  node: PartnerNode
  defaultExpanded?: boolean
}

const OrgChartNode: React.FC<OrgChartNodeProps> = ({ node, defaultExpanded = true }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded)
  const hasChildren = node.children && node.children.length > 0
  const isCpHead =
    String(node.role).toUpperCase().includes('HEAD') ||
    String(node.role).toUpperCase() === 'CP_HEAD'

  useEffect(() => {
    setIsOpen(defaultExpanded)
  }, [defaultExpanded])

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-200">
      {/* MINIMALIST CLEAN WHITE CARD */}
      <div
        className={cn(
          'relative bg-white border rounded-xl p-3.5 w-56 sm:w-60 shadow-2xs hover:shadow-xs transition-all text-left z-10',
          isCpHead
            ? 'border-[#0092b3]/60 ring-2 ring-[#0092b3]/10'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {/* Role Header Indicator */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isCpHead ? 'bg-[#0092b3]' : 'bg-emerald-500'
              )}
            />
            <span className={isCpHead ? 'text-[#0092b3]' : 'text-emerald-700'}>
              {isCpHead ? 'CP Head' : 'Channel Partner'}
            </span>
          </span>

          {hasChildren && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              title={isOpen ? 'Collapse' : 'Expand'}
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Partner Name & Code */}
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-slate-900 truncate" title={node.name}>
            {node.name}
          </h4>
          <p className="text-[11px] font-mono text-slate-500 font-medium">
            Code: {node.code}
          </p>
        </div>

        {/* Downlines Footer */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-semibold text-slate-500">
          <span>Downlines:</span>
          <strong className="text-slate-900 font-bold">
            {node.teamCount || (node.children ? node.children.length : 0)}
          </strong>
        </div>
      </div>

      {/* NEAT THIN CONNECTOR LINES */}
      {hasChildren && isOpen && (
        <div className="flex flex-col items-center w-full">
          {/* Thin Vertical Stem Line */}
          <div className="w-[1px] h-6 bg-slate-300" />

          {/* Children Container with Thin Horizontal Crossbar */}
          <div className="relative flex justify-center gap-6 sm:gap-10 pt-4 w-full">
            {/* Thin Horizontal Connector Line */}
            {node.children!.length > 1 && (
              <div
                className="absolute top-0 h-[1px] bg-slate-300"
                style={{
                  left: `${100 / (node.children!.length * 2)}%`,
                  right: `${100 / (node.children!.length * 2)}%`,
                }}
              />
            )}

            {node.children!.map((child) => (
              <div key={child.id || child.code} className="relative flex flex-col items-center">
                {/* Thin Vertical Drop Stem */}
                <div className="absolute -top-4 w-[1px] h-4 bg-slate-300" />
                <OrgChartNode node={child} defaultExpanded={defaultExpanded} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const NetworkTreeTab: React.FC = () => {
  const [partnerNodes, setPartnerNodes] = useState<PartnerNode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandAll, setExpandAll] = useState(true)

  const loadTreeData = async () => {
    setLoading(true)
    try {
      // Fetch tree, profile, and team endpoints concurrently
      const [treeRes, profileRes, teamRes] = await Promise.all([
        ApiService.getPartnerTree().catch(() => null),
        ApiService.getPartnerProfile().catch(() => null),
        ApiService.getMyTeam().catch(() => null),
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
        (isCpHead ? 'POKALA REDDY' : 'Channel Partner')
      const myCode =
        profile?.partner_code ||
        localStorage.getItem('maytri_profile_code') ||
        (isCpHead ? 'MAYTRIA02' : 'CP-101')
      const myEmail = profile?.user?.email || user?.email || profile?.email || ''

      let builtNodes: PartnerNode[] = []

      if (isCpHead) {
        // ==========================================
        // 1. CP HEAD LOGIN: Full Tree & Approved Downlines
        // ==========================================
        if (treeRes && treeRes.ok && treeRes.data) {
          const raw = treeRes.data.data || treeRes.data.items || treeRes.data
          if (Array.isArray(raw) && raw.length > 0) {
            builtNodes = raw
              .filter((item: any) => isApprovedAccount(item))
              .map((item: any, idx: number) => {
                const approvedChildren = (item.children || [])
                  .filter((c: any) => isApprovedAccount(c))
                  .map((c: any, cIdx: number) => ({
                    id: c.id || cIdx + 101,
                    code: c.partner_code || c.code || `MAYTRIA-SUB-${cIdx + 1}`,
                    name:
                      c.full_name ||
                      c.name ||
                      `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
                      'Channel Partner',
                    role: c.role || c.partner_type || 'CHANNEL_PARTNER',
                    email: c.user?.email || c.email || '',
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
            code: m.partner_code || m.code || `CP-${m.id || idx + 101}`,
            name:
              m.full_name ||
              m.name ||
              `${m.first_name || ''} ${m.last_name || ''}`.trim() ||
              'Channel Partner',
            role: 'CHANNEL_PARTNER',
            email: m.email || m.user?.email || '',
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
        // ==========================================
        // 2. CHANNEL PARTNER LOGIN: Show ONLY Channel Partner details (NO CP Head data)
        // ==========================================
        const isApproved = isApprovedAccount(profile) || profile?.is_approved === true || profile?.is_active !== false

        if (isApproved) {
          let cpChildren: PartnerNode[] = []

          if (treeRes && treeRes.ok && treeRes.data) {
            const treeData = treeRes.data.data || treeRes.data.tree || treeRes.data.items || treeRes.data
            const treeList = Array.isArray(treeData) ? treeData : [treeData]

            const findPartnerNode = (nodes: any[]): any => {
              for (const n of nodes) {
                if (!n) continue
                if (
                  n.partner_code === myCode ||
                  n.code === myCode ||
                  n.id === profile?.id ||
                  String(n.full_name || n.name || '').toLowerCase() === myName.toLowerCase()
                ) {
                  return n
                }
                if (n.children && Array.isArray(n.children)) {
                  const found = findPartnerNode(n.children)
                  if (found) return found
                }
              }
              return null
            }

            const partnerTree = findPartnerNode(treeList)
            if (partnerTree && partnerTree.children && Array.isArray(partnerTree.children)) {
              cpChildren = partnerTree.children
                .filter((c: any) => isApprovedAccount(c))
                .map((c: any, cIdx: number) => ({
                  id: c.id || `cp-sub-${cIdx + 1}`,
                  code: c.partner_code || c.code || `CP-${cIdx + 101}`,
                  name:
                    c.full_name ||
                    c.name ||
                    `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
                    'Channel Partner',
                  role: 'CHANNEL_PARTNER',
                  email: c.user?.email || c.email || '',
                  teamCount: c.children ? c.children.length : 0,
                  children: [],
                }))
            }
          }

          builtNodes = [
            {
              id: profile?.id || 'cp-self',
              code: myCode,
              name: myName,
              role: 'CHANNEL_PARTNER',
              email: myEmail,
              teamCount: cpChildren.length,
              children: cpChildren,
            },
          ]
        } else {
          builtNodes = []
        }
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

  // Filter tree nodes matching search query
  const filterTreeNodes = (nodes: PartnerNode[], query: string): PartnerNode[] => {
    if (!query.trim()) return nodes
    const q = query.toLowerCase()

    return nodes
      .map((node) => {
        const matchesSelf =
          node.name.toLowerCase().includes(q) ||
          node.code.toLowerCase().includes(q) ||
          node.role.toLowerCase().includes(q)

        const matchingChildren = node.children ? filterTreeNodes(node.children, query) : []

        if (matchesSelf || matchingChildren.length > 0) {
          return {
            ...node,
            children: matchingChildren.length > 0 ? matchingChildren : node.children,
          }
        }
        return null
      })
      .filter(Boolean) as PartnerNode[]
  }

  if (loading) {
    return <NetworkTreeSkeleton />
  }

  const filteredNodes = filterTreeNodes(partnerNodes, searchQuery)

  return (
    <div className="space-y-6 font-sans selection:bg-[#0092b3] selection:text-white">
      {/* TOOLBAR HEADER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code, or role..."
            className="pl-9.5 h-9.5 bg-slate-50 border-slate-200 text-xs font-bold rounded-xl text-slate-900 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#0092b3]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            onClick={() => setExpandAll(!expandAll)}
            className="h-9.5 px-4 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer shadow-2xs"
          >
            {expandAll ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Expand All</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={loadTreeData}
            disabled={loading}
            className="h-9.5 px-4 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#0092b3]', loading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* MINIMALIST ORG-CHART BOARD */}
      <div className="bg-white p-6 sm:p-12 rounded-3xl border border-slate-200/90 shadow-2xs min-h-[65vh]">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 rounded-full border-3 border-slate-200 border-t-[#0092b3] animate-spin" />
            <p className="text-xs font-bold text-slate-600">Loading partner org chart...</p>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <GitFork className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">No approved partner hierarchy found</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-8 pt-4">
            <div className="flex flex-wrap justify-center gap-10 sm:gap-14 min-w-max mx-auto px-4">
              {filteredNodes.map((node) => (
                <OrgChartNode key={node.id || node.code} node={node} defaultExpanded={expandAll} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkTreeTab
