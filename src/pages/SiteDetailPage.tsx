import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MapPin, ChevronRight, ExternalLink, Edit2, Copy, Check,
  Building2, CalendarDays, Shield, TowerControl, Plus, Download,
  FileText, ScanLine, Share2, Paperclip
} from 'lucide-react'
import { mockSite, mockSiteSummary } from '../data/mockData'
import clsx from 'clsx'

const siteFields = [
  { group: 'Identity', fields: [
    { label: 'Site Name',    key: 'name' },
    { label: 'Site ID',      key: 'id' },
    { label: 'Internal ID',  key: 'internalId' },
    { label: 'CUID',         key: 'cuidId', mono: true },
  ]},
  { group: 'Location', fields: [
    { label: 'Address',   key: 'address' },
    { label: 'Country',   key: 'country' },
    { label: 'Elevation', key: 'elevation' },
  ]},
  { group: 'Ownership', fields: [
    { label: 'Owner',        key: 'owner' },
    { label: 'Owner Site ID',key: 'ownerSiteId' },
  ]},
  { group: 'Land & Access', fields: [
    { label: 'Lease Land Type',       key: 'leaseLandType' },
    { label: 'Dedicated Access Road', key: 'dedicatedAccessRoad' },
    { label: 'Functional Night Mode', key: 'functionalNightMode' },
  ]},
  { group: 'Emergency', fields: [
    { label: 'Nearest Hospital', key: 'nearestHospital' },
  ]},
]

const statCards = [
  { label: 'Structures',  value: mockSiteSummary.structureCount,       icon: TowerControl,  iconColor: 'text-teal-400',    bg: 'bg-teal-400/8',   valColor: 'text-teal-900' },
  { label: 'Compounds',   value: mockSiteSummary.compoundCount,        icon: Building2,     iconColor: 'text-indigo-500',  bg: 'bg-indigo-500/8', valColor: 'text-indigo-500' },
  { label: 'Site Visits', value: mockSiteSummary.siteVisitCount,       icon: CalendarDays,  iconColor: 'text-amber-600',   bg: 'bg-amber-500/8',  valColor: 'text-amber-600' },
  { label: 'Scans',       value: mockSiteSummary.scanCount,            icon: ScanLine,      iconColor: 'text-teal-300',    bg: 'bg-teal-300/8',   valColor: 'text-teal-300' },
  { label: 'Attachments', value: mockSiteSummary.attachments.length,   icon: Paperclip,     iconColor: 'text-std-gray-lm', bg: 'bg-bg-gray-lm',   valColor: 'text-black' },
  { label: 'Reports',     value: mockSiteSummary.reportCount,          icon: FileText,      iconColor: 'text-red-600',     bg: 'bg-red-600/8',    valColor: 'text-red-600' },
]

