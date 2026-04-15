import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, Building2, Package, LayoutGrid, KeyRound,
  FileImage, Plus, Share2, Edit2,
} from 'lucide-react'
import { mockCompoundSummary } from '../data/mockData'
import clsx from 'clsx'

const c = mockCompoundSummary

const statCards = [
  { label: 'Bphocs',            value: c.bphocs.length,          icon: Package,     iconColor: 'text-teal-400',   bg: 'bg-teal-400/8',   valColor: 'text-teal-900' },
  { label: 'Compound General',  value: c.compoundGenerals.length, icon: LayoutGrid,  iconColor: 'text-indigo-500', bg: 'bg-indigo-500/8', valColor: 'text-indigo-500' },
  { label: 'Compound Access',   value: c.compoundAccess.length,   icon: KeyRound,    iconColor: 'text-amber-600',  bg: 'bg-amber-500/8',  valColor: 'text-amber-600' },
]

const detailGroups = [
  { group: 'General', fields: [
    { label: 'Internal ID',    value: c.internalId },
    { label: 'Elevation (ft)', value: c.elevation },
    { label: 'Available Area', value: c.availableArea },
    { label: 'Polygon',        value: c.polygon },
  ]},
  { group: 'Utilities', fields: [
    { label: 'Power Provider',    value: c.powerProvider },
    { label: 'Fiber Provider',    value: c.fiberProvider },
    { label: 'Lightning Provider',value: c.lightningProvider },
    { label: 'Generator Present', value: c.generatorPresent },
    { label: 'Fuel Tank Present', value: c.fuelTankPresent },
  ]},
  { group: 'Access & Security', fields: [
    { label: 'Fence Type',           value: c.fenceType },
    { label: 'Fence Height',         value: c.fenceHeight },
    { label: 'Compound Gate Present',value: c.compoundGatePresent },
  ]},
  { group: 'Location', fields: [
    { label: 'Compound Corner 1', value: c.compoundCorner1 },
    { label: 'Compound Corner 2', value: c.compoundCorner2 },
  ]},
]

const photoList = [
  { label: 'Plan View',             file: c.photos.planView },
  { label: 'Compound Corner Photo 1', file: c.photos.cornerPhoto1 },
  { label: 'Compound Corner Photo 2', file: c.photos.cornerPhoto2 },
]

function PhotoTile({ label, file }: { label: string; file: string | null }) {
  return (
    <div className="rounded-xl overflow-hidden border border-nav-gray cursor-pointer group">
      <div className={clsx(
        'h-28 flex items-center justify-center transition-colors',
        file ? 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:opacity-90' : 'bg-bg-gray-lm hover:bg-hover-gray-lm text-nav-gray'
      )}>
        {file
          ? <FileImage size={28} className="text-indigo-400/60" />
          : <Plus size={22} />}
      </div>
      <div className="px-3 py-2 bg-white border-t border-nav-gray/50">
        <p className="text-xs text-std-gray-lm font-medium truncate">{label}</p>
        {file && <p className="text-[10px] text-indigo-400 truncate mt-0.5">{file}</p>}
      </div>
    </div>
  )
}

function RelatedList<T extends { id: string; name: string; created: string }>({
  title, count, icon, items, hoverClass,
}: {
  title: string
  count: number
  icon: React.ReactNode
  items: T[]
  hoverClass: string
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
        <button className="btn-secondary text-xs px-2.5 py-1.5">+ Add</button>
      </div>
      <div className="space-y-2">
        {items.length === 0
          ? <p className="text-sm text-std-gray-lm text-center py-4">No {title.toLowerCase()} yet</p>
          : items.map(item => (
            <div key={item.id} className={clsx(
              'flex items-center justify-between p-3 rounded-lg border border-nav-gray transition-colors cursor-pointer group',
              hoverClass
            )}>
              <div>
                <p className="text-sm font-semibold text-black">{item.name}</p>
                <p className="text-xs text-std-gray-lm mt-0.5">{item.created}</p>
              </div>
              <ChevronRight size={15} className="text-nav-gray group-hover:text-current transition-colors" />
            </div>
          ))}
      </div>
    </div>
  )
}

export default function CompoundSummaryPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-std-gray-lm flex-wrap">
        <button onClick={() => navigate('/sites')} className="hover:text-black transition-colors">Sites</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate(`/sites/${siteId}`)} className="hover:text-black transition-colors">{c.siteName}</button>
        <ChevronRight size={14} />
        <span className="text-indigo-500 font-medium">{c.name}</span>
      </nav>

      {/* Hero card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Building2 size={20} className="text-indigo-500" />
              <h1 className="text-2xl font-bold text-indigo-900">{c.name}</h1>
            </div>
            <p className="text-sm text-std-gray-lm mt-0.5">
              Site: <span className="font-medium text-black">{c.siteName}</span>
              <span className="mx-2 text-nav-gray">·</span>
              <span className="text-xs text-std-gray-dm">Created {c.createdAt}</span>
              <span className="mx-2 text-nav-gray">·</span>
              <span className="text-xs text-std-gray-dm">Edited {c.editedAt}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn-secondary text-xs px-3 py-1.5"><Share2 size={13} /> Share</button>
            <button className="btn-primary text-xs px-3 py-1.5"><Edit2 size={13} /> Edit</button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 max-w-sm">
          {statCards.map(({ label, value, icon: Icon, iconColor, bg, valColor }) => (
            <div key={label} className={clsx('rounded-xl p-3 flex flex-col items-center gap-2', bg)}>
              <Icon size={20} className={iconColor} />
              <span className={clsx('text-2xl font-bold', valColor)}>{value}</span>
              <span className="text-xs text-std-gray-lm text-center font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Details card */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-black mb-4">Compound Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {detailGroups.map(({ group, fields }) => (
            <div key={group} className="rounded-lg border border-nav-gray p-4">
              <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-3">{group}</h3>
              <div className="space-y-3">
                {fields.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-std-gray-lm">{label}</p>
                    <p className="text-sm text-black font-medium mt-0.5">
                      {value ?? <span className="text-std-gray-dm italic font-normal">—</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photos card */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-black mb-4">Photos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {photoList.map(p => <PhotoTile key={p.label} label={p.label} file={p.file} />)}
        </div>
      </div>

      {/* Related records — 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelatedList
          title="Bphocs" count={c.bphocs.length} items={c.bphocs}
          icon={<Package size={16} className="text-teal-400" />}
          hoverClass="hover:border-teal-400/40 hover:bg-teal-400/5"
        />
        <RelatedList
          title="Compound General" count={c.compoundGenerals.length} items={c.compoundGenerals}
          icon={<LayoutGrid size={16} className="text-indigo-500" />}
          hoverClass="hover:border-indigo-500/40 hover:bg-indigo-500/5"
        />
        <RelatedList
          title="Compound Access" count={c.compoundAccess.length} items={c.compoundAccess}
          icon={<KeyRound size={16} className="text-amber-600" />}
          hoverClass="hover:border-amber-500/40 hover:bg-amber-500/5"
        />
      </div>
    </div>
  )
}
