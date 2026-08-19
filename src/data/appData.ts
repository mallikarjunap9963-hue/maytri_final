export interface ProjectMedia {
  id: number
  media_type: string
  file_url: string
  title: string
  display_order: number
}

export interface Project {
  id: string
  name: string
  location: string
  status: 'Ongoing' | 'Upcoming' | 'Completed' | string
  type?: string
  totalUnits?: number
  availableUnits?: number
  startingPrice?: string
  image?: string
  thumbnail?: string | null
  projectCode?: string
  slug?: string
  city?: string
  state?: string
  pincode?: string
  isActive?: boolean
  description?: string | null
  developerName?: string | null
  startDate?: string | null
  completionDate?: string | null
  reraNumber?: string | null
  brochure?: string | null
  media?: ProjectMedia[] | null
  rawId?: number
  updatedAt?: string
  createdAt?: string
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow Up'
  | 'Interested'
  | 'Converted'
  | 'Lost'
  | string

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  project: string
  budget: string
  source: string
  stage: LeadStatus
  createdDate: string
  notes?: string
  lastActivity?: string
  assignedSalesExec?: string
  assignedTo?: string
  unitType?: string
  project_id?: number
  city?: string
  requirement?: string
  follow_up_date?: string
  rawId?: number | string
  partner_id?: number
  created_by_id?: number
}

export interface InventoryItem {
  id: string
  project: string
  block: string
  unitNo: string
  floor: number
  type: string
  sqft: number
  facing: string
  price: string
  numericPrice: number
  status: 'Available' | 'Reserved' | 'Booked' | 'Blocked'
}

export interface SiteVisit {
  id: string
  leadName: string
  leadPhone: string
  project: string
  date: string
  time: string
  salesExecutive: string
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled'
  cabRequired: boolean
  notes?: string
}

export interface Booking {
  id: string
  customerName: string
  phone: string
  project: string
  unitNo: string
  agreementValue: string
  amountPaid: string
  balanceDue: string
  constructionStage: string
  bankName: string
  bookingDate: string
  nextMilestone: string
}

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    rawId: 1,
    name: 'Maytri Sky Villas',
    projectCode: 'MAY-101',
    location: 'Financial District, Nanakramguda',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    status: 'Ongoing',
    type: 'Sky Mansions & Penthouse Villas',
    totalUnits: 120,
    availableUnits: 28,
    startingPrice: '₹ 2.85 Cr',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-luxury high-rise sky mansions with private plunge pools, floor-to-ceiling glass vistas, and dedicated concierge in the heart of Hyderabad financial district.',
    developerName: 'Maytri Group Developers Pvt Ltd',
    reraNumber: 'P02400004128',
    isActive: true,
  },
  {
    id: '2',
    rawId: 2,
    name: 'Maytri Boulevard',
    projectCode: 'MAY-102',
    location: 'Gachibowli IT Corridor',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    status: 'Ongoing',
    type: '3 & 4 BHK Luxury Condominiums',
    totalUnits: 240,
    availableUnits: 64,
    startingPrice: '₹ 1.75 Cr',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    description: 'Biophilic architecture condominiums featuring 45,000 sq.ft clubhouse, infinity pool, co-working suites, and EV charging stations.',
    developerName: 'Maytri Group Developers Pvt Ltd',
    reraNumber: 'P02400004129',
    isActive: true,
  },
  {
    id: '3',
    rawId: 3,
    name: 'Maytri Green Meadows',
    projectCode: 'MAY-103',
    location: 'Mokila - Shankarpally Highway',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '501203',
    status: 'Upcoming',
    type: 'Gated Luxury Triplex Villas',
    totalUnits: 85,
    availableUnits: 32,
    startingPrice: '₹ 3.40 Cr',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
    description: 'Exclusive 40-acre gated villa sanctuary with organic orchards, sports arena, private terrace gardens, and 100% vaastu compliance.',
    developerName: 'Maytri Group Developers Pvt Ltd',
    reraNumber: 'P02400004130',
    isActive: true,
  },
  {
    id: '4',
    rawId: 4,
    name: 'Maytri Crest High-Rise',
    projectCode: 'MAY-104',
    location: 'Kondapur Near Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500084',
    status: 'Completed',
    type: '2 & 3 BHK Smart Living Suites',
    totalUnits: 180,
    availableUnits: 12,
    startingPrice: '₹ 1.25 Cr',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    description: 'Ready-to-move-in smart homes with IoT automated climate control, rooftop sky lounge, and 2-minute connectivity to top tech parks.',
    developerName: 'Maytri Group Developers Pvt Ltd',
    reraNumber: 'P02400004131',
    isActive: true,
  },
]

export const PROJECTS: Project[] = DEFAULT_PROJECTS

export const MONTHLY_SALES_DATA = [
  { month: 'Jan', sales: 4.2 },
  { month: 'Feb', sales: 5.8 },
  { month: 'Mar', sales: 7.1 },
  { month: 'Apr', sales: 6.5 },
  { month: 'May', sales: 8.9 },
  { month: 'Jun', sales: 11.4 },
  { month: 'Jul', sales: 9.8 },
  { month: 'Aug', sales: 14.2 },
]

export const MOCK_LEADS: Lead[] = []

export const MOCK_SITE_VISITS: SiteVisit[] = []