export default function SiteDetailPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'photos'>('details')
  const site = mockSite

  function copyToClipboard(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-std-gray-lm">
        <button onClick={() => navigate('/sites')} className="hover:text-black transition-colors">Sites</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">{site.name}</span>
      </nav>

      {/* Hero card — map on right, stats on left (matches SiteSummary style) */}
      <div className="card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-teal-900">{site.name}</h1>
                <div className="flex items-center gap-1.5 mt-1.5 text-std-gray-lm">
                  <MapPin size={14} className="text-teal-400" />
                  <span className="text-sm">
                    {site.coordinates.lat.toFixed(6)}, {site.coordinates.lng.toFixed(6)}
                  </span>
                  <span className="text-nav-gray mx-1">·</span>
                  <span className="text-sm font-mono">{site.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-xs px-3 py-1.5">
                  <Share2 size={13} /> Share
                </button>
                <button className="btn-primary text-xs px-3 py-1.5">
                  <Edit2 size={13} /> Edit Site
                </button>
              </div>
            </div>

            {/* Stat counters */}
            <div className="grid grid-cols-6 gap-3">
              {statCards.map(({ label, value, icon: Icon, iconColor, bg, valColor }) => (
                <div key={label} className={clsx('rounded-xl p-3 flex flex-col items-center gap-2', bg)}>
                  <Icon size={20} className={iconColor} />
                  <span className={clsx('text-2xl font-bold', valColor)}>{value}</span>
                  <span className="text-xs text-std-gray-lm text-center font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map thumbnail */}
          <div className="lg:w-64 h-48 lg:h-auto bg-teal-100/40 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
            <div className="text-center text-teal-700">
              <MapPin size={32} className="mx-auto mb-2 text-red-600 drop-shadow" />
              <p className="text-xs font-medium">
                {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
              </p>
              <button className="mt-2 text-xs text-blue-400 font-medium flex items-center gap-1 mx-auto hover:underline">
                <ExternalLink size={12} /> Open in Maps
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-4 border-t border-nav-gray">
          {(['details', 'photos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors',
                activeTab === tab
                  ? 'border-teal-300 text-teal-400'
                  : 'border-transparent text-std-gray-lm hover:text-black'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {activeTab === 'details' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteFields.map(({ group, fields }) => (
              <div key={group} className="rounded-lg border border-nav-gray p-4">
                <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3">{group}</h3>
                <div className="space-y-3">
                  {fields.map(({ label, key, mono }) => {
                    const value = (site as Record<string, unknown>)[key] as string | undefined
                    return (
                      <div key={key} className="group/field flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-std-gray-lm mb-0.5">{label}</p>
                          <p className={clsx(
                            'text-sm text-black font-medium break-words',
                            mono && 'font-mono text-xs text-std-gray-lm'
                          )}>
                            {value ?? <span className="text-std-gray-dm italic">—</span>}
                          </p>
                        </div>
                        {value && (
                          <button
                            onClick={() => copyToClipboard(value, key)}
                            className="p-1 rounded text-nav-gray hover:text-std-gray-lm hover:bg-hover-gray-lm opacity-0 group-hover/field:opacity-100 transition-all flex-shrink-0 mt-4"
                          >
                            {copiedKey === key
                              ? <Check size={13} className="text-green-600" />
                              : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {['Glamour Photo', 'Site ID Sign', 'Owner Power Assembly', 'Owner Power Meter', 'Owner D.C. Breaker', 'Owner Lighting Control'].map((label) => (
                <div key={label} className="rounded-xl overflow-hidden border border-nav-gray group cursor-pointer">
                  <div className="h-28 bg-bg-gray-lm flex items-center justify-center text-nav-gray hover:bg-hover-gray-lm transition-colors">
                    <Plus size={24} />
                  </div>
                  <div className="px-3 py-2 bg-white">
                    <p className="text-xs text-std-gray-lm font-medium truncate">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Structures */}
        <SectionCard title="Structures" count={site.structures.length} icon={<TowerControl size={16} className="text-teal-400" />} onAdd={() => {}}>
          {site.structures.map((s) => (
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-std-gray-lm">{s.created}</span>
                <ChevronRight size={16} className="text-nav-gray group-hover:text-teal-400 transition-colors" />
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Compounds */}
        <SectionCard title="Compounds" count={site.compounds.length} icon={<Building2 size={16} className="text-indigo-500" />} onAdd={() => {}}>
          {site.compounds.map((c) => (
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-std-gray-lm">{c.created}</span>
                <ChevronRight size={16} className="text-nav-gray group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Site Visits */}
        <SectionCard title="Site Visits" count={site.siteVisits.length} icon={<CalendarDays size={16} className="text-amber-600" />} onAdd={() => {}}>
          {site.siteVisits.map((v) => (
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
                    <span className="text-xs text-std-gray-lm">{v.created}</span>
                    <span className="text-std-gray-dm">·</span>
                    <span className="text-xs text-std-gray-lm">{v.type}</span>
                    <span className="text-std-gray-dm">·</span>
                    <span className="text-xs text-std-gray-lm">{v.surveyCount} surveys</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-nav-gray group-hover:text-amber-500 transition-colors" />
            </div>
          ))}
        </SectionCard>

        {/* Site Access */}
        <SectionCard title="Site Access" count={site.siteAccess.length} icon={<Shield size={16} className="text-teal-600" />} onAdd={() => {}}>
          {(site.siteAccess as { id: string; primary: string; secondary: string; meta: string }[]).map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-teal-600/30 hover:bg-teal-600/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600/8 flex items-center justify-center">
                  <Shield size={15} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{a.primary}</p>
                  {a.secondary && <p className="text-xs text-std-gray-lm">{a.secondary}</p>}
                </div>
              </div>
              <ChevronRight size={16} className="text-nav-gray group-hover:text-teal-600 transition-colors" />
            </div>
          ))}
        </SectionCard>

        {/* Reports */}
        <SectionCard title="Reports" count={site.reports.length} icon={<FileText size={16} className="text-red-600" />}>
          {site.reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-red-600/30 hover:bg-red-600/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600/8 flex items-center justify-center">
                  <FileText size={15} className="text-red-600" />
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
  children?: React.ReactNode
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
