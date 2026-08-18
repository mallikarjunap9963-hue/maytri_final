import React, { useState, useEffect } from 'react'
import {
  Filter,
  CheckCircle,
  Clock,
  Lock,
  Compass,
  Calculator,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Project, InventoryItem } from '@/data/appData'
import { cn } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'

interface InventoryTabProps {
  selectedProject: string
  setSelectedProject: (val: string) => void
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  selectedProject,
  setSelectedProject,
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedUnit, setSelectedUnit] = useState<InventoryItem | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadInventoryData() {
      setLoading(true)
      const [invData, projsData] = await Promise.all([
        ApiService.getInventory(),
        ApiService.getProjects(),
      ])
      if (isMounted) {
        setInventory(invData)
        setProjects(projsData)
        setLoading(false)
      }
    }
    loadInventoryData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredInventory = inventory.filter((item) => {
    const matchesProject = selectedProject === 'ALL' || item.project === selectedProject
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesProject && matchesStatus
  })

  const availableCount = filteredInventory.filter((i) => i.status === 'Available').length
  const reservedCount = filteredInventory.filter((i) => i.status === 'Reserved').length
  const bookedCount = filteredInventory.filter((i) => i.status === 'Booked').length

  if (loading) {
    return <MiniLoader />
  }

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header & Project Quick Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-slate-200 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Property Unit Inventory & Availability Matrix
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Real-time status of flats, villas, carpet area, and cost calculator.
          </p>
        </div>

        {/* Project Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedProject('ALL')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
              selectedProject === 'ALL'
                ? 'bg-[#2a94b5] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            All Projects
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.name)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                selectedProject === p.name
                  ? 'bg-[#2a94b5] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 bg-emerald-50/40">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600">Available</span>
              <p className="text-lg font-bold text-emerald-700">{availableCount} Units</p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-amber-50/40">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600">Reserved / Token</span>
              <p className="text-lg font-bold text-amber-700">{reservedCount} Units</p>
            </div>
            <Clock className="h-6 w-6 text-amber-600" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600">Booked & Sold</span>
              <p className="text-lg font-bold text-slate-800">{bookedCount} Units</p>
            </div>
            <Lock className="h-6 w-6 text-slate-400" />
          </CardContent>
        </Card>

        {/* Status Filter */}
        <Card className="border-slate-200">
          <CardContent className="p-3.5 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#2a94b5]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Reserved">Reserved Only</option>
              <option value="Booked">Booked Only</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Visual Unit Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {filteredInventory.map((unit) => {
          const isAvailable = unit.status === 'Available'
          const isReserved = unit.status === 'Reserved'

          return (
            <div
              key={unit.id}
              onClick={() => setSelectedUnit(unit)}
              className={cn(
                'group relative rounded-lg border p-3.5 transition-colors cursor-pointer bg-white text-slate-800',
                isAvailable
                  ? 'border-emerald-300 hover:border-emerald-500'
                  : isReserved
                  ? 'border-amber-300 hover:border-amber-500'
                  : 'border-slate-200 bg-slate-50 opacity-70'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {unit.unitNo}
                </span>
                <Badge
                  variant={isAvailable ? 'success' : isReserved ? 'default' : 'secondary'}
                  className="text-[9px] font-medium px-1"
                >
                  {unit.status}
                </Badge>
              </div>

              <p className="text-xs font-medium text-slate-700">
                {unit.type} • Fl. {unit.floor}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-xs border-t border-slate-100 pt-2 font-medium">
                <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                  <Compass className="h-3 w-3 text-[#2a94b5]" /> {unit.facing}
                </span>
                <span className="font-semibold text-[#2a94b5]">{unit.price}</span>
              </div>

              <div className="mt-1.5 text-[10px] text-slate-500 flex items-center justify-between font-normal">
                <span>{unit.sqft} sq.ft</span>
                <span className="group-hover:text-[#2a94b5] font-medium flex items-center gap-0.5">
                  <Calculator className="h-3 w-3" /> Breakup
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* COST CALCULATOR MODAL */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md border-slate-200 shadow-lg bg-white rounded-lg">
            <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedUnit.status === 'Available' ? 'success' : 'default'} className="font-normal text-[10px]">
                    {selectedUnit.status}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{selectedUnit.project}</span>
                </div>
                <CardTitle className="text-lg font-semibold mt-1 text-slate-900">
                  Unit Cost: {selectedUnit.unitNo}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {selectedUnit.type} ({selectedUnit.sqft} sq.ft) • {selectedUnit.facing}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedUnit(null)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 text-xs text-slate-700">
              <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-normal">Base Price ({selectedUnit.sqft} sq.ft)</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {(selectedUnit.numericPrice * 0.85).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-normal">Car Parking & Amenities</span>
                  <span className="font-semibold text-slate-800">₹ 5,00,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-normal">GST (5%)</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {(selectedUnit.numericPrice * 0.05).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-normal">Stamp Duty & Registration (7.5%)</span>
                  <span className="font-semibold text-slate-800">
                    ₹ {(selectedUnit.numericPrice * 0.075).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 pt-2 text-xs font-bold border-t border-slate-200 text-[#2a94b5]">
                  <span>Total Agreement Cost</span>
                  <span>₹ {(selectedUnit.numericPrice * 1.125).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Estimated Home Loan EMI */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Estimated Bank Loan EMI (80% Loan @ 8.5% for 20 Yrs)
                </span>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600 font-normal">Monthly Installment:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹ {Math.round((selectedUnit.numericPrice * 0.8 * 0.00868)).toLocaleString('en-IN')} / mo
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    alert(`Booking quotation generated for Unit ${selectedUnit.unitNo}`)
                    setSelectedUnit(null)
                  }}
                  variant="default"
                  className="w-full font-medium h-9 bg-[#2a94b5] hover:bg-[#237d99] text-white text-xs"
                >
                  Generate Official Quotation PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
