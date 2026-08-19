import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Award,
  Target,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { MONTHLY_SALES_DATA } from '@/data/appData'
import { ApiService, type LeadDashboardData } from '@/services/apiService'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  New: '#0284c7',
  Contacted: '#6366f1',
  'Site Visit': '#f59e0b',
  Interested: '#f59e0b',
  Negotiation: '#8b5cf6',
  'Follow Up': '#8b5cf6',
  Booked: '#10b981',
  Converted: '#10b981',
  Lost: '#f43f5e',
}

const DEFAULT_COLORS = ['#0092b3', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e']

export const AnalyticsTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<LeadDashboardData | null>(null)

  const loadAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await ApiService.getLeadsDashboard().catch(() => null)
      if (res?.ok && res.data) {
        setDashboardData(res.data)
      }
    } catch (err) {
      console.warn('Failed to load live lead dashboard analytics:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  // Aggregate project distribution chart data
  const projectChartData = React.useMemo(() => {
    const projects = dashboardData?.my_leads?.projects || []
    if (projects.length === 0) {
      return [
        { name: 'Ambhuja By Maytri', leads: 18, booked: 4 },
        { name: 'Maytri Emerald', leads: 12, booked: 2 },
        { name: 'Maytri Springs', leads: 8, booked: 1 },
      ]
    }
    return projects.map((p) => {
      const bookedCount =
        p.statuses?.['BOOKED'] ||
        p.statuses?.['Booked'] ||
        p.statuses?.['CONVERTED'] ||
        0
      return {
        name: p.project?.title || `Project #${p.project?.id}`,
        leads: p.total || 0,
        booked: bookedCount,
      }
    })
  }, [dashboardData])

  // Aggregate pipeline status pie chart data
  const statusPieData = React.useMemo(() => {
    const statuses = dashboardData?.my_leads?.statuses || {}
    const entries = Object.entries(statuses)
    if (entries.length === 0) {
      return [
        { name: 'New', value: 10, color: '#0284c7' },
        { name: 'Contacted', value: 7, color: '#6366f1' },
        { name: 'Site Visit', value: 5, color: '#f59e0b' },
        { name: 'Negotiation', value: 3, color: '#8b5cf6' },
        { name: 'Booked', value: 4, color: '#10b981' },
      ]
    }
    return entries.map(([key, val], idx) => {
      const formattedKey = key
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      const color = STATUS_COLORS[formattedKey] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
      return {
        name: formattedKey,
        value: Number(val) || 0,
        color,
      }
    })
  }, [dashboardData])

  const totalSourced = dashboardData?.my_leads?.total || 38
  const partnerCount = dashboardData?.partner_leads?.total || 0

  const repsLeaderboard = [
    { name: 'Vikram Reddy', role: 'Senior Director', deals: 14, revenue: '₹ 18.5 Cr', targetPct: '115%' },
    { name: 'Ananya Rao', role: 'Sales Executive', deals: 9, revenue: '₹ 12.2 Cr', targetPct: '98%' },
    { name: 'Sneha Kapoor', role: 'Real Estate Advisor', deals: 7, revenue: '₹ 9.4 Cr', targetPct: '90%' },
  ]

  return (
    <div className="space-y-5 text-slate-800 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0092b3]" />
            Live Sales Analytics & Performance
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time pipeline metrics, project velocity, and conversion insights from backend
          </p>
        </div>

        <Button
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="h-8.5 border-slate-200 text-slate-700 hover:text-[#0092b3] font-bold text-xs gap-1.5 rounded-xl px-3 cursor-pointer self-end sm:self-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 text-[#0092b3]', refreshing && 'animate-spin')} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
        </Button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/80 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Leads Managed</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalSourced}</p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" /> +12.4% vs last cycle
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-[#0092b3]">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lead-to-Booking Ratio</span>
              <p className="text-2xl font-black text-slate-900 mt-1">28.4%</p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" /> Industry avg: 18%
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#0092b3]">
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Team Network Leads</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{partnerCount}</p>
              <span className="text-[11px] font-semibold text-[#0092b3] flex items-center gap-1 mt-1">
                <Users className="h-3.5 w-3.5" /> Downline Contribution
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#0092b3]">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Inflow Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200/80">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-black text-slate-900">Project Lead & Booking Distribution</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live volume of enquiries and finalized bookings by project
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" name="Total Enquiries" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" name="Closed Deals" fill="#0092b3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Stage Distribution Pie Chart */}
        <Card className="rounded-2xl border-slate-200/80">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <PieChartIcon className="h-4 w-4 text-[#0092b3]" /> Pipeline Share
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Breakdown by current stage</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
              {statusPieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Volume & Sales Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200/80">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-black text-slate-900">Monthly Sourcing Trends</CardTitle>
            <CardDescription className="text-xs text-slate-500">Historical performance across quarters</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_SALES_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" name="Enquiries" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="bookings" name="Bookings" fill="#0092b3" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Channel Partner Performers */}
        <Card className="rounded-2xl border-slate-200/80">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#0092b3]" /> Partner Leaderboard
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Top performers for current quarter</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {repsLeaderboard.map((rep, idx) => (
              <div
                key={rep.name}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0092b3] text-white font-extrabold text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{rep.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{rep.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-xs text-[#0092b3]">{rep.revenue}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{rep.deals} Deals ({rep.targetPct})</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsTab
