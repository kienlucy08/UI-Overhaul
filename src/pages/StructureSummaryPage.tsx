import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, TowerControl, Building2, Activity,
  Radio, Layers, Box, FileImage, Plus, MapPin, ExternalLink,
  Link2, Share2, Edit2,
} from 'lucide-react'
import { mockStructureSummary } from '../data/mockData'
import clsx from 'clsx'

const s = mockStructureSummary

const statCards = [
  { label: 'Guy Attachments',  value: s.guyAttachments.length,    icon: Link2,     iconColor: 'text-teal-400',    bg: 'bg-teal-400/8',    valColor: 'text-teal-900' },
  { label: 'Guy Compounds',    value: s.guyAnchorCompounds.length, icon: Building2, iconColor: 'text-indigo-500',  bg: 'bg-indigo-500/8',  valColor: 'text-indigo-500' },
  { label: 'Appurtenances',    value: s.appurtenances.length,      icon: Radio,     iconColor: 'text-amber-600',   bg: 'bg-amber-500/8',   valColor: 'text-amber-600' },
  { label: 'Plumb & Twist',    value: s.plumbTwistGroups.length,   icon: Activity,  iconColor: 'text-green-600',   bg: 'bg-green-600/8',   valColor: 'text-green-600' },
  { label: 'Structure Bases',  value: s.structureBases.length,     icon: Box,       iconColor: 'text-orange-500',  bg: 'bg-orange-500/8',  valColor: 'text-orange-500' },
  { label: 'Sections',         value: s.sections.length,           icon: Layers,    iconColor: 'text-std-gray-lm', bg: 'bg-bg-gray-lm',    valColor: 'text-black' },
]

const detailGroups = [
  { group: 'Identity', fields: [
    { label: 'Type',              value: s.type },
    { label: 'Owner',             value: s.owner },
    { label: 'FCC ASR Number',    value: s.fccAsrNumber },
    { label: 'Owner Structure ID',value: s.ownerStructureId },
  ]},
  { group: 'Dimensions', fields: [
    { label: 'Constructed Height (ft)', value: s.constructedHeight },
    { label: 'Apex Height (ft)',         value: s.apexHeight },
    { label: 'Base Face Width (ft)',     value: s.baseFaceWidth },
    { label: 'Top Face Width (ft)',      value: s.topFaceWidth },
    { label: 'Elevation (ft)',           value: s.elevation },
  ]},
  { group: 'Configuration', fields: [
    { label: 'Leg Count',          value: s.legCount },
    { label: 'Section Count',      value: s.sectionCount },
    { label: 'Leg A Azimuth',      value: s.legAAzimuth },
    { label: 'Taper Count',        value: s.taperCount },
    { label: 'Guy Level Count',    value: s.guyLevelCount },
    { label: 'Guy Compounds Count',value: s.guyCompoundsCount },
  ]},
  { group: 'Features', fields: [
    { label: 'Safety Climb Present',    value: s.safetyClimbPresent },
    { label: 'Top Flash Head Present',  value: s.topFlashHeadPresent },
    { label: 'Lighting Present',        value: s.lightingPresent },
  ]},
  { group: 'Appurtenances', fields: [
    { label: 'Highest Appurtenance',    value: s.highestAppurtenanceName },
    { label: 'Appurtenance Description',value: s.highestAppurtenanceDescription },
  ]},
  { group: 'Manufacturer', fields: [
    { label: 'Manufacturer Name',   value: s.manufacturerName },
    { label: 'Manufacturer Job Num',value: s.manufacturerJobNum },
  ]},
  { group: 'Location', fields: [
    { label: 'Coordinates', value: s.coordinates },
  ]},
]

const photoGroups = [
  {
    label: 'Horizon Photos',
    photos: [
      { label: 'North', file: s.photos.horizonNorth },
      { label: 'East',  file: s.photos.horizonEast },
      { label: 'South', file: s.photos.horizonSouth },
      { label: 'West',  file: s.photos.horizonWest },
    ],
  },
  {
    label: 'Beacon & Distance',
    photos: [
      { label: 'Distance From Top', file: s.photos.distanceFromTop },
      { label: 'Top Flash Head',    file: s.photos.topFlashHead },
    ],
  },
  {
    label: 'Profile Photos',
    photos: [
      { label: 'Leg A Profile',  file: s.photos.legAProfile },
      { label: 'Leg B Profile',  file: s.photos.legBProfile },
      { label: 'Leg C Profile',  file: s.photos.legCProfile },
      { label: 'Leg D Profile',  file: s.photos.legDProfile },
      { label: 'Monopole Interior', file: s.photos.monopoleInterior },
      { label: 'Mount From Ground', file: s.photos.mountFromGround },
    ],
  },
  {
    label: 'Reference',
    photos: [
      { label: 'Manufacturer Plate', file: s.photos.manufacturerPlate },
      { label: 'Coax Map',           file: s.photos.coaxMap },
    ],
  },
]

