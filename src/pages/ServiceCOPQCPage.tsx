import { useState, useRef, useCallback, useEffect, createContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Flag, X, Plus, Minus,
  ChevronDown, ChevronRight, ChevronLeft, Check,
  Search, CheckCheck, Loader2, AlertTriangle, Sparkles,
  Camera, FileImage,
} from 'lucide-react'
import clsx from 'clsx'

// ─── AI flag types ──────────────────────────────────────────────────────────────
type AIFlagSeverity = 'error' | 'warning' | 'suggestion'
type AIFlagEntry = { issue: string; severity: AIFlagSeverity }
const AIFlagsContext = createContext<Record<string, AIFlagEntry>>({})

// ─── Types ─────────────────────────────────────────────────────────────────────
type YesNo   = 'Yes' | 'No' | ''
type SectionId = 'overview' | 'gamma' | 'catch_all'

type PhotoSlot = { id: string; filename: string | null; flagged: boolean; marked: boolean }

type PhotoGroup = {
  id: string
  label: string
  slots: PhotoSlot[]
  required?: boolean
}

type RRUUnit = {
  id: string
  existingSerial: string
  existingSerialFlagged: boolean
  existingSerialMarked: boolean
  newSerial: string
  newSerialFlagged: boolean
  newSerialMarked: boolean
  photoGroups: PhotoGroup[]
}

type CatchAllItem = { id: string; description: string; flagged: boolean; marked: boolean }

