import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Dashboard Overview Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 border border-slate-200 shadow-2xs rounded-2xl bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>

      {/* Channel Partner Performance Table Skeleton */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-60 rounded-lg" />
            <Skeleton className="h-3 w-80 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-3.5 px-6">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </th>
                  <th className="py-3.5 px-6 text-center">
                    <Skeleton className="h-3.5 w-16 mx-auto rounded-md" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <div className="flex items-start gap-3.5">
                        <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-4 w-36 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-lg" />
                          </div>
                          <Skeleton className="h-3 w-3/4 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-7 w-10 rounded-full" />
                        <Skeleton className="h-7 w-24 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Leads Pipeline / Table Skeleton
 */
export const LeadsTableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toolbar Skeleton */}
      <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-4 px-6"><Skeleton className="h-3.5 w-28 rounded-md" /></th>
                <th className="py-4 px-5"><Skeleton className="h-3.5 w-20 rounded-md" /></th>
                <th className="py-4 px-5"><Skeleton className="h-3.5 w-20 rounded-md" /></th>
                <th className="py-4 px-5"><Skeleton className="h-3.5 w-24 rounded-md" /></th>
                <th className="py-4 px-5"><Skeleton className="h-3.5 w-24 rounded-md" /></th>
                <th className="py-4 px-6 text-right"><Skeleton className="h-3.5 w-16 ml-auto rounded-md" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  {/* Customer Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                    </div>
                  </td>
                  {/* Project */}
                  <td className="py-4 px-5">
                    <Skeleton className="h-7 w-28 rounded-lg" />
                  </td>
                  {/* Status */}
                  <td className="py-4 px-5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  {/* Assigned */}
                  <td className="py-4 px-5">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </td>
                  {/* Date */}
                  <td className="py-4 px-5">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                  </td>
                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Skeleton className="h-7 w-16 rounded-lg" />
                      <Skeleton className="h-7 w-16 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Skeleton */}
        <div className="p-3.5 px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-44 rounded-md" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-14 rounded-xl" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-xl" />
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Network Tree Hierarchy Skeleton
 */
export const NetworkTreeSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Tree Visualization Card */}
      <Card className="p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs min-h-[420px] flex flex-col items-center justify-center space-y-8">
        {/* Root Node */}
        <div className="p-4 w-64 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center gap-3 shadow-xs">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>

        {/* Tree Branch Line */}
        <Skeleton className="h-8 w-1 rounded-full" />

        {/* Child Level Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center gap-3 shadow-2xs">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * Universal Data Table Skeleton (MyTeam, Users, ChannelPartners)
 */
export const TableDataSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search and Action Bar */}
      <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                {Array.from({ length: columns }).map((_, c) => (
                  <th key={c} className="py-4 px-6">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: columns - 1 }).map((_, c) => (
                    <td key={c} className="py-4 px-6">
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
