import { useNavigate, useParams } from 'react-router-dom'
import {
  MapPin, Building2, CalendarDays, ScanLine, FileText,
  ArrowRight, ChevronRight, ExternalLink, Download, Share2, TowerControl
} from 'lucide-react'
import { mockSiteSummary } from '../data/mockData'
import clsx from 'clsx'

const statCards = [
  { label: 'Structures',  value: mockSiteSummary.structureCount,  icon: TowerControl,  iconColor: 'text-teal-400',   bg: 'bg-teal-400/8',   valColor: 'text-teal-900' },
  { label: 'Compounds',   value: mockSiteSummary.compoundCount,   icon: Building2,     iconColor: 'text-indigo-500', bg: 'bg-indigo-500/8', valColor: 'text-indigo-500' },
  { label: 'Site Visits', value: mockSiteSummary.siteVisitCount,  icon: CalendarDays,  iconColor: 'text-amber-600',  bg: 'bg-amber-500/8',  valColor: 'text-amber-600' },
  { label: 'Scans',       value: mockSiteSummary.scanCount,       icon: ScanLine,      iconColor: 'text-teal-300',   bg: 'bg-teal-300/8',   valColor: 'text-teal-300' },
  { label: 'Reports',     value: mockSiteSummary.reportCount,     icon: FileText,      iconColor: 'text-red-600',    bg: 'bg-red-600/8',    valColor: 'text-red-600' },
]

// FieldSync visit status
const statusColors: Record<string, string> = {
  'QA Editor':   'bg-teal-300/10 text-teal-600 border-teal-300/30',
  'Completed':   'bg-green-600/10 text-green-600 border-green-600/25',
  'In Progress': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'Not Started': 'bg-bg-gray-lm text-std-gray-lm border-nav-gray',
}

export default function SiteSummaryPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-std-gray-lm">
        <button onClick={() => navigate('/sites')} className="hover:text-black transition-colors">Sites</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate(`/sites/${siteId}`)} className="hover:text-black transition-colors">
          {mockSiteSummary.name}
        </button>
        <ChevronRight size={14} />
        <span className="text-teal-400 font-medium">Summary</span>
      </nav>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                {/* Dark Teal main heading */}
                <h1 className="text-2xl font-bold text-teal-900">{mockSiteSummary.name}</h1>
                <div className="flex items-center gap-1.5 mt-1.5 text-std-gray-lm">
                  <MapPin size={14} className="text-teal-400" />
                  <span className="text-sm">
                    {mockSiteSummary.coordinates.lat}, {mockSiteSummary.coordinates.lng}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-xs px-3 py-1.5">
                  <Share2 size={14} /> Share
                </button>
                <button
                  onClick={() => navigate(`/sites/${siteId}`)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  View Full Site Details <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-5 gap-3 mt-6">
              {statCards.map(({ label, value, icon: Icon, iconColor, bg, valColor }) => (
                <div key={label} className={clsx('rounded-xl p-3 flex flex-col items-center gap-2', bg)}>
                  <Icon size={22} className={iconColor} />
                  <span className={clsx('text-2xl font-bold', valColor)}>{value}</span>
                  <span className="text-xs text-std-gray-lm text-center font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map thumbnail */}
          <div className="lg:w-72 h-48 lg:h-auto bg-teal-100/40 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
            <div className="text-center text-teal-700">
              <MapPin size={32} className="mx-auto mb-2 text-red-600 drop-shadow" />
              <p className="text-xs font-medium">
                {mockSiteSummary.coordinates.lat.toFixed(4)}, {mockSiteSummary.coordinates.lng.toFixed(4)}
              </p>
              <button className="mt-2 text-xs text-blue-400 font-medium flex items-center gap-1 mx-auto hover:underline">
                <ExternalLink size={12} /> Open in Maps
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Structures */}
        <SectionCard
          title="Structures"
          count={mockSiteSummary.structures.length}
          icon={<TowerControl size={16} className="text-teal-400" />}
          onAdd={() => {}}
        >
          {mockSiteSummary.structures.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-400/8 flex items-center justify-center border border-teal-400/20">
                  <TowerControl size={18} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">{s.name}</p>
                  <p className="text-xs text-std-gray-lm">{s.type}</p>
                  <p className="text-xs text-std-gray-dm">{s.height} height</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-nav-gray group-hover:text-teal-400 transition-colors" />
            </div>
          ))}
        </SectionCard>

        {/* Compounds */}
        <SectionCard
          title="Compounds"
          count={mockSiteSummary.compounds.length}
          icon={<Building2 size={16} className="text-indigo-500" />}
          onAdd={() => {}}
        >
          {mockSiteSummary.compounds.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/8 flex items-center justify-center">
                  <Building2 size={16} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{c.name}</p>
                  <p className="text-xs text-std-gray-lm font-mono truncate max-w-[200px]">{c.cuid}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-nav-gray group-hover:text-indigo-500 transition-colors" />
            </div>
          ))}
        </SectionCard>

        {/* Site Visits */}
        <SectionCard
          title="Site Visits"
          count={mockSiteSummary.siteVisits.length}
          icon={<CalendarDays size={16} className="text-amber-600" />}
          onAdd={() => {}}
        >
          {mockSiteSummary.siteVisits.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/sites/${siteId}/visits/${v.id}`)}
              className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/8 flex items-center justify-center">
                  <CalendarDays size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{v.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-std-gray-lm">{v.date}</span>
                    <span className="text-std-gray-dm">·</span>
                    <span className="text-xs text-std-gray-lm">{v.type}</span>
                    <span className="text-std-gray-dm">·</span>
                    <span className="text-xs text-std-gray-lm">{v.surveyCount} surveys</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('badge border text-xs', statusColors[v.status] ?? statusColors['Not Started'])}>
                  {v.status}
                </span>
                <ChevronRight size={16} className="text-nav-gray group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Reports */}
        <SectionCard
          title="Reports"
          count={mockSiteSummary.reports.length}
          icon={<FileText size={16} className="text-red-600" />}
        >
          {mockSiteSummary.reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-red-600/30 hover:bg-red-600/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600/8 flex items-center justify-center">
                  <FileText size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{r.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-std-gray-lm">{r.date}</span>
                    <span className="text-std-gray-dm">·</span>
                    <span className="text-xs text-std-gray-lm">{r.version}</span>
                  </div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 transition-colors opacity-0 group-hover:opacity-100">
                <Download size={15} />
              </button>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({
  title, count, icon, children, onAdd
}: {
  title: string
  count: number
  icon: React.ReactNode
  children: React.ReactNode
  onAdd?: () => void
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold text-black">
            {title}
            <span className="ml-2 text-sm font-normal text-std-gray-lm">({count})</span>
          </h2>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="btn-secondary text-xs px-2.5 py-1.5">+ Add</button>
        )}
      </div>
      <div className="space-y-2">
        {count === 0
          ? <p className="text-sm text-std-gray-lm text-center py-4">No {title.toLowerCase()} yet</p>
          : children}
      </div>
    </div>
  )
}