type COPSurvey = {
  id: string; name: string; siteId: string; siteName: string
  technician: string; technicianEmail: string; customer: string; coordinates: string
  // Overview — site info fields
  eusAppointmentNumber: string; eusMarked: boolean; eusFlagged: boolean
  enbName: string; enbMarked: boolean; enbFlagged: boolean
  craneUsed: YesNo; craneMarked: boolean; craneFlagged: boolean
  ticketType: string; ticketMarked: boolean; ticketFlagged: boolean
  sectorsWorkedOn: string[]; sectorsMarked: boolean; sectorsFlagged: boolean
  workCompleted: YesNo; workMarked: boolean; workFlagged: boolean
  returnVisitNeeded: YesNo; returnVisitMarked: boolean; returnVisitFlagged: boolean
  resolutionType: string; resolutionMarked: boolean; resolutionFlagged: boolean
  glamourPhoto: PhotoSlot
  // Overview — site & log book photos
  sitePhotoGroups: PhotoGroup[]
  // Gamma sector
  gammaOverallViews: PhotoGroup[]
  gammaRRUs: RRUUnit[]
  // Catch all
  catchAll: CatchAllItem[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const TICKET_TYPES     = ['DB', 'TE', 'HW', 'SW', 'PM']
const SECTORS          = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
const RESOLUTION_TYPES = ['Hardware', 'Software', 'Configuration', 'Structural', 'Other']
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'overview',  label: 'Service COP Overview' },
  { id: 'gamma',     label: 'Gamma Sector'          },
  { id: 'catch_all', label: 'Catch All'             },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeSlot(id: string, filename: string | null = null): PhotoSlot {
  return { id, filename, flagged: false, marked: !!filename }
}
function makeGroup(id: string, label: string, count = 2, required = false): PhotoGroup {
  return { id, label, required, slots: Array.from({ length: count }, (_, i) => makeSlot(`${id}_s${i}`)) }
}
function makeRRU(id: string, existingSerial: string, newSerial: string, hasPhotos = false): RRUUnit {
  const pg = (gid: string, label: string) => makeGroup(`${id}_${gid}`, label, hasPhotos ? 2 : 1)
  return {
    id,
    existingSerial, existingSerialFlagged: false, existingSerialMarked: !!existingSerial,
    newSerial, newSerialFlagged: false, newSerialMarked: !!newSerial,
    photoGroups: [
      pg('ph_ex_serial',   'Existing RRU Serial Number'),
      pg('ph_new_serial',  'New RRU Serial Number'),
      pg('ph_ex_ground',   'Existing Grounding Photo'),
      pg('ph_new_ground',  'New Grounding Photo'),
      pg('ph_termination', 'New RRU Terminations & Weatherproofing'),
      pg('ph_antenna',     'New RRU Antenna Terminations'),
    ],
  }
}

function getPhotoGroupProgress(pg: PhotoGroup) {
  const filled = pg.slots.filter(s => s.filename !== null)
  return { filled: filled.length, total: pg.slots.length, marked: filled.filter(s => s.marked).length }
}

function getRRUProgress(rru: RRUUnit) {
  const fields  = [rru.existingSerialMarked, rru.newSerialMarked]
  let marked = fields.filter(Boolean).length
  let total  = fields.length
  rru.photoGroups.forEach(pg => {
    pg.slots.filter(s => s.filename).forEach(s => { total++; if (s.marked) marked++ })
  })
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getRRUFlagCount(rru: RRUUnit) {
  return (rru.existingSerialFlagged ? 1 : 0) + (rru.newSerialFlagged ? 1 : 0) +
    rru.photoGroups.flatMap(pg => pg.slots).filter(s => s.flagged).length
}

function getSectionProgress(id: SectionId, s: COPSurvey) {
  if (id === 'overview') {
    const fields = [
      s.eusMarked, s.enbMarked, s.craneMarked, s.ticketMarked,
      s.sectorsMarked, s.workMarked, s.returnVisitMarked, s.resolutionMarked,
    ]
    let marked = fields.filter(Boolean).length, total = fields.length
    // glamour photo
    if (s.glamourPhoto.filename) { total++; if (s.glamourPhoto.marked) marked++ }
    s.sitePhotoGroups.forEach(pg => pg.slots.filter(sl => sl.filename).forEach(sl => { total++; if (sl.marked) marked++ }))
    return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
  }
  if (id === 'gamma') {
    let marked = 0, total = 0
    s.gammaOverallViews.forEach(pg => pg.slots.filter(sl => sl.filename).forEach(sl => { total++; if (sl.marked) marked++ }))
    s.gammaRRUs.forEach(rru => { const p = getRRUProgress(rru); marked += p.marked; total += p.total })
    return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
  }
  const total = s.catchAll.length, marked = s.catchAll.filter(c => c.marked).length
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getSectionFlagCount(id: SectionId, s: COPSurvey) {
  if (id === 'overview') {
    return [s.eusFlagged, s.enbFlagged, s.craneFlagged, s.ticketFlagged, s.sectorsFlagged, s.workFlagged, s.returnVisitFlagged, s.resolutionFlagged, s.glamourPhoto.flagged].filter(Boolean).length +
      s.sitePhotoGroups.flatMap(pg => pg.slots).filter(s => s.flagged).length
  }
  if (id === 'gamma') {
    return s.gammaOverallViews.flatMap(pg => pg.slots).filter(s => s.flagged).length +
      s.gammaRRUs.reduce((a, r) => a + getRRUFlagCount(r), 0)
  }
  return s.catchAll.filter(c => c.flagged).length
}

function getOverallProgress(s: COPSurvey) {
  const sections = SECTIONS.map(sec => getSectionProgress(sec.id, s))
  const marked = sections.reduce((a, p) => a + p.marked, 0)
  const total  = sections.reduce((a, p) => a + p.total,  0)
  const flagCount = SECTIONS.reduce((a, sec) => a + getSectionFlagCount(sec.id, s), 0)
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0, flagCount }
}

// ─── Sub-section helpers ────────────────────────────────────────────────────────
const OVERVIEW_SUBS = [
  { id: 'site_info',   label: 'Site Info'                 },
  { id: 'glamour',     label: 'Glamour Photo'             },
  { id: 'site_photos', label: 'Site & Log Book Photos'    },
]

function getSubLabel(sectionId: SectionId, sub: string | null, s: COPSurvey): string {
  if (sectionId === 'overview') {
    return OVERVIEW_SUBS.find(x => x.id === sub)?.label ?? 'Overview'
  }
  if (sectionId === 'gamma') {
    if (sub === 'overall_views') return 'Overall Views'
    const rru = s.gammaRRUs.find(r => r.id === sub)
    if (rru) return `RRU — ${rru.newSerial || rru.existingSerial || rru.id}`
  }
  return SECTIONS.find(sec => sec.id === sectionId)?.label ?? ''
}

function getSubProgress(sectionId: SectionId, sub: string | null, s: COPSurvey) {
  if (sectionId === 'overview') {
    if (sub === 'site_info') {
      const fields = [s.eusMarked, s.enbMarked, s.craneMarked, s.ticketMarked, s.sectorsMarked, s.workMarked, s.returnVisitMarked, s.resolutionMarked]
      const marked = fields.filter(Boolean).length
      return { marked, total: fields.length, pct: Math.round((marked / fields.length) * 100) }
    }
    if (sub === 'glamour') {
      const has = !!s.glamourPhoto.filename
      return { marked: has && s.glamourPhoto.marked ? 1 : 0, total: has ? 1 : 0, pct: has && s.glamourPhoto.marked ? 100 : 0 }
    }
    if (sub === 'site_photos') {
      let marked = 0, total = 0
      s.sitePhotoGroups.forEach(pg => pg.slots.filter(sl => sl.filename).forEach(sl => { total++; if (sl.marked) marked++ }))
      return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
    }
  }
  if (sectionId === 'gamma') {
    if (sub === 'overall_views') {
      let marked = 0, total = 0
      s.gammaOverallViews.forEach(pg => pg.slots.filter(sl => sl.filename).forEach(sl => { total++; if (sl.marked) marked++ }))
      return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
    }
    const rru = s.gammaRRUs.find(r => r.id === sub)
    if (rru) { const p = getRRUProgress(rru); return { marked: p.marked, total: p.total, pct: p.pct } }
  }
  const total = s.catchAll.length, marked = s.catchAll.filter(c => c.marked).length
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getSubFlagCount(sectionId: SectionId, sub: string | null, s: COPSurvey) {
  if (sectionId === 'overview') {
    if (sub === 'site_info')   return [s.eusFlagged, s.enbFlagged, s.craneFlagged, s.ticketFlagged, s.sectorsFlagged, s.workFlagged, s.returnVisitFlagged, s.resolutionFlagged].filter(Boolean).length
    if (sub === 'glamour')     return s.glamourPhoto.flagged ? 1 : 0
    if (sub === 'site_photos') return s.sitePhotoGroups.flatMap(pg => pg.slots).filter(sl => sl.flagged).length
  }
  if (sectionId === 'gamma') {
    if (sub === 'overall_views') return s.gammaOverallViews.flatMap(pg => pg.slots).filter(sl => sl.flagged).length
    const rru = s.gammaRRUs.find(r => r.id === sub)
    if (rru) return getRRUFlagCount(rru)
  }
  return s.catchAll.filter(c => c.flagged).length
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const initialSurvey: COPSurvey = {
  id: 'survey_cop', name: 'Service COP', siteId: 'SA-1547144', siteName: 'OMA KOA 1977766',
  technician: 'Colton Davis', technicianEmail: 'coltond@murphytower.com',
  customer: 'Ericsson', coordinates: '41.093911191, -96.264883786',
  eusAppointmentNumber: 'SA-1547144', eusMarked: true,  eusFlagged: false,
  enbName: 'OMA KOA 1977766',         enbMarked: true,  enbFlagged: false,
  craneUsed: 'No',        craneMarked: false,  craneFlagged: true,
  ticketType: 'DB',       ticketMarked: true,  ticketFlagged: false,
  sectorsWorkedOn: ['Gamma'], sectorsMarked: true, sectorsFlagged: false,
  workCompleted: 'Yes',   workMarked: false,   workFlagged: false,
  returnVisitNeeded: 'No', returnVisitMarked: true, returnVisitFlagged: true,
  resolutionType: 'Hardware', resolutionMarked: true, resolutionFlagged: false,
  glamourPhoto: makeSlot('glamour_01', 'glamour_01.jpg'),
  sitePhotoGroups: [
    { ...makeGroup('pg_logbook',   'Log Book Entry Photo',           2), slots: [makeSlot('lg_s0', 'logbook_01.jpg'), makeSlot('lg_s1')] },
    { ...makeGroup('pg_signage',   'Site Signage',                   2), slots: [makeSlot('sg_s0', 'signage_01.jpg'),  makeSlot('sg_s1')] },
    { ...makeGroup('pg_towerid',   'Tower ID Photo',                 2), slots: [makeSlot('ti_s0', 'towerid_01.jpg'), makeSlot('ti_s1')] },
    { ...makeGroup('pg_rbs_area',  'Area around Outdoor RBS Cabinets', 2), slots: [makeSlot('ra_s0', 'rbs_area_01.jpg'), makeSlot('ra_s1')] },
    { ...makeGroup('pg_rbs_cond',  'Condition of Outdoor RBS Cabinets', 2), slots: [makeSlot('rc_s0', 'rbs_cond_01.jpg'), makeSlot('rc_s1')] },
    { ...makeGroup('pg_rru_label', 'DB RRU Return Label Photo',      2), slots: [makeSlot('rl_s0', 'rru_label_01.jpg'), makeSlot('rl_s1')] },
    makeGroup('pg_addl_site',  'Additional Site Photos',      2),
    { ...makeGroup('pg_compound_clean', 'Compound Cleaned Photos', 2), slots: [{ ...makeSlot('cc_s0', 'compound_clean_01.jpg'), flagged: true, marked: false }, makeSlot('cc_s1')] },
    { ...makeGroup('pg_bphocs',    'Locked BPHOCS Photos',          2), slots: [makeSlot('bp_s0', 'bphocs_01.jpg'), makeSlot('bp_s1')] },
    { ...makeGroup('pg_compound',  'Locked Compound Photos',        2), slots: [makeSlot('cp_s0', 'compound_01.jpg'), makeSlot('cp_s1')] },
  ],
  gammaOverallViews: [
    { ...makeGroup('gv_existing',  'Existing Overall View',          3), slots: [makeSlot('gv_s0', 'gamma_overall_01.jpg'), makeSlot('gv_s1', 'gamma_overall_02.jpg'), makeSlot('gv_s2', 'gamma_overall_03.jpg'), makeSlot('gv_s3')] },
    { ...makeGroup('gv_rru2',      'Existing RRU-2 Overall View',    2), slots: [makeSlot('gr2_s0'), makeSlot('gr2_s1')] },
  ],
  gammaRRUs: [
    { ...makeRRU('rru_01', 'D16YO18828', 'CF86640457', true), newSerialFlagged: true, newSerialMarked: false },
  ],
  catchAll: [],
}

// ─── Photo grid component ───────────────────────────────────────────────────────
function PhotoGroupCard({
  group,
  onToggleSlot,
  onAddSlot,
  onToggleFlag,
}: {
  group: PhotoGroup
  onToggleSlot: (slotId: string) => void
  onAddSlot: () => void
  onToggleFlag: (slotId: string) => void
}) {
  const filled  = group.slots.filter(s => s.filename !== null).length
  const flagged = group.slots.filter(s => s.flagged).length
  return (
    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-bg-gray-lm/60 border-b border-nav-gray/40 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-black">{group.label}</p>
          <p className="text-[10px] text-std-gray-lm mt-0.5">
            {filled} of {group.slots.length} photos
            {group.required && <span className="ml-1.5 text-red-600 font-semibold">· Required</span>}
            {flagged > 0 && <span className="ml-1.5 text-red-600 font-semibold">· {flagged} flagged</span>}
          </p>
        </div>
        {filled > 0 && filled === group.slots.length && (
          <span className="w-5 h-5 rounded-full bg-green-600/15 flex items-center justify-center flex-shrink-0">
            <Check size={10} className="text-green-600" />
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2.5">
          {group.slots.map(slot => (
            <div key={slot.id} className="relative group/slot">
              <div
                onClick={() => onToggleSlot(slot.id)}
                className={clsx(
                  'aspect-[4/3] rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden',
                  slot.flagged ? 'border-red-600/40 bg-red-600/5' :
                  slot.filename ? 'border-green-600/30 bg-gradient-to-br from-slate-100 to-slate-200 hover:opacity-90' :
                  'border-dashed border-nav-gray hover:border-teal-400/60 hover:bg-teal-400/5'
                )}
              >
                {slot.filename ? (
                  <>
                    <FileImage size={22} className="text-teal-400/60" />
                    <p className="text-[10px] text-std-gray-lm text-center leading-tight px-1 truncate w-full text-center">{slot.filename}</p>
                    {slot.marked && <Check size={13} className="absolute top-1.5 right-1.5 text-green-600 bg-white rounded-full p-0.5 shadow-sm" />}
                  </>
                ) : (
                  <>
                    <Camera size={18} className="text-std-gray-dm" />
                    <p className="text-[10px] text-std-gray-dm">Add photo</p>
                  </>
                )}
              </div>
              {slot.filename && (
                <button
                  onClick={() => onToggleFlag(slot.id)}
                  className={clsx(
                    'absolute top-1.5 left-1.5 p-1 rounded-md opacity-0 group-hover/slot:opacity-100 transition-all border',
                    slot.flagged ? 'bg-red-600/10 border-red-600/30 text-red-600 opacity-100' : 'bg-white/80 border-nav-gray text-std-gray-lm hover:text-red-600'
                  )}
                >
                  <Flag size={10} />
                </button>
              )}
            </div>
          ))}
          {/* Add slot button */}
          <button
            onClick={onAddSlot}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-nav-gray flex flex-col items-center justify-center gap-1.5 text-std-gray-dm hover:border-teal-400/60 hover:text-teal-500 hover:bg-teal-400/5 transition-all"
          >
            <Plus size={16} />
            <p className="text-[10px]">Add</p>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RRU Unit card ─────────────────────────────────────────────────────────────
function RRUCard({ rru, onUpdate }: { rru: RRUUnit; onUpdate: (patch: Partial<RRUUnit>) => void }) {
  const progress = getRRUProgress(rru)
  const flags    = getRRUFlagCount(rru)

  function updatePhotoSlot(groupId: string, slotId: string, updater: (s: PhotoSlot) => Partial<PhotoSlot>) {
    onUpdate({
      photoGroups: rru.photoGroups.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: pg.slots.map(s => s.id === slotId ? { ...s, ...updater(s) } : s) }
          : pg
      ),
    })
  }

  function addPhotoSlot(groupId: string) {
    onUpdate({
      photoGroups: rru.photoGroups.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: [...pg.slots, makeSlot(`${groupId}_s${pg.slots.length}_${Date.now()}`)] }
          : pg
      ),
    })
  }

  const flagBtn = (flagged: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
      <Flag size={12} />
    </button>
  )
  const checkBtn = (marked: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
      <Check size={12} />
    </button>
  )

  return (
    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
      {/* Unit header */}
      <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-black">{rru.newSerial || rru.id} – Unit 1</p>
          <p className="text-[10px] text-std-gray-lm mt-0.5">
            {progress.marked}/{progress.total} checked
            {flags > 0 && <span className="ml-2 text-red-600 font-semibold">· {flags} flagged</span>}
          </p>
        </div>
        {progress.total > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-24 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
              <div className={clsx('h-full rounded-full transition-all', progress.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${progress.pct}%` }} />
            </div>
            <span className={clsx('text-xs font-bold', progress.pct === 100 ? 'text-green-600' : 'text-teal-400')}>{progress.pct}%</span>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Serial fields */}
        <div className={clsx('px-4 py-3.5 rounded-xl border transition-colors',
          rru.existingSerialFlagged ? 'bg-red-600/[0.04] border-red-600/25' : rru.existingSerialMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray'
        )}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-black">Existing RRU Serial Number</span>
            <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
            {rru.existingSerialFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={rru.existingSerial}
              onChange={e => onUpdate({ existingSerial: e.target.value, existingSerialMarked: true })}
              className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors"
              placeholder="e.g. D16YO18828" />
            {flagBtn(rru.existingSerialFlagged, () => onUpdate({ existingSerialFlagged: !rru.existingSerialFlagged }))}
            {checkBtn(rru.existingSerialMarked, () => onUpdate({ existingSerialMarked: !rru.existingSerialMarked }))}
          </div>
        </div>

        <div className={clsx('px-4 py-3.5 rounded-xl border transition-colors',
          rru.newSerialFlagged ? 'bg-red-600/[0.04] border-red-600/25' : rru.newSerialMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray'
        )}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-black">New RRU Serial Number</span>
            <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
            {rru.newSerialFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={rru.newSerial}
              onChange={e => onUpdate({ newSerial: e.target.value, newSerialMarked: true })}
              className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors"
              placeholder="e.g. CF86640457" />
            {flagBtn(rru.newSerialFlagged, () => onUpdate({ newSerialFlagged: !rru.newSerialFlagged }))}
            {checkBtn(rru.newSerialMarked, () => onUpdate({ newSerialMarked: !rru.newSerialMarked }))}
          </div>
        </div>

        {/* Photo groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {rru.photoGroups.map(pg => (
            <PhotoGroupCard
              key={pg.id}
              group={pg}
              onToggleSlot={slotId => updatePhotoSlot(pg.id, slotId, s => ({ filename: s.filename ? null : `photo_${Date.now()}.jpg`, marked: !s.filename }))}
              onAddSlot={() => addPhotoSlot(pg.id)}
              onToggleFlag={slotId => updatePhotoSlot(pg.id, slotId, s => ({ flagged: !s.flagged }))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ServiceCOPQCPage() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<COPSurvey>(initialSurvey)
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('overview')
  const [activeSub, setActiveSub] = useState<string | null>('site_info')
  const [navSearch, setNavSearch] = useState('')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [rightTab, setRightTab] = useState<'flags' | 'ai' | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const [aiFlags, setAiFlags] = useState<Record<string, AIFlagEntry>>({})
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { setLastSavedAt(new Date()); setSaveState('saved') }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [survey])

  const updateRRU = useCallback((id: string, patch: Partial<RRUUnit>) =>
    setSurvey(prev => ({ ...prev, gammaRRUs: prev.gammaRRUs.map(r => r.id === id ? { ...r, ...patch } : r) })), [])

  function updatePhotoSlotOnRRU(rruId: string, patch: Partial<RRUUnit>) {
    updateRRU(rruId, patch)
  }

  function updateOverviewPhotoSlot(groupId: string, slotId: string, updater: (s: PhotoSlot) => Partial<PhotoSlot>) {
    setSurvey(prev => ({
      ...prev,
      sitePhotoGroups: prev.sitePhotoGroups.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: pg.slots.map(s => s.id === slotId ? { ...s, ...updater(s) } : s) }
          : pg
      ),
    }))
  }

  function addOverviewPhotoSlot(groupId: string) {
    setSurvey(prev => ({
      ...prev,
      sitePhotoGroups: prev.sitePhotoGroups.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: [...pg.slots, makeSlot(`${groupId}_s${pg.slots.length}_${Date.now()}`)] }
          : pg
      ),
    }))
  }

  function updateGammaOverviewSlot(groupId: string, slotId: string, updater: (s: PhotoSlot) => Partial<PhotoSlot>) {
    setSurvey(prev => ({
      ...prev,
      gammaOverallViews: prev.gammaOverallViews.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: pg.slots.map(s => s.id === slotId ? { ...s, ...updater(s) } : s) }
          : pg
      ),
    }))
  }

  function addGammaOverviewSlot(groupId: string) {
    setSurvey(prev => ({
      ...prev,
      gammaOverallViews: prev.gammaOverallViews.map(pg =>
        pg.id === groupId
          ? { ...pg, slots: [...pg.slots, makeSlot(`${groupId}_s${pg.slots.length}_${Date.now()}`)] }
          : pg
      ),
    }))
  }

  const { marked: totalMarked, total: totalFields, pct: overallPct, flagCount: totalFlags } = getOverallProgress(survey)
  const aiIssueCount = Object.keys(aiFlags).length
  const sectionsCompleted = SECTIONS.filter(s => { const { marked, total } = getSectionProgress(s.id, survey); return total > 0 && marked === total }).length

  // Sub-section progress & flags
  const secProgress = getSubProgress(activeSectionId, activeSub, survey)
  const secFlags    = getSubFlagCount(activeSectionId, activeSub, survey)
  const allCurrentChecked = secProgress.total > 0 && secProgress.marked === secProgress.total

  // Flat nav steps across all sub-sections
  const navSteps: { sectionId: SectionId; sub: string | null }[] = [
    { sectionId: 'overview',  sub: 'site_info'    },
    { sectionId: 'overview',  sub: 'glamour'      },
    { sectionId: 'overview',  sub: 'site_photos'  },
    { sectionId: 'gamma',     sub: 'overall_views' },
    ...survey.gammaRRUs.map(r => ({ sectionId: 'gamma' as SectionId, sub: r.id })),
    { sectionId: 'catch_all', sub: null            },
  ]

  const currentNavIdx = navSteps.findIndex(s => s.sectionId === activeSectionId && s.sub === activeSub)
  const isFirstNav = currentNavIdx <= 0
  const isLastNav  = currentNavIdx >= navSteps.length - 1

  function goPrev() {
    if (currentNavIdx > 0) {
      const step = navSteps[currentNavIdx - 1]
      setActiveSectionId(step.sectionId)
      setActiveSub(step.sub)
    }
  }
  function goNext() {
    if (currentNavIdx < navSteps.length - 1) {
      const step = navSteps[currentNavIdx + 1]
      setActiveSectionId(step.sectionId)
      setActiveSub(step.sub)
    }
  }
  function getPrevLabel() {
    if (currentNavIdx <= 0) return 'Previous'
    const s = navSteps[currentNavIdx - 1]
    return getSubLabel(s.sectionId, s.sub, survey)
  }
  function getNextLabel() {
    if (currentNavIdx >= navSteps.length - 1) return 'Next'
    const s = navSteps[currentNavIdx + 1]
    return getSubLabel(s.sectionId, s.sub, survey)
  }

  function markAllChecked() {
    if (activeSectionId === 'overview') {
      if (activeSub === 'site_info') {
        setSurvey(prev => ({
          ...prev,
          eusMarked: prev.eusFlagged ? prev.eusMarked : true,
          enbMarked: prev.enbFlagged ? prev.enbMarked : true,
          craneMarked: prev.craneFlagged ? prev.craneMarked : true,
          ticketMarked: prev.ticketFlagged ? prev.ticketMarked : true,
          sectorsMarked: prev.sectorsFlagged ? prev.sectorsMarked : true,
          workMarked: prev.workFlagged ? prev.workMarked : true,
          returnVisitMarked: prev.returnVisitFlagged ? prev.returnVisitMarked : true,
          resolutionMarked: prev.resolutionFlagged ? prev.resolutionMarked : true,
        }))
      } else if (activeSub === 'glamour') {
        setSurvey(prev => ({ ...prev, glamourPhoto: prev.glamourPhoto.flagged ? prev.glamourPhoto : { ...prev.glamourPhoto, marked: true } }))
      } else if (activeSub === 'site_photos') {
        setSurvey(prev => ({ ...prev, sitePhotoGroups: prev.sitePhotoGroups.map(pg => ({ ...pg, slots: pg.slots.map(s => s.flagged || !s.filename ? s : { ...s, marked: true }) })) }))
      }
    } else if (activeSectionId === 'gamma') {
      if (activeSub === 'overall_views') {
        setSurvey(prev => ({ ...prev, gammaOverallViews: prev.gammaOverallViews.map(pg => ({ ...pg, slots: pg.slots.map(s => s.flagged || !s.filename ? s : { ...s, marked: true }) })) }))
      } else {
        setSurvey(prev => ({
          ...prev,
          gammaRRUs: prev.gammaRRUs.map(rru => rru.id !== activeSub ? rru : {
            ...rru,
            existingSerialMarked: rru.existingSerialFlagged ? rru.existingSerialMarked : true,
            newSerialMarked: rru.newSerialFlagged ? rru.newSerialMarked : true,
            photoGroups: rru.photoGroups.map(pg => ({ ...pg, slots: pg.slots.map(s => s.flagged || !s.filename ? s : { ...s, marked: true }) })),
          }),
        }))
      }
    } else if (activeSectionId === 'catch_all') {
      setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.flagged ? c : { ...c, marked: true }) }))
    }
  }

  // Flat field list for AI analysis
  const allCOPFields = [
    { id: 'eus', label: 'EUS Appointment Number', value: survey.eusAppointmentNumber, flagged: survey.eusFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'enb', label: 'eNB Name',               value: survey.enbName,              flagged: survey.enbFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'crane', label: 'Crane or Man-Lift',     value: survey.craneUsed,            flagged: survey.craneFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'ticket', label: 'Ticket Type',          value: survey.ticketType,           flagged: survey.ticketFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'sectors', label: 'Sectors Worked On',   value: survey.sectorsWorkedOn.join(', '), flagged: survey.sectorsFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'work', label: 'Work Completed',         value: survey.workCompleted,        flagged: survey.workFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'return', label: 'Return Visit Needed',  value: survey.returnVisitNeeded,    flagged: survey.returnVisitFlagged, required: true, sectionId: 'overview' as SectionId },
    { id: 'resolution', label: 'Resolution Type',  value: survey.resolutionType,       flagged: survey.resolutionFlagged, required: true, sectionId: 'overview' as SectionId },
    ...survey.gammaRRUs.flatMap(r => [
      { id: `${r.id}_ex`,  label: `RRU Existing Serial`,    value: r.existingSerial, flagged: r.existingSerialFlagged, required: true, sectionId: 'gamma' as SectionId },
      { id: `${r.id}_new`, label: `RRU New Serial`,         value: r.newSerial,      flagged: r.newSerialFlagged,      required: true, sectionId: 'gamma' as SectionId },
    ]),
  ]

  function runAIAnalysis() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const newFlags: Record<string, AIFlagEntry> = {}
      allCOPFields.filter(f => f.required && !f.value).slice(0, 3).forEach(f => {
        newFlags[f.id] = { issue: 'Required field has no value. Must be completed before finalizing the survey.', severity: 'error' }
      })
      allCOPFields.filter(f => f.flagged).slice(0, 2).forEach(f => {
        if (!newFlags[f.id]) newFlags[f.id] = { issue: 'Manually flagged. AI recommends cross-referencing this value against site documentation before approving.', severity: 'warning' }
      })
      const candidates = allCOPFields.filter(f => !newFlags[f.id] && !f.flagged && f.value)
      if (candidates.length > 0) newFlags[candidates[0].id] = { issue: `Value "${candidates[0].value}" may differ from last inspection. Verify against tower records.`, severity: 'suggestion' }
      setAiFlags(newFlags)
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2000)
  }

  // Flag list for slide-over
  const flagList: { label: string; location: string }[] = []
  if (survey.eusFlagged)          flagList.push({ label: 'EUS Appointment Number', location: 'Service COP Overview' })
  if (survey.enbFlagged)          flagList.push({ label: 'eNB Name',               location: 'Service COP Overview' })
  if (survey.craneFlagged)        flagList.push({ label: 'Crane or Man-Lift',       location: 'Service COP Overview' })
  if (survey.ticketFlagged)       flagList.push({ label: 'Ticket Type',             location: 'Service COP Overview' })
  if (survey.sectorsFlagged)      flagList.push({ label: 'Sectors Worked On',       location: 'Service COP Overview' })
  if (survey.workFlagged)         flagList.push({ label: 'Work Completed',          location: 'Service COP Overview' })
  if (survey.returnVisitFlagged)  flagList.push({ label: 'Return Visit Needed',     location: 'Service COP Overview' })
  if (survey.resolutionFlagged)   flagList.push({ label: 'Resolution Type',         location: 'Service COP Overview' })
  if (survey.glamourPhoto.flagged) flagList.push({ label: 'Glamour Photo',          location: 'Service COP Overview' })
  survey.sitePhotoGroups.forEach(pg => pg.slots.filter(s => s.flagged).forEach(() => flagList.push({ label: pg.label, location: 'Service COP Overview' })))
  survey.gammaRRUs.forEach(r => {
    if (r.existingSerialFlagged) flagList.push({ label: 'Existing RRU Serial', location: 'Gamma Sector' })
    if (r.newSerialFlagged)      flagList.push({ label: 'New RRU Serial',      location: 'Gamma Sector' })
    r.photoGroups.forEach(pg => pg.slots.filter(s => s.flagged).forEach(() => flagList.push({ label: pg.label, location: 'Gamma Sector' })))
  })

  const filteredSections = SECTIONS.filter(s => !navSearch || s.label.toLowerCase().includes(navSearch.toLowerCase()))

  // Shared field card helpers
  const flagBtn = (flagged: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors flex-shrink-0', flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
      <Flag size={12} />
    </button>
  )
  const checkBtn = (marked: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors flex-shrink-0', marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
      <Check size={12} />
    </button>
  )

  return (
    <AIFlagsContext.Provider value={aiFlags}>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-nav-gray flex-shrink-0">
        <div className="flex items-center h-11 px-2 gap-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm transition-colors flex-shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="h-5 w-px bg-nav-gray mx-2 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <h1 className="text-sm font-bold text-black">{survey.name}</h1>
            {surveyComplete
              ? <span className="hidden lg:inline-flex badge bg-green-600/10 text-green-600 border border-green-600/30 text-[10px] py-0.5">Complete</span>
              : <span className="hidden lg:inline-flex badge bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[10px] py-0.5">In Progress</span>
            }
          </div>
          <div className="flex-1 flex items-center justify-center gap-3 px-3 min-w-0">
            <div className="hidden lg:flex items-center gap-2.5 min-w-0 max-w-xs w-full">
              <div className="flex-1 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full transition-all duration-300', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
              </div>
              <span className={clsx('text-xs font-bold w-8 flex-shrink-0', overallPct === 100 ? 'text-green-600' : 'text-teal-400')}>{overallPct}%</span>
              <span className="text-[11px] text-std-gray-lm flex-shrink-0 hidden xl:inline">{totalMarked}/{totalFields} fields</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => setRightTab(rightTab === 'flags' ? null : 'flags')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'flags' ? 'bg-red-600/10 text-red-600' : totalFlags > 0 ? 'text-red-600 hover:bg-red-600/8' : 'text-std-gray-lm hover:bg-hover-gray-lm')}>
              <Flag size={13} /><span className="hidden lg:inline">Flags</span>
              {totalFlags > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'flags' ? 'bg-red-600 text-white' : 'bg-red-600/15 text-red-600')}>{totalFlags}</span>}
            </button>
            <button onClick={() => setRightTab(rightTab === 'ai' ? null : 'ai')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'ai' ? 'bg-purple-600/10 text-purple-600' : 'text-purple-600 hover:bg-purple-600/8')}>
              <Sparkles size={13} /><span className="hidden lg:inline">AI Analysis</span>
              {aiAnalyzed && aiIssueCount > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-purple-600/15 text-purple-600')}>{aiIssueCount}</span>}
            </button>
            <div className={clsx('hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300', saveState === 'saving' ? 'text-std-gray-lm' : saveState === 'saved' ? 'text-green-600' : 'text-std-gray-dm')}>
              {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveState === 'saved' && lastSavedAt && <><CheckCheck size={11} /> {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>}
            </div>
            <div className="h-5 w-px bg-nav-gray mx-1.5 flex-shrink-0" />
            <button onClick={() => setCompletionModalOpen(true)} disabled={surveyComplete}
              className={clsx('btn-success text-xs px-3 py-1.5', surveyComplete && 'opacity-60 cursor-default')}>
              <CheckCircle2 size={13} /><span className="hidden md:inline">{surveyComplete ? 'Completed' : 'Mark Complete'}</span>
            </button>
            <button onClick={() => setHeaderCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors ml-0.5">
              <ChevronDown size={13} className={clsx('transition-transform duration-200', headerCollapsed && 'rotate-180')} />
            </button>
          </div>
        </div>
        {!headerCollapsed && (
          <div className="flex items-center gap-3 px-4 py-1 bg-bg-gray-lm/60 border-t border-nav-gray/30 text-[11px] text-std-gray-lm">
            <span className="truncate min-w-0">{survey.siteName} · {survey.siteId} · <span className="hidden md:inline">{survey.technician}</span></span>
            <span className="ml-auto hidden sm:flex items-center gap-2.5 flex-shrink-0">
              <span><span className="font-semibold text-black">{totalMarked}</span>/{totalFields} fields</span>
              <span className="text-nav-gray">·</span>
              <span><span className="font-semibold text-black">{sectionsCompleted}</span>/{SECTIONS.length} sections</span>
            </span>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <aside className="flex-shrink-0 w-64 bg-white border-r border-nav-gray flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-nav-gray bg-hover-gray-lm/40 flex-shrink-0">
            <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-2.5">Sections</p>
            <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-2.5 py-1.5">
              <Search size={12} className="text-std-gray-lm flex-shrink-0" />
              <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Filter sections…"
                className="bg-transparent text-xs text-black placeholder-std-gray-lm outline-none w-full" />
              {navSearch && <button onClick={() => setNavSearch('')} className="text-std-gray-lm hover:text-black transition-colors flex-shrink-0"><X size={11} /></button>}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {filteredSections.map(sec => {
              const { marked, total, pct } = getSectionProgress(sec.id, survey)
              const flags    = getSectionFlagCount(sec.id, survey)
              const isActive = sec.id === activeSectionId
              const isDone   = total > 0 && marked === total

              // Build sub-items for this section
              const subItems: { id: string; label: string }[] =
                sec.id === 'overview' ? OVERVIEW_SUBS :
                sec.id === 'gamma'    ? [
                  { id: 'overall_views', label: 'Overall Views' },
                  ...survey.gammaRRUs.map(r => ({ id: r.id, label: r.newSerial || r.existingSerial || r.id })),
                ] : []

              return (
                <div key={sec.id} className={clsx('mx-1 rounded-lg transition-all border', isActive ? 'bg-teal-900/8 border-teal-400/35 shadow-sm' : 'border-transparent')}>
                  <button
                    onClick={() => {
                      setActiveSectionId(sec.id)
                      if (sec.id === 'overview')  setActiveSub('site_info')
                      else if (sec.id === 'gamma') setActiveSub('overall_views')
                      else setActiveSub(null)
                    }}
                    className={clsx('w-full text-left px-3 py-2.5 rounded-lg transition-colors', !isActive && 'hover:bg-hover-gray-lm')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={clsx('text-xs font-semibold truncate max-w-[130px]', isActive ? 'text-teal-900' : isDone ? 'text-green-600' : 'text-black')}>{sec.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                        {isDone && <span className="w-4 h-4 rounded-full bg-green-600/15 flex items-center justify-center"><Check size={9} className="text-green-600" /></span>}
                        {flags > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-600/10 rounded-full px-1.5 py-0.5 border border-red-600/20 font-semibold"><Flag size={8} />{flags}</span>}
                        {total > 0 && <span className={clsx('text-[10px] rounded-full px-1.5 py-0.5 font-medium', isActive ? 'bg-teal-400/15 text-teal-600' : 'bg-bg-gray-lm text-std-gray-lm')}>{total}</span>}
                      </div>
                    </div>
                    {total > 0 ? (
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-bg-gray-lm rounded-full overflow-hidden">
                          <div className={clsx('h-full rounded-full transition-all duration-300', pct === 100 ? 'bg-green-600' : isActive ? 'bg-teal-300' : 'bg-teal-400/60')} style={{ width: `${pct}%` }} />
                        </div>
                        <p className={clsx('text-[10px]', isActive ? 'text-teal-600' : isDone ? 'text-green-600' : 'text-std-gray-lm')}>{isDone ? 'Complete' : `${marked}/${total} checked`}</p>
                      </div>
                    ) : <p className="text-[10px] text-std-gray-dm">No fields</p>}
                  </button>

                  {/* Always-visible sub-nav */}
                  {subItems.length > 0 && (
                    <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1.5 space-y-px">
                      {subItems.map(item => {
                        const subActive = activeSectionId === sec.id && activeSub === item.id
                        const subFlags  = getSubFlagCount(sec.id, item.id, survey)
                        const subProg   = getSubProgress(sec.id, item.id, survey)
                        const subDone   = subProg.total > 0 && subProg.marked === subProg.total
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setActiveSectionId(sec.id); setActiveSub(item.id) }}
                            className={clsx(
                              'w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between gap-1',
                              subActive ? 'bg-teal-400/15 text-teal-700 font-semibold' : 'text-std-gray-lm hover:bg-hover-gray-lm hover:text-black'
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              {subDone && <span className="w-3.5 h-3.5 rounded-full bg-green-600/15 flex items-center justify-center"><Check size={8} className="text-green-600" /></span>}
                              {subFlags > 0 && <span className="flex items-center gap-0.5 text-[9px] text-red-600 bg-red-600/10 rounded-full px-1 py-0.5 border border-red-600/20 font-semibold"><Flag size={7} />{subFlags}</span>}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Sticky section header */}
          <div className="sticky top-0 z-10 bg-bg-gray-lm/95 backdrop-blur-sm border-b border-nav-gray/40 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-std-gray-lm">{SECTIONS.find(s => s.id === activeSectionId)?.label}</span>
                {activeSub && <><span className="text-std-gray-dm text-[10px]">/</span><span className="text-[10px] font-semibold text-teal-600">{getSubLabel(activeSectionId, activeSub, survey)}</span></>}
              </div>
              <h2 className="text-base font-bold text-teal-900 mt-0.5">{getSubLabel(activeSectionId, activeSub, survey)}</h2>
              <p className="text-xs text-std-gray-lm mt-0.5">
                {secProgress.marked} of {secProgress.total} fields checked
                {secFlags > 0 && <span className="ml-2 text-red-600 font-semibold">· {secFlags} flagged</span>}
              </p>
            </div>
            {secProgress.total > 0 && (
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-36 h-2 bg-nav-gray rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full transition-all duration-500', secProgress.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${secProgress.pct}%` }} />
                </div>
                <span className={clsx('text-sm font-bold w-10 text-right', secProgress.pct === 100 ? 'text-green-600' : 'text-teal-400')}>{secProgress.pct}%</span>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto bg-bg-gray-lm/50">
            <div className="px-6 py-5 space-y-6">

              {/* ── Service COP Overview ── */}
              {activeSectionId === 'overview' && activeSub === 'site_info' && (
                <>
                  {/* Site information (read-only) */}
                  <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                      <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Site Information</p>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                      {([
                        ['Site Name',        survey.siteName],
                        ['Site ID',          survey.siteId],
                        ['Survey Type',      'Service COP'],
                        ['Customer',         survey.customer],
                        ['Technician',       survey.technician],
                        ['Coordinates',      survey.coordinates],
                        ['Technician Email', survey.technicianEmail],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-wide">{label}</p>
                          <p className="text-sm text-black mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Site info fields */}
                  <div>
                    <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-3">Site Info</p>
                    <div className="space-y-3">
                      {/* EUS Appointment Number */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.eusFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.eusMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-black">EUS Appointment Number</span>
                          <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                          {survey.eusFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input value={survey.eusAppointmentNumber} onChange={e => setSurvey(p => ({ ...p, eusAppointmentNumber: e.target.value, eusMarked: true }))}
                            className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors" placeholder="e.g. SA-1547144" />
                          {flagBtn(survey.eusFlagged, () => setSurvey(p => ({ ...p, eusFlagged: !p.eusFlagged })))}
                          {checkBtn(survey.eusMarked, () => setSurvey(p => ({ ...p, eusMarked: !p.eusMarked })))}
                        </div>
                      </div>

                      {/* eNB Name */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.enbFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.enbMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-black">eNB Name</span>
                          <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                          {survey.enbFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input value={survey.enbName} onChange={e => setSurvey(p => ({ ...p, enbName: e.target.value, enbMarked: true }))}
                            className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors" placeholder="e.g. OMA KOA 1977766" />
                          {flagBtn(survey.enbFlagged, () => setSurvey(p => ({ ...p, enbFlagged: !p.enbFlagged })))}
                          {checkBtn(survey.enbMarked, () => setSurvey(p => ({ ...p, enbMarked: !p.enbMarked })))}
                        </div>
                      </div>

                      {/* Crane or man-lift */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.craneFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.craneMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Crane or Man-Lift Used On-Site</span>
                          {survey.craneFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2 flex-1">
                            {(['Yes', 'No'] as YesNo[]).map(opt => (
                              <button key={opt} onClick={() => setSurvey(p => ({ ...p, craneUsed: p.craneUsed === opt ? '' : opt, craneMarked: true }))}
                                className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                                  survey.craneUsed === opt
                                    ? (opt === 'Yes' ? 'bg-teal-400 text-white border-teal-400 shadow-sm' : 'bg-sidebar text-white border-sidebar shadow-sm')
                                    : 'bg-white text-std-gray-lm border-nav-gray hover:border-teal-400/50')}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {flagBtn(survey.craneFlagged, () => setSurvey(p => ({ ...p, craneFlagged: !p.craneFlagged })))}
                          {checkBtn(survey.craneMarked, () => setSurvey(p => ({ ...p, craneMarked: !p.craneMarked })))}
                        </div>
                      </div>

                      {/* Ticket Type */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.ticketFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.ticketMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Ticket Type</span>
                          <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                          {survey.ticketFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {TICKET_TYPES.map(opt => (
                              <button key={opt} onClick={() => setSurvey(p => ({ ...p, ticketType: p.ticketType === opt ? '' : opt, ticketMarked: true }))}
                                className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                                  survey.ticketType === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white')}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {flagBtn(survey.ticketFlagged, () => setSurvey(p => ({ ...p, ticketFlagged: !p.ticketFlagged })))}
                          {checkBtn(survey.ticketMarked, () => setSurvey(p => ({ ...p, ticketMarked: !p.ticketMarked })))}
                        </div>
                      </div>

                      {/* Sectors worked on */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.sectorsFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.sectorsMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Sectors Worked On</span>
                          <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                          {survey.sectorsFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {SECTORS.map(opt => {
                              const sel = survey.sectorsWorkedOn.includes(opt)
                              return (
                                <button key={opt} onClick={() => setSurvey(p => ({ ...p, sectorsWorkedOn: sel ? p.sectorsWorkedOn.filter(s => s !== opt) : [...p.sectorsWorkedOn, opt], sectorsMarked: true }))}
                                  className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                                    sel ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white')}>
                                  {sel && <Check size={9} className="inline mr-1 mb-0.5" />}{opt}
                                </button>
                              )
                            })}
                          </div>
                          {flagBtn(survey.sectorsFlagged, () => setSurvey(p => ({ ...p, sectorsFlagged: !p.sectorsFlagged })))}
                          {checkBtn(survey.sectorsMarked, () => setSurvey(p => ({ ...p, sectorsMarked: !p.sectorsMarked })))}
                        </div>
                      </div>

                      {/* Work Completed */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.workFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.workMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Work Completed</span>
                          {survey.workFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2 flex-1">
                            {(['Yes', 'No'] as YesNo[]).map(opt => (
                              <button key={opt} onClick={() => setSurvey(p => ({ ...p, workCompleted: p.workCompleted === opt ? '' : opt, workMarked: true }))}
                                className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                                  survey.workCompleted === opt ? (opt === 'Yes' ? 'bg-teal-400 text-white border-teal-400' : 'bg-sidebar text-white border-sidebar') : 'bg-white text-std-gray-lm border-nav-gray hover:border-teal-400/50')}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {flagBtn(survey.workFlagged, () => setSurvey(p => ({ ...p, workFlagged: !p.workFlagged })))}
                          {checkBtn(survey.workMarked, () => setSurvey(p => ({ ...p, workMarked: !p.workMarked })))}
                        </div>
                      </div>

                      {/* Return Visit Needed */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.returnVisitFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.returnVisitMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Return Visit Needed</span>
                          {survey.returnVisitFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2 flex-1">
                            {(['Yes', 'No'] as YesNo[]).map(opt => (
                              <button key={opt} onClick={() => setSurvey(p => ({ ...p, returnVisitNeeded: p.returnVisitNeeded === opt ? '' : opt, returnVisitMarked: true }))}
                                className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                                  survey.returnVisitNeeded === opt ? (opt === 'Yes' ? 'bg-teal-400 text-white border-teal-400' : 'bg-sidebar text-white border-sidebar') : 'bg-white text-std-gray-lm border-nav-gray hover:border-teal-400/50')}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {flagBtn(survey.returnVisitFlagged, () => setSurvey(p => ({ ...p, returnVisitFlagged: !p.returnVisitFlagged })))}
                          {checkBtn(survey.returnVisitMarked, () => setSurvey(p => ({ ...p, returnVisitMarked: !p.returnVisitMarked })))}
                        </div>
                      </div>

                      {/* Resolution Type */}
                      <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.resolutionFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.resolutionMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-black">Resolution Type</span>
                          <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                          {survey.resolutionFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {RESOLUTION_TYPES.map(opt => (
                              <button key={opt} onClick={() => setSurvey(p => ({ ...p, resolutionType: p.resolutionType === opt ? '' : opt, resolutionMarked: true }))}
                                className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                                  survey.resolutionType === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white')}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {flagBtn(survey.resolutionFlagged, () => setSurvey(p => ({ ...p, resolutionFlagged: !p.resolutionFlagged })))}
                          {checkBtn(survey.resolutionMarked, () => setSurvey(p => ({ ...p, resolutionMarked: !p.resolutionMarked })))}
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}

              {/* ── Overview: Glamour Photo ── */}
              {activeSectionId === 'overview' && activeSub === 'glamour' && (
                <div>
                  <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-3">Glamour Photo</p>
                  <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors', survey.glamourPhoto.flagged ? 'bg-red-600/[0.04] border-red-600/25' : 'bg-white border-nav-gray')}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-black">Glamour Photo</span>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                      {survey.glamourPhoto.flagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setSurvey(p => ({ ...p, glamourPhoto: { ...p.glamourPhoto, filename: p.glamourPhoto.filename ? null : 'glamour_01.jpg', marked: !p.glamourPhoto.filename } }))}
                        className={clsx('w-32 h-24 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden',
                          survey.glamourPhoto.filename ? 'border-green-600/30 bg-gradient-to-br from-slate-100 to-slate-200 hover:opacity-80' : 'border-dashed border-nav-gray hover:border-teal-400/60 hover:bg-teal-400/5'
                        )}>
                        {survey.glamourPhoto.filename ? (
                          <>
                            <FileImage size={24} className="text-teal-400/60" />
                            <p className="text-[10px] text-std-gray-lm text-center px-1 truncate">{survey.glamourPhoto.filename}</p>
                            {survey.glamourPhoto.marked && <Check size={13} className="absolute top-1.5 right-1.5 text-green-600 bg-white rounded-full p-0.5 shadow-sm" />}
                          </>
                        ) : (
                          <>
                            <Camera size={20} className="text-std-gray-dm" />
                            <p className="text-[10px] text-std-gray-dm">Add photo</p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {flagBtn(survey.glamourPhoto.flagged, () => setSurvey(p => ({ ...p, glamourPhoto: { ...p.glamourPhoto, flagged: !p.glamourPhoto.flagged } })))}
                        {checkBtn(survey.glamourPhoto.marked, () => setSurvey(p => ({ ...p, glamourPhoto: { ...p.glamourPhoto, marked: !p.glamourPhoto.marked } })))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Overview: Site & Log Book Photos ── */}
              {activeSectionId === 'overview' && activeSub === 'site_photos' && (
                <div>
                  <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-3">Site &amp; Log Book Photos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {survey.sitePhotoGroups.map(pg => (
                      <PhotoGroupCard
                        key={pg.id}
                        group={pg}
                        onToggleSlot={slotId => updateOverviewPhotoSlot(pg.id, slotId, s => ({ filename: s.filename ? null : `photo_${Date.now()}.jpg`, marked: !s.filename }))}
                        onAddSlot={() => addOverviewPhotoSlot(pg.id)}
                        onToggleFlag={slotId => updateOverviewPhotoSlot(pg.id, slotId, s => ({ flagged: !s.flagged }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Gamma: Overall Views ── */}
              {activeSectionId === 'gamma' && activeSub === 'overall_views' && (
                <div>
                  <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-3">Overall Views</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {survey.gammaOverallViews.map(pg => (
                      <PhotoGroupCard
                        key={pg.id}
                        group={pg}
                        onToggleSlot={slotId => updateGammaOverviewSlot(pg.id, slotId, s => ({ filename: s.filename ? null : `photo_${Date.now()}.jpg`, marked: !s.filename }))}
                        onAddSlot={() => addGammaOverviewSlot(pg.id)}
                        onToggleFlag={slotId => updateGammaOverviewSlot(pg.id, slotId, s => ({ flagged: !s.flagged }))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Gamma: RRU Units (one per sub) ── */}
              {activeSectionId === 'gamma' && activeSub !== 'overall_views' && activeSub !== null && (() => {
                const rru = survey.gammaRRUs.find(r => r.id === activeSub)
                if (!rru) return null
                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">RRU Unit</p>
                      <button
                        onClick={() => setSurvey(prev => {
                          const newRRU = makeRRU(`rru_${Date.now()}`, '', '')
                          return { ...prev, gammaRRUs: [...prev.gammaRRUs, newRRU] }
                        })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <Plus size={13} /> Add RRU Unit
                      </button>
                    </div>
                    <RRUCard rru={rru} onUpdate={patch => updatePhotoSlotOnRRU(rru.id, patch)} />
                  </div>
                )
              })()}

              {/* ── Catch All ── */}
              {activeSectionId === 'catch_all' && (
                <div>
                  {survey.catchAll.length === 0 && (
                    <div className="rounded-xl border border-dashed border-nav-gray py-16 text-center bg-white">
                      <p className="text-std-gray-lm text-sm font-medium">No catch-all items</p>
                      <p className="text-std-gray-dm text-xs mt-1">Add items for any observations not covered above</p>
                    </div>
                  )}
                  {survey.catchAll.length > 0 && (
                    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/40">
                      {survey.catchAll.map(item => (
                        <div key={item.id} className="px-5 py-4">
                          <textarea value={item.description}
                            onChange={e => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, description: e.target.value } : c) }))}
                            placeholder="Describe the observation…" rows={2}
                            className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors resize-none" />
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, marked: !c.marked } : c) }))}
                              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors', item.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
                              <Check size={11} />{item.marked ? 'Marked' : 'Mark'}
                            </button>
                            <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.filter(c => c.id !== item.id) }))}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-nav-gray text-xs font-medium text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors ml-auto">
                              <Minus size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: [...prev.catchAll, { id: `ca_${Date.now()}`, description: '', flagged: false, marked: false }] }))}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-400/8 rounded-xl border border-dashed border-teal-400/40 transition-colors font-medium">
                    <Plus size={15} /> Add Item
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ── Footer nav ── */}
          <div className="bg-white border-t border-nav-gray px-3 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
            <button onClick={goPrev} disabled={isFirstNav}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <ChevronLeft size={15} /><span className="max-w-[100px] truncate hidden md:inline">{getPrevLabel()}</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {secFlags > 0 && (
                <span className="hidden md:flex items-center gap-1.5 text-xs text-red-600 bg-red-600/8 border border-red-600/20 rounded-full px-3 py-1.5 font-medium flex-shrink-0">
                  <Flag size={12} /> {secFlags} flag{secFlags > 1 ? 's' : ''} to review
                </span>
              )}
              <button onClick={markAllChecked} disabled={allCurrentChecked}
                className={clsx('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0',
                  allCurrentChecked ? 'bg-green-600/10 border border-green-600/25 text-green-600 cursor-default' : 'bg-teal-400/10 border border-teal-400/30 text-teal-600 hover:bg-teal-400/20')}>
                <CheckCheck size={15} /><span className="hidden sm:inline">{allCurrentChecked ? 'Section Complete' : 'Mark All Checked'}</span>
              </button>
            </div>
            <button onClick={goNext} disabled={isLastNav}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <span className="max-w-[100px] truncate hidden md:inline">{getNextLabel()}</span><ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Flags slide-over ── */}
      {rightTab === 'flags' && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setRightTab(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-nav-gray flex-shrink-0">
              <Flag size={14} className="text-red-600" />
              <span className="text-sm font-semibold text-black">Flags</span>
              {totalFlags > 0 && <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-red-600/15 text-red-600">{totalFlags}</span>}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {flagList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                  <CheckCheck size={20} className="text-green-600" />
                  <p className="text-sm font-medium text-black">No flags</p>
                </div>
              ) : (
                <div className="p-3 space-y-1.5">
                  {flagList.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg border border-red-600/20 bg-red-600/[0.03]">
                      <p className="text-xs font-semibold text-black truncate">{f.label}</p>
                      <div className="flex items-center gap-1.5 mt-1"><Flag size={10} className="text-red-600 flex-shrink-0" /><span className="text-[11px] text-std-gray-lm">{f.location}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── AI Analysis slide-over ── */}
      {rightTab === 'ai' && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setRightTab(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-nav-gray flex-shrink-0">
              <Sparkles size={14} className="text-purple-600" />
              <span className="text-sm font-semibold text-black">AI Analysis</span>
              <span className="badge bg-purple-600/10 text-purple-600 border border-purple-600/20 text-[10px]">Beta</span>
              {aiAnalyzed && aiIssueCount > 0 && <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-purple-600/15 text-purple-600">{aiIssueCount}</span>}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>
            </div>
            {!aiAnalyzed && !aiAnalyzing && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-std-gray-lm leading-relaxed">Analyzes the survey for missing required data, anomalies, and quality issues.</p>
                <button onClick={runAIAnalysis} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
                  <Sparkles size={14} /> Run Analysis
                </button>
              </div>
            )}
            {aiAnalyzing && (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
                <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-purple-600" />
                </div>
                <p className="text-sm font-medium text-black">Analyzing survey…</p>
                <p className="text-xs text-std-gray-lm text-center">Checking {allCOPFields.length} fields for issues</p>
              </div>
            )}
            {aiAnalyzed && !aiAnalyzing && (
              <>
                <div className="flex-1 overflow-y-auto">
                  {aiIssueCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                      <CheckCheck size={22} className="text-green-600" />
                      <p className="text-sm font-medium text-black">No issues found</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-[11px] text-std-gray-lm font-medium uppercase tracking-wide px-1">{aiIssueCount} issue{aiIssueCount !== 1 ? 's' : ''} found</p>
                      {Object.entries(aiFlags).map(([fieldId, entry]) => {
                        const field = allCOPFields.find(f => f.id === fieldId)
                        if (!field) return null
                        const borderCls = entry.severity === 'error' ? 'border-red-600/25 bg-red-600/[0.04]' : entry.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-purple-600/20 bg-purple-600/[0.03]'
                        const iconEl = entry.severity === 'error' ? <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" /> : entry.severity === 'warning' ? <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" /> : <Sparkles size={11} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        return (
                          <button key={fieldId} onClick={() => { setActiveSectionId(field.sectionId); setRightTab(null) }}
                            className={clsx('w-full text-left p-3 rounded-lg border transition-colors hover:opacity-80', borderCls)}>
                            <div className="flex items-start gap-2">
                              {iconEl}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-black truncate">{field.label}</p>
                                <p className="text-[11px] text-std-gray-lm mt-0.5 leading-relaxed">{entry.issue}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-nav-gray flex-shrink-0">
                  <button onClick={runAIAnalysis} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-600/30 bg-purple-600/5 text-purple-600 text-xs font-medium hover:bg-purple-600/10 transition-colors">
                    <Sparkles size={12} /> Re-analyze
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Completion modal ── */}
      {completionModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className={clsx('px-6 pt-6 pb-4', totalFlags > 0 ? 'bg-amber-50' : 'bg-green-50')}>
              <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mb-3', totalFlags > 0 ? 'bg-amber-500/15' : 'bg-green-600/15')}>
                {totalFlags > 0 ? <AlertTriangle size={22} className="text-amber-600" /> : <CheckCircle2 size={22} className="text-green-600" />}
              </div>
              <h2 className="text-base font-bold text-black">{totalFlags > 0 ? 'Survey has unresolved flags' : 'Mark survey as complete?'}</h2>
              <p className="text-sm text-std-gray-lm mt-1">{totalFlags > 0 ? `${totalFlags} field${totalFlags > 1 ? 's' : ''} are flagged and need attention.` : 'This will lock the survey and generate a report-ready export.'}</p>
            </div>
            <div className="px-6 py-4 space-y-2 border-b border-nav-gray">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-black">Fields</span>
                <span className="text-xs text-std-gray-lm">{overallPct}% complete</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-gray-lm rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-black w-20 text-right flex-shrink-0">{totalMarked}/{totalFields} checked</span>
              </div>
            </div>
            <div className="px-6 py-4 flex gap-2">
              <button onClick={() => setCompletionModalOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button onClick={() => { setSurveyComplete(true); setCompletionModalOpen(false) }}
                className="btn-success flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> Mark Complete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
    </AIFlagsContext.Provider>
  )
}
