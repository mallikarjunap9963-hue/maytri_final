import React, { useState, useEffect } from 'react'
import {
  Phone,
  Building2,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Booking } from '@/data/appData'
import { ApiService } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'

interface BookingsTabProps {
  selectedProject: string
}

export const BookingsTab: React.FC<BookingsTabProps> = ({ selectedProject }) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    async function loadBookingsData() {
      setLoading(true)
      const data = await ApiService.getBookings()
      if (isMounted) {
        setBookings(data)
        setLoading(false)
      }
    }
    loadBookingsData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredBookings = bookings.filter((b) => {
    return selectedProject === 'ALL' || b.project === selectedProject
  })

  if (loading) {
    return <MiniLoader />
  }

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Confirmed Bookings & Milestone Payments
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Track customer agreement values, payment schedules, and bank loans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-medium text-slate-700 border-slate-200">
            <Download className="h-3.5 w-3.5 text-slate-400" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3.5">
        {filteredBookings.map((booking) => (
          <Card
            key={booking.id}
            className="border-slate-200 bg-white text-slate-800"
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#2a94b5]">
                      {booking.id}
                    </span>
                    <Badge variant="success" className="text-[10px] font-normal">
                      Confirmed
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                    {booking.customerName}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-normal">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" /> {booking.project} (Unit {booking.unitNo})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="h-3 w-3 text-slate-400" /> {booking.phone}
                    </span>
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="flex items-center gap-3.5 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block uppercase">
                      Total Agreement
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {booking.agreementValue}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block uppercase">
                      Amount Paid
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {booking.amountPaid}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-slate-200" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block uppercase">
                      Balance Due
                    </span>
                    <span className="text-sm font-bold text-[#2a94b5]">
                      {booking.balanceDue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress & Milestone */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>
                      Milestone: <strong className="text-slate-900 font-medium">{booking.constructionStage}</strong>
                    </span>
                    <span className="text-[#2a94b5] font-semibold">Stage 4 of 6</span>
                  </div>
                  <Progress value={65} className="h-1.5" />
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#2a94b5] shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Next Payment Milestone
                      </span>
                      <span className="text-slate-500 font-normal">
                        {booking.nextMilestone}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => alert(`Payment Demand Note sent to ${booking.customerName}`)}
                    size="sm"
                    variant="default"
                    className="h-7 text-[11px] font-medium shrink-0 ml-2 bg-[#2a94b5] hover:bg-[#237d99] text-white"
                  >
                    Send Demand
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
