import React from 'react'
import {
  TrendingUp,
  Award,
  Target,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { MONTHLY_SALES_DATA } from '@/data/appData'

export const AnalyticsTab: React.FC = () => {
  const repsLeaderboard = [
    { name: 'Vikram Reddy', role: 'Senior Director', deals: 14, revenue: '₹ 18.5 Cr', targetPct: '115%' },
    { name: 'Ananya Rao', role: 'Sales Executive', deals: 9, revenue: '₹ 12.2 Cr', targetPct: '98%' },
    { name: 'Sneha Kapoor', role: 'Real Estate Advisor', deals: 7, revenue: '₹ 9.4 Cr', targetPct: '90%' },
  ]

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          Sales Analytics & Performance
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          Reports on monthly sales targets, lead velocity, campaign ROI, and rep rankings.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Average Deal Size</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                ₹ 1.85 Cr
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3" /> +8.4% vs last quarter
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#2a94b5]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Lead-to-Booking Ratio</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                28.4%
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3" /> Industry avg: 18%
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#2a94b5]">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Top Acquisition Channel</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                Direct Website
              </p>
              <span className="text-[11px] font-semibold text-[#2a94b5] flex items-center gap-1 mt-0.5">
                38% of high-budget leads
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-[#2a94b5]">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Volume Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900">Monthly Enquiries & Bookings</CardTitle>
            <CardDescription>Comparison of incoming leads vs closed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_SALES_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '6px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="leads" name="Total Enquiries" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="bookings" name="Bookings Closed" fill="#2a94b5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Executives Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#2a94b5]" /> Sales Rep Leaderboard
            </CardTitle>
            <CardDescription>Top deal closers for Q3 FY26</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {repsLeaderboard.map((rep, idx) => (
              <div
                key={rep.name}
                className="flex items-center justify-between p-2.5 rounded-md border border-slate-100 bg-slate-50/50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a94b5] text-white font-semibold text-[11px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">
                      {rep.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">{rep.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-xs text-[#2a94b5]">
                    {rep.revenue}
                  </p>
                  <p className="text-[10px] text-slate-500">{rep.deals} Deals ({rep.targetPct})</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