function PhotoTile({ label, file }: { label: string; file: string | null }) {
  return (
    <div className="rounded-xl overflow-hidden border border-nav-gray cursor-pointer group">
      <div className={clsx(
        'h-28 flex items-center justify-center transition-colors',
        file ? 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:opacity-90' : 'bg-bg-gray-lm hover:bg-hover-gray-lm text-nav-gray'
      )}>
        {file
          ? <FileImage size={28} className="text-teal-400/60" />
          : <Plus size={22} />}
      </div>
      <div className="px-3 py-2 bg-white border-t border-nav-gray/50">
        <p className="text-xs text-std-gray-lm font-medium truncate">{label}</p>
        {file && <p className="text-[10px] text-teal-400 truncate mt-0.5">{file}</p>}
      </div>
    </div>
  )
}

function RelatedList<T extends { id: string; name: string; created: string }>({
  title, count, icon, items, iconColor, accentColor,
}: {
  title: string
  count: number
  icon: React.ReactNode
  items: T[]
  iconColor: string
  accentColor: string
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
              accentColor
            )}>
              <div>
                <p className="text-sm font-semibold text-black">{item.name}</p>
                <p className="text-xs text-std-gray-lm mt-0.5">{item.created}</p>
              </div>
              <ChevronRight size={15} className={clsx('text-nav-gray transition-colors', iconColor.replace('text-', 'group-hover:text-'))} />
            </div>
          ))}
      </div>
    </div>
  )
}

export default function StructureSummaryPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-std-gray-lm flex-wrap">
        <button onClick={() => navigate('/sites')} className="hover:text-black transition-colors">Sites</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate(`/sites/${siteId}`)} className="hover:text-black transition-colors">{s.siteName}</button>
        <ChevronRight size={14} />
        <span className="text-teal-400 font-medium">{s.name}</span>
      </nav>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <TowerControl size={20} className="text-teal-400" />
                  <h1 className="text-2xl font-bold text-teal-900">{s.name}</h1>
                  <span className="badge bg-teal-400/10 text-teal-600 border border-teal-400/30 text-xs">{s.type}</span>
                </div>
                <p className="text-sm text-std-gray-lm mt-0.5">
                  Owner: <span className="font-medium text-black">{s.owner}</span>
                  <span className="mx-2 text-nav-gray">·</span>
                  Height: <span className="font-medium text-black">{s.constructedHeight} ft</span>
                  <span className="mx-2 text-nav-gray">·</span>
                  <span className="text-xs text-std-gray-dm">Created {s.createdAt}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="btn-secondary text-xs px-3 py-1.5"><Share2 size={13} /> Share</button>
                <button className="btn-primary text-xs px-3 py-1.5"><Edit2 size={13} /> Edit</button>
              </div>
            </div>
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
          {/* Map placeholder */}
          <div className="lg:w-64 h-48 lg:h-auto bg-teal-100/40 flex-shrink-0 flex items-center justify-center">
            <div className="text-center text-teal-700">
              <MapPin size={32} className="mx-auto mb-2 text-red-600 drop-shadow" />
              <p className="text-xs font-medium">{s.coordinates}</p>
              <button className="mt-2 text-xs text-blue-400 font-medium flex items-center gap-1 mx-auto hover:underline">
                <ExternalLink size={12} /> Open in Maps
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details card */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-black mb-4">Structure Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {detailGroups.map(({ group, fields }) => (
            <div key={group} className="rounded-lg border border-nav-gray p-4">
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3">{group}</h3>
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
        <h2 className="text-base font-semibold text-black mb-5">Photos</h2>
        <div className="space-y-6">
          {photoGroups.map(({ label, photos }) => (
            <div key={label}>
              <p className="text-xs font-bold text-std-gray-lm uppercase tracking-widest mb-3">{label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {photos.map(p => <PhotoTile key={p.label} label={p.label} file={p.file} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related records — 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelatedList
          title="Appurtenances" count={s.appurtenances.length} items={s.appurtenances}
          icon={<Radio size={16} className="text-amber-600" />}
          iconColor="text-amber-600" accentColor="hover:border-amber-500/40 hover:bg-amber-500/5"
        />
        <RelatedList
          title="Guy Attachments" count={s.guyAttachments.length} items={s.guyAttachments}
          icon={<Link2 size={16} className="text-teal-400" />}
          iconColor="text-teal-400" accentColor="hover:border-teal-400/40 hover:bg-teal-400/5"
        />
        <RelatedList
          title="Guy Anchor Compounds" count={s.guyAnchorCompounds.length} items={s.guyAnchorCompounds}
          icon={<Building2 size={16} className="text-indigo-500" />}
          iconColor="text-indigo-500" accentColor="hover:border-indigo-500/40 hover:bg-indigo-500/5"
        />
        <RelatedList
          title="Plumb & Twist Groups" count={s.plumbTwistGroups.length} items={s.plumbTwistGroups}
          icon={<Activity size={16} className="text-green-600" />}
          iconColor="text-green-600" accentColor="hover:border-green-600/30 hover:bg-green-600/5"
        />
        <RelatedList
          title="Structure Bases" count={s.structureBases.length} items={s.structureBases}
          icon={<Box size={16} className="text-orange-500" />}
          iconColor="text-orange-500" accentColor="hover:border-orange-500/40 hover:bg-orange-500/5"
        />
        <RelatedList
          title="Sections" count={s.sections.length} items={s.sections}
          icon={<Layers size={16} className="text-std-gray-lm" />}
          iconColor="text-std-gray-lm" accentColor="hover:border-nav-gray hover:bg-hover-gray-lm"
        />
      </div>
    </div>
  )
}
