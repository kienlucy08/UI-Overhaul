import { useState, useRef, useCallback, useEffect, createContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Flag, X, Plus, Minus,
  ChevronDown, ChevronRight, ChevronLeft, Check,
  Search, CheckCheck, Loader2, AlertTriangle, Sparkles, FileImage, Trash2, Camera, Lock,
} from 'lucide-react'
import clsx from 'clsx'

// ─── AI flag types ──────────────────────────────────────────────────────────────
type AIFlagSeverity = 'error' | 'warning' | 'suggestion'
type AIFlagEntry = { issue: string; severity: AIFlagSeverity }
const AIFlagsContext = createContext<Record<string, AIFlagEntry>>({})

// ─── Types ──────────────────────────────────────────────────────────────────────
type ClimbPhoto = { id: string; filename: string | null }

type TaperChange = {
  id: string
  baseWidth: string; baseWidthFlagged: boolean
  topWidth: string; topWidthFlagged: boolean
  topElevation: string; topElevationFlagged: boolean; topElevationMarked: boolean
  marked: boolean
}

type ClimbDeficiency = {
  id: string; issue: string; severity: string; notes: string
  photos: ClimbPhoto[]; flagged: boolean; marked: boolean; collapsed: boolean
}

type GroundLead = {
  id: string; notes: string; photos: ClimbPhoto[]
  marked: boolean; flagged: boolean; collapsed: boolean
}

type GuyAttachment = {
  id: string
  guyLevel: string; guyLevelFlagged: boolean; guyLevelMarked: boolean
  elevation: string  // locked
  notes: string; notesFlagged: boolean
  photos: ClimbPhoto[]; marked: boolean; flagged: boolean; collapsed: boolean
}

type MountCenterline = {
  id: string
  elevation: string; elevationFlagged: boolean; elevationMarked: boolean
  antennaType: string; antennaTypeFlagged: boolean; antennaTypeMarked: boolean
  numberOfAntennas: string; numberOfAntennasFlagged: boolean; numberOfAntennasMarked: boolean
  mountType: string; mountTypeFlagged: boolean; mountTypeMarked: boolean
  mountLocation: string; mountLocationFlagged: boolean; mountLocationMarked: boolean
  iceShield: string; iceShieldFlagged: boolean; iceShieldMarked: boolean
  coaxRoute: string; coaxRouteFlagged: boolean; coaxRouteMarked: boolean
  owner: string; ownerMarked: boolean
  notes: string
  photos: ClimbPhoto[]
  equipmentCount: string; equipmentCountMarked: boolean
  marked: boolean; flagged: boolean; collapsed: boolean
}

type Light = {
  id: string
  elevation: string; elevationFlagged: boolean; elevationMarked: boolean
  location: string; locationFlagged: boolean; locationMarked: boolean
  notes: string; notesMarked: boolean
  photos: ClimbPhoto[]; marked: boolean; flagged: boolean; collapsed: boolean
}

type OtherAppurtenance = {
  id: string
  elevation: string; elevationFlagged: boolean; elevationMarked: boolean
  location: string; locationFlagged: boolean; locationMarked: boolean
  iceShield: string; iceShieldFlagged: boolean; iceShieldMarked: boolean
  description: string; descriptionFlagged: boolean; descriptionMarked: boolean
  owner: string; ownerMarked: boolean
  notes: string; photos: ClimbPhoto[]
  marked: boolean; flagged: boolean; collapsed: boolean
}

type CatchAllItem = { id: string; description: string; flagged: boolean; marked: boolean }

type SectionId = 'overview' | 'safety_climb' | 'taper_changes' | 'deficiencies' | 'base_foundation' | 'ground_leads' | 'guy_attachments' | 'mount_centerlines' | 'lights' | 'other_appurtenances' | 'catch_all'

type StructureClimbSurvey = {
  id: string; name: string; siteId: string; siteName: string
  technician: string; technicianEmail: string; customer: string; coordinates: string
  structureType: string; structureTypeFlagged: boolean; structureTypeMarked: boolean
  legs: string; legsFlagged: boolean; legsMarked: boolean
  safetyClimb: string; safetyClimbFlagged: boolean; safetyClimbMarked: boolean
  amSkirt: string; amSkirtFlagged: boolean; amSkirtMarked: boolean
  baseWidth: string; baseWidthFlagged: boolean; baseWidthMarked: boolean
  topSteelWidth: string; topSteelWidthFlagged: boolean; topSteelWidthMarked: boolean
  topSteelElevation: string  // locked — always shown as green
  highestAppurtenance: string; highestAppurtenanceFlagged: boolean; highestAppurtenanceMarked: boolean
  apexElevation: string; apexElevationFlagged: boolean; apexElevationMarked: boolean
  anchorBoltDiameter: string; anchorBoltDiameterFlagged: boolean; anchorBoltDiameterMarked: boolean
  overviewNotes: string; overviewNotesFlagged: boolean; overviewNotesMarked: boolean
  siteLayoutPhotos: ClimbPhoto[]; laserDistancePhotos: ClimbPhoto[]
  topBeacon: string; topBeaconFlagged: boolean; topBeaconMarked: boolean
  topBeaconNotes: string; topBeaconPhotos: ClimbPhoto[]
  lightningProtectionType: string; lightningProtectionFlagged: boolean; lightningProtectionMarked: boolean
  lightningProtectionPhotos: ClimbPhoto[]
  safetyClimbLocation: string; safetyClimbLocationFlagged: boolean; safetyClimbLocationMarked: boolean
  safetyClimbManufacturer: string; safetyClimbManufacturerFlagged: boolean; safetyClimbManufacturerMarked: boolean
  safetyClimbTopHeight: string; safetyClimbTopHeightFlagged: boolean; safetyClimbTopHeightMarked: boolean
  safetyClimbNotes: string; safetyClimbNotesFlagged: boolean; safetyClimbNotesMarked: boolean
  safetyClimbOverviewPhotos: ClimbPhoto[]
  safetyClimbBottomAssemblyPhotos: ClimbPhoto[]
  safetyClimbTopAssemblyPhotos: ClimbPhoto[]
  safetyClimbTopInternalPhotos: ClimbPhoto[]
  taperChanges: TaperChange[]
  deficiencies: ClimbDeficiency[]
  grout: string; groutFlagged: boolean; groutMarked: boolean
  clearDistance: string; clearDistanceFlagged: boolean; clearDistanceMarked: boolean
  clearDistanceNA: boolean
  baseNotes: string; baseNotesFlagged: boolean; baseNotesMarked: boolean
  azimuth0Photos: ClimbPhoto[]; azimuth90Photos: ClimbPhoto[]
  azimuth180Photos: ClimbPhoto[]; azimuth270Photos: ClimbPhoto[]
  groutLevelingPhotos: ClimbPhoto[]
  groundLeads: GroundLead[]
  guyAttachments: GuyAttachment[]
  mountCenterlines: MountCenterline[]
  lights: Light[]
  otherAppurtenances: OtherAppurtenance[]
  catchAll: CatchAllItem[]
}

// ─── Constants ──────────────────────────────────────────────────────────────────
const STRUCTURE_TYPES = ['Guyed', 'Self-support', 'Monopole', 'Lattice', 'Stealth']
const LEGS_OPTIONS = ['N/A', '3', '4']
const APPURTENANCE_TYPES = ['Dipole antenna', 'Yagi', 'Panel antenna', 'Dish antenna', 'Omni antenna', 'Whip antenna', 'GPS antenna', 'None']
const ANTENNA_TYPES = ['Yagi', 'Dipole', 'Panel', 'Dish', 'Whip', 'Omni', 'GPS', 'Sector']
const MOUNT_TYPES = ['Direct', 'Side Mount', 'Top Mount', 'Standoff', 'Pipe Flange']
const MOUNT_LOCATIONS = ['Leg A', 'Leg B', 'Leg C', 'Alpha', 'Beta', 'Gamma', 'East', 'West', 'North', 'South']
const COAX_ROUTES = ['Leg A', 'Leg B', 'Leg C', 'Alpha', 'Beta', 'Gamma', 'External']
const LIGHT_LOCATIONS = ['Top', 'Middle', 'Bottom', 'Alpha', 'Beta', 'Gamma', 'North', 'South', 'East', 'West']
const LIGHTNING_PROTECTION_TYPES = ['None', 'Type A', 'Type B', 'Type C', 'Type D', 'Ground ring']
const SAFETY_CLIMB_MANUFACTURERS = ['Tuf-Tug', 'Lad-Saf', 'Saflok', 'Steplok', 'Roofmaster', 'Tractel', 'Other']
const DEFICIENCY_ISSUES = [
  'Obstruction to lighting system',
  'Guy wire serving not up to standard',
  'Antenna has defect / deformation / missing member / is loose, etc.',
  'Corrosion on structural members',
  'Missing hardware',
  'Damaged climbing facilities',
  'Improper grounding',
  'Other',
]
const SEVERITY_LABELS = ['', 'Critical', 'Moderate', 'Low', 'Minor', 'Informational']

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'overview',           label: 'Structure Overview'    },
  { id: 'safety_climb',       label: 'Safety Climb'          },
  { id: 'taper_changes',      label: 'Taper Changes'         },
  { id: 'deficiencies',       label: 'Deficiencies'          },
  { id: 'base_foundation',    label: 'Structure Base & Foundation' },
  { id: 'ground_leads',       label: 'Ground Leads'          },
  { id: 'guy_attachments',    label: 'Guy Attachments'       },
  { id: 'mount_centerlines',  label: 'Mount Centerlines'     },
  { id: 'lights',             label: 'Lights'                },
  { id: 'other_appurtenances',label: 'Other Appurtenances'   },
  { id: 'catch_all',          label: 'Catch All'             },
]

// ─── Mock data ──────────────────────────────────────────────────────────────────
function makePhoto(id: string, filename: string | null = null): ClimbPhoto {
  return { id, filename }
}

const initialSurvey: StructureClimbSurvey = {
  id: 'survey_climb', name: 'Structure Climb Inspection', siteId: 'TX6100',
  siteName: 'Orange - Claybar', technician: 'Samuel Fagan',
  technicianEmail: 'Samuelf@murphytower.com', customer: 'TowerCo',
  coordinates: '30.23702697, -93.76688727',
  structureType: 'Guyed', structureTypeFlagged: false, structureTypeMarked: true,
  legs: 'N/A', legsFlagged: false, legsMarked: true,
  safetyClimb: 'No', safetyClimbFlagged: false, safetyClimbMarked: true,
  amSkirt: 'No', amSkirtFlagged: false, amSkirtMarked: true,
  baseWidth: '1.5', baseWidthFlagged: false, baseWidthMarked: true,
  topSteelWidth: '1.5', topSteelWidthFlagged: false, topSteelWidthMarked: true,
  topSteelElevation: '315',
  highestAppurtenance: 'Dipole antenna', highestAppurtenanceFlagged: false, highestAppurtenanceMarked: true,
  apexElevation: '315', apexElevationFlagged: false, apexElevationMarked: false,
  anchorBoltDiameter: '', anchorBoltDiameterFlagged: false, anchorBoltDiameterMarked: false,
  overviewNotes: '', overviewNotesFlagged: false, overviewNotesMarked: false,
  siteLayoutPhotos: [], laserDistancePhotos: [],
  topBeacon: 'Yes', topBeaconFlagged: false, topBeaconMarked: true,
  topBeaconNotes: '',
  topBeaconPhotos: [makePhoto('tb_p1', 'top_beacon_01.jpg')],
  lightningProtectionType: 'None', lightningProtectionFlagged: false, lightningProtectionMarked: false,
  lightningProtectionPhotos: [],
  safetyClimbLocation: 'Beta', safetyClimbLocationFlagged: false, safetyClimbLocationMarked: true,
  safetyClimbManufacturer: 'Tuf-Tug', safetyClimbManufacturerFlagged: false, safetyClimbManufacturerMarked: true,
  safetyClimbTopHeight: '98', safetyClimbTopHeightFlagged: false, safetyClimbTopHeightMarked: true,
  safetyClimbNotes: '', safetyClimbNotesFlagged: false, safetyClimbNotesMarked: false,
  safetyClimbOverviewPhotos: [makePhoto('sc_ov_p1', 'safety_climb_overview_01.jpg')],
  safetyClimbBottomAssemblyPhotos: [makePhoto('sc_bot_p1', 'safety_climb_bottom_01.jpg')],
  safetyClimbTopAssemblyPhotos: [makePhoto('sc_top_p1', 'safety_climb_top_01.jpg')],
  safetyClimbTopInternalPhotos: [makePhoto('sc_int_p1', 'safety_climb_internal_01.jpg')],
  taperChanges: [
    {
      id: 'tc_1', baseWidth: '1.5', baseWidthFlagged: false,
      topWidth: '1.5', topWidthFlagged: false,
      topElevation: '315', topElevationFlagged: false, topElevationMarked: true,
      marked: false,
    },
    {
      id: 'tc_2', baseWidth: '', baseWidthFlagged: false,
      topWidth: '', topWidthFlagged: false,
      topElevation: '', topElevationFlagged: false, topElevationMarked: false,
      marked: false,
    },
  ],
  deficiencies: [
    {
      id: 'def_1', issue: 'Obstruction to lighting system', severity: '1', notes: '',
      photos: [makePhoto('def1_p1', 'deficiency_01_a.jpg')],
      flagged: false, marked: false, collapsed: false,
    },
    {
      id: 'def_2', issue: 'Guy wire serving not up to standard', severity: '2', notes: '',
      photos: [makePhoto('def2_p1', 'deficiency_02_a.jpg'), makePhoto('def2_p2', 'deficiency_02_b.jpg')],
      flagged: false, marked: false, collapsed: false,
    },
    {
      id: 'def_3', issue: 'Antenna has defect / deformation / missing member / is loose, etc.', severity: '1', notes: '',
      photos: [makePhoto('def3_p1', 'deficiency_03_a.jpg')],
      flagged: false, marked: false, collapsed: false,
    },
  ],
  grout: 'No', groutFlagged: false, groutMarked: false,
  clearDistance: '', clearDistanceFlagged: false, clearDistanceMarked: true,
  clearDistanceNA: false,
  baseNotes: '', baseNotesFlagged: false, baseNotesMarked: false,
  azimuth0Photos: [], azimuth90Photos: [], azimuth180Photos: [], azimuth270Photos: [],
  groutLevelingPhotos: [],
  groundLeads: [
    {
      id: 'gl_1', notes: '',
      photos: [makePhoto('gl1_p1', 'ground_lead_01.jpg')],
      marked: false, flagged: false, collapsed: false,
    },
  ],
  guyAttachments: [
    { id: 'ga_1', guyLevel: '1', guyLevelFlagged: false, guyLevelMarked: true, elevation: '35', notes: '', notesFlagged: false, photos: [makePhoto('ga1_p1', 'guy_attach_01_a.jpg'), makePhoto('ga1_p2', 'guy_attach_01_b.jpg')], marked: false, flagged: false, collapsed: false },
    { id: 'ga_2', guyLevel: '2', guyLevelFlagged: false, guyLevelMarked: true, elevation: '69', notes: '', notesFlagged: false, photos: [makePhoto('ga2_p1', 'guy_attach_02_a.jpg'), makePhoto('ga2_p2', 'guy_attach_02_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_3', guyLevel: '3', guyLevelFlagged: false, guyLevelMarked: true, elevation: '105', notes: '', notesFlagged: false, photos: [makePhoto('ga3_p1', 'guy_attach_03_a.jpg'), makePhoto('ga3_p2', 'guy_attach_03_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_4', guyLevel: '4', guyLevelFlagged: false, guyLevelMarked: true, elevation: '139', notes: '', notesFlagged: false, photos: [makePhoto('ga4_p1', 'guy_attach_04_a.jpg'), makePhoto('ga4_p2', 'guy_attach_04_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_5', guyLevel: '5', guyLevelFlagged: false, guyLevelMarked: true, elevation: '175', notes: '', notesFlagged: false, photos: [makePhoto('ga5_p1', 'guy_attach_05_a.jpg'), makePhoto('ga5_p2', 'guy_attach_05_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_6', guyLevel: '6', guyLevelFlagged: false, guyLevelMarked: true, elevation: '209', notes: '', notesFlagged: false, photos: [makePhoto('ga6_p1', 'guy_attach_06_a.jpg'), makePhoto('ga6_p2', 'guy_attach_06_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_7', guyLevel: '7', guyLevelFlagged: false, guyLevelMarked: true, elevation: '245', notes: '', notesFlagged: false, photos: [makePhoto('ga7_p1', 'guy_attach_07_a.jpg'), makePhoto('ga7_p2', 'guy_attach_07_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_8', guyLevel: '8', guyLevelFlagged: false, guyLevelMarked: true, elevation: '279', notes: '', notesFlagged: false, photos: [makePhoto('ga8_p1', 'guy_attach_08_a.jpg'), makePhoto('ga8_p2', 'guy_attach_08_b.jpg')], marked: false, flagged: false, collapsed: true },
    { id: 'ga_9', guyLevel: '9', guyLevelFlagged: false, guyLevelMarked: true, elevation: '316', notes: '', notesFlagged: false, photos: [makePhoto('ga9_p1', 'guy_attach_09_a.jpg'), makePhoto('ga9_p2', 'guy_attach_09_b.jpg')], marked: false, flagged: false, collapsed: true },
  ],
  mountCenterlines: [
    {
      id: 'mc_1', elevation: '74', elevationFlagged: false, elevationMarked: true,
      antennaType: 'Yagi', antennaTypeFlagged: false, antennaTypeMarked: true,
      numberOfAntennas: '', numberOfAntennasFlagged: false, numberOfAntennasMarked: false,
      mountType: 'Direct', mountTypeFlagged: false, mountTypeMarked: true,
      mountLocation: 'Leg B', mountLocationFlagged: false, mountLocationMarked: true,
      iceShield: 'No', iceShieldFlagged: false, iceShieldMarked: true,
      coaxRoute: 'Leg B', coaxRouteFlagged: false, coaxRouteMarked: true,
      owner: 'Unknown', ownerMarked: false,
      notes: '',
      photos: [makePhoto('mc1_p1', 'mount_01_a.jpg')],
      equipmentCount: '', equipmentCountMarked: false,
      marked: false, flagged: false, collapsed: false,
    },
    {
      id: 'mc_2', elevation: '105', elevationFlagged: false, elevationMarked: true,
      antennaType: 'Yagi', antennaTypeFlagged: false, antennaTypeMarked: true,
      numberOfAntennas: '', numberOfAntennasFlagged: false, numberOfAntennasMarked: false,
      mountType: 'Direct', mountTypeFlagged: false, mountTypeMarked: true,
      mountLocation: 'Leg A', mountLocationFlagged: false, mountLocationMarked: true,
      iceShield: '', iceShieldFlagged: false, iceShieldMarked: false,
      coaxRoute: '', coaxRouteFlagged: false, coaxRouteMarked: false,
      owner: '', ownerMarked: false,
      notes: '', photos: [],
      equipmentCount: '', equipmentCountMarked: false,
      marked: false, flagged: false, collapsed: true,
    },
    {
      id: 'mc_3', elevation: '140', elevationFlagged: false, elevationMarked: true,
      antennaType: 'Panel', antennaTypeFlagged: false, antennaTypeMarked: true,
      numberOfAntennas: '', numberOfAntennasFlagged: false, numberOfAntennasMarked: false,
      mountType: 'Side Mount', mountTypeFlagged: false, mountTypeMarked: true,
      mountLocation: 'Alpha', mountLocationFlagged: false, mountLocationMarked: true,
      iceShield: '', iceShieldFlagged: false, iceShieldMarked: false,
      coaxRoute: '', coaxRouteFlagged: false, coaxRouteMarked: false,
      owner: '', ownerMarked: false,
      notes: '', photos: [],
      equipmentCount: '', equipmentCountMarked: false,
      marked: false, flagged: false, collapsed: true,
    },
  ],
  lights: [
    {
      id: 'lt_1', elevation: '160', elevationFlagged: false, elevationMarked: true,
      location: '', locationFlagged: false, locationMarked: false,
      notes: '', notesMarked: false,
      photos: [makePhoto('lt1_p1', 'light_01_a.jpg')],
      marked: false, flagged: false, collapsed: false,
    },
  ],
  otherAppurtenances: [
    {
      id: 'oa_1', elevation: '253', elevationFlagged: false, elevationMarked: true,
      location: 'Alpha', locationFlagged: false, locationMarked: true,
      iceShield: 'No', iceShieldFlagged: false, iceShieldMarked: true,
      description: 'Lighting box', descriptionFlagged: false, descriptionMarked: true,
      owner: 'Unknown', ownerMarked: false,
      notes: '',
      photos: [makePhoto('oa1_p1', 'other_app_01_a.jpg')],
      marked: false, flagged: false, collapsed: false,
    },
    {
      id: 'oa_2', elevation: '314.5', elevationFlagged: false, elevationMarked: false,
      location: '', locationFlagged: false, locationMarked: false,
      iceShield: '', iceShieldFlagged: false, iceShieldMarked: false,
      description: '', descriptionFlagged: false, descriptionMarked: false,
      owner: '', ownerMarked: false,
      notes: '', photos: [],
      marked: false, flagged: false, collapsed: true,
    },
  ],
  catchAll: [],
}

// ─── Progress helpers ────────────────────────────────────────────────────────────
function getSectionProgress(id: SectionId, s: StructureClimbSurvey): { marked: number; total: number; pct: number } {
  let marked = 0, total = 0
  if (id === 'overview') {
    const bools = [
      s.structureTypeMarked, s.legsMarked, s.safetyClimbMarked, s.amSkirtMarked,
      s.baseWidthMarked, s.topSteelWidthMarked, s.highestAppurtenanceMarked,
      s.apexElevationMarked, s.anchorBoltDiameterMarked, s.topBeaconMarked, s.lightningProtectionMarked,
    ]
    total = bools.length
    marked = bools.filter(Boolean).length
  } else if (id === 'safety_climb') {
    const bools = [s.safetyClimbLocationMarked, s.safetyClimbManufacturerMarked, s.safetyClimbTopHeightMarked, s.safetyClimbNotesMarked]
    total = bools.length; marked = bools.filter(Boolean).length
  } else if (id === 'taper_changes') {
    total = s.taperChanges.length
    marked = s.taperChanges.filter(t => t.marked).length
  } else if (id === 'deficiencies') {
    total = s.deficiencies.length
    marked = s.deficiencies.filter(d => d.marked).length
  } else if (id === 'base_foundation') {
    const bools = [s.groutMarked, s.clearDistanceMarked, s.baseNotesMarked]
    total = bools.length
    marked = bools.filter(Boolean).length
  } else if (id === 'ground_leads') {
    total = s.groundLeads.length
    marked = s.groundLeads.filter(g => g.marked).length
  } else if (id === 'guy_attachments') {
    total = s.guyAttachments.length
    marked = s.guyAttachments.filter(g => g.marked).length
  } else if (id === 'mount_centerlines') {
    total = s.mountCenterlines.length
    marked = s.mountCenterlines.filter(m => m.marked).length
  } else if (id === 'lights') {
    total = s.lights.length
    marked = s.lights.filter(l => l.marked).length
  } else if (id === 'other_appurtenances') {
    total = s.otherAppurtenances.length
    marked = s.otherAppurtenances.filter(o => o.marked).length
  } else if (id === 'catch_all') {
    total = s.catchAll.length
    marked = s.catchAll.filter(c => c.marked).length
  }
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getSectionFlagCount(id: SectionId, s: StructureClimbSurvey): number {
  if (id === 'overview') {
    return [s.structureTypeFlagged, s.legsFlagged, s.safetyClimbFlagged, s.amSkirtFlagged,
      s.baseWidthFlagged, s.topSteelWidthFlagged, s.highestAppurtenanceFlagged,
      s.apexElevationFlagged, s.anchorBoltDiameterFlagged, s.overviewNotesFlagged,
      s.topBeaconFlagged, s.lightningProtectionFlagged,
    ].filter(Boolean).length
  }
  if (id === 'safety_climb') return [s.safetyClimbLocationFlagged, s.safetyClimbManufacturerFlagged, s.safetyClimbTopHeightFlagged, s.safetyClimbNotesFlagged].filter(Boolean).length
  if (id === 'taper_changes') return s.taperChanges.filter(t => t.baseWidthFlagged || t.topWidthFlagged || t.topElevationFlagged).length
  if (id === 'deficiencies') return s.deficiencies.filter(d => d.flagged).length
  if (id === 'base_foundation') return [s.groutFlagged, s.clearDistanceFlagged, s.baseNotesFlagged].filter(Boolean).length
  if (id === 'ground_leads') return s.groundLeads.filter(g => g.flagged).length
  if (id === 'guy_attachments') return s.guyAttachments.filter(g => g.flagged || g.guyLevelFlagged || g.notesFlagged).length
  if (id === 'mount_centerlines') return s.mountCenterlines.filter(m => m.flagged).length
  if (id === 'lights') return s.lights.filter(l => l.flagged).length
  if (id === 'other_appurtenances') return s.otherAppurtenances.filter(o => o.flagged).length
  return 0
}

function getOverallProgress(s: StructureClimbSurvey): { marked: number; total: number; pct: number; flagCount: number } {
  let marked = 0, total = 0
  SECTIONS.forEach(sec => {
    const p = getSectionProgress(sec.id, s)
    marked += p.marked; total += p.total
  })
  const flagCount = SECTIONS.reduce((a, sec) => a + getSectionFlagCount(sec.id, s), 0)
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0, flagCount }
}

// ─── ClimbFieldRow ───────────────────────────────────────────────────────────────
function ClimbFieldRow({
  label, flagged, marked, locked, required, onFlag, onMark, children,
}: {
  label: string
  flagged?: boolean
  marked?: boolean
  locked?: boolean
  required?: boolean
  onFlag?: () => void
  onMark?: () => void
  children: React.ReactNode
}) {
  const isGreen = locked || marked
  const barColor = locked || marked ? 'bg-green-600' : flagged ? 'bg-red-600' : 'bg-nav-gray'
  const rowBg = flagged ? 'bg-red-600/[0.03]' : marked ? 'bg-green-600/[0.03]' : ''
  return (
    <div className={clsx('flex items-stretch min-h-[44px] transition-colors', rowBg)}>
      <div className={clsx('w-[3px] flex-shrink-0 my-2 ml-1 rounded-full', barColor)} />
      <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2">
        <span className={clsx('text-xs font-semibold flex-shrink-0 w-44', isGreen ? 'text-green-700' : flagged ? 'text-red-700' : 'text-std-gray-lm')}>
          {label}
          {required && <span className="ml-1 text-[9px] font-bold text-amber-600 border border-amber-500/40 bg-amber-500/8 rounded px-1 py-0.5 align-middle">REQ</span>}
        </span>
        <div className="flex-1 min-w-0">{children}</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onFlag && (
            <button
              onClick={onFlag}
              className={clsx('p-1.5 rounded border transition-colors', flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}
            ><Flag size={11} /></button>
          )}
          {locked ? (
            <div className="p-1.5 rounded border border-green-600/30 text-green-600 bg-green-600/10 cursor-default">
              <Lock size={11} />
            </div>
          ) : onMark ? (
            <button
              onClick={onMark}
              className={clsx('p-1.5 rounded border transition-colors', marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}
            ><Check size={11} /></button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── YesNoToggle ─────────────────────────────────────────────────────────────────
function YesNoToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-nav-gray overflow-hidden">
      {['Yes', 'No'].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(value === opt ? '' : opt)}
          className={clsx('px-3 py-1 text-xs font-semibold transition-colors', value === opt ? 'bg-teal-400/15 text-teal-700' : 'text-std-gray-lm hover:bg-hover-gray-lm')}
        >{opt}</button>
      ))}
    </div>
  )
}

// ─── PhotoStrip ──────────────────────────────────────────────────────────────────
function PhotoStrip({
  photos, onAdd, onRemove,
}: {
  photos: ClimbPhoto[]
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const visible = photos.filter(p => p.filename !== null)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visible.map(p => (
        <div key={p.id} className="relative group/photo w-14 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-nav-gray flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0">
          <FileImage size={16} className="text-teal-400/70" />
          <button
            onClick={() => onRemove(p.id)}
            className="absolute inset-0 rounded-lg bg-red-600/80 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity"
          ><Trash2 size={12} className="text-white" /></button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-14 h-10 rounded-lg border-2 border-dashed border-nav-gray flex items-center justify-center text-std-gray-dm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors flex-shrink-0"
      ><Camera size={14} /></button>
    </div>
  )
}


// ─── PhotoCell ───────────────────────────────────────────────────────────────────
function PhotoCell({ photos, onAdd }: { photos: ClimbPhoto[]; onAdd: () => void }) {
  const count = photos.filter(p => p.filename).length
  return (
    <div className="flex items-center gap-1.5">
      {count > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] bg-teal-400/15 text-teal-700 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
          <FileImage size={8} /> {count}
        </span>
      )}
      <button
        onClick={onAdd}
        className="p-1 rounded border border-nav-gray text-std-gray-lm hover:text-teal-500 hover:border-teal-400 hover:bg-teal-400/5 transition-colors flex-shrink-0"
      ><Camera size={11} /></button>
    </div>
  )
}

// ─── ItemAccordion ────────────────────────────────────────────────────────────────
function ItemAccordion({
  title, photoCount, flagCount, collapsed, onToggle, onRemove, children,
}: {
  title: string
  photoCount: number
  flagCount: number
  collapsed: boolean
  onToggle: () => void
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className={clsx(flagCount > 0 && 'bg-red-600/[0.02]')}>
      <div
        className={clsx('flex items-center justify-between px-5 py-3 cursor-pointer transition-colors', collapsed ? 'hover:bg-hover-gray-lm' : 'bg-hover-gray-lm/50')}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown size={14} className={clsx('text-std-gray-lm transition-transform duration-200 flex-shrink-0', collapsed && '-rotate-90')} />
          <span className="text-sm font-semibold text-black truncate">{title}</span>
          {photoCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] bg-teal-400/15 text-teal-700 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
              <FileImage size={8} /> {photoCount}
            </span>
          )}
          {flagCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-600/10 rounded-full px-1.5 py-0.5 font-semibold border border-red-600/20 flex-shrink-0">
              <Flag size={8} /> {flagCount}
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded-full text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 transition-colors flex-shrink-0 ml-2 border border-transparent hover:border-red-600/20"
        ><Minus size={13} /></button>
      </div>
      {!collapsed && (
        <div className="border-t border-nav-gray/40">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── SeverityPicker ───────────────────────────────────────────────────────────────
function SeverityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const active = ['', 'bg-red-600 border-red-600 text-white', 'bg-orange-500 border-orange-500 text-white', 'bg-amber-500 border-amber-500 text-white', 'bg-lime-500 border-lime-500 text-white', 'bg-green-600 border-green-600 text-white']
  const hover  = ['', 'hover:border-red-600 hover:text-red-600', 'hover:border-orange-500 hover:text-orange-600', 'hover:border-amber-500 hover:text-amber-600', 'hover:border-lime-500 hover:text-lime-600', 'hover:border-green-600 hover:text-green-600']
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(value === String(n) ? '' : String(n))}
          className={clsx('h-8 px-2.5 rounded-lg text-xs font-bold border-2 transition-colors', value === String(n) ? active[n] : `border-nav-gray bg-bg-gray-lm text-std-gray-lm ${hover[n]}`)}
          title={SEVERITY_LABELS[n]}
        >
          {n}
        </button>
      ))}
      {value && <span className="text-xs text-std-gray-lm font-medium">{SEVERITY_LABELS[parseInt(value)] ?? ''}</span>}
    </div>
  )
}

// ─── DefFieldRow ─────────────────────────────────────────────────────────────────
function DefFieldRow({ label, flagged, marked, children }: {
  label: string; flagged: boolean; marked: boolean; children: React.ReactNode
}) {
  const rowBg = flagged ? 'bg-red-600/5' : marked ? 'bg-green-600/[0.04]' : 'bg-white'
  return (
    <div className={clsx('transition-colors', rowBg)}>
      <div className="flex items-stretch gap-3 px-6">
        <div className={clsx('w-[3px] flex-shrink-0 rounded-full my-3 transition-colors', marked ? 'bg-green-600' : 'bg-red-600')} />
        <div className="flex-1 min-w-0 py-3">
          <p className={clsx('text-sm font-semibold mb-2', marked ? 'text-std-gray-lm' : 'text-black')}>{label}</p>
          <div className={clsx('rounded-lg border transition-all', marked ? 'border-green-600/20 bg-green-600/[0.03]' : 'border-nav-gray bg-white')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DeficiencyAccordion ──────────────────────────────────────────────────────────
function DeficiencyAccordion({
  item, onUpdate, onRemove,
}: {
  item: ClimbDeficiency
  onUpdate: (patch: Partial<ClimbDeficiency>) => void
  onRemove: () => void
}) {
  const photoCount = item.photos.filter(p => p.filename).length
  return (
    <div id={`def_${item.id}`} className={clsx(item.flagged && 'bg-red-600/[0.02]')}>
      {/* Header */}
      <div
        className={clsx('flex items-center justify-between px-6 py-3 cursor-pointer transition-colors', item.collapsed ? 'hover:bg-hover-gray-lm' : 'bg-hover-gray-lm/50')}
        onClick={() => onUpdate({ collapsed: !item.collapsed })}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown size={14} className={clsx('text-std-gray-lm transition-transform duration-200 flex-shrink-0', item.collapsed && '-rotate-90')} />
          <span className={clsx('text-sm font-semibold truncate', item.marked ? 'text-green-600' : 'text-black')}>
            {item.issue || 'New Deficiency'}
          </span>
          {item.flagged && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-1.5 py-0.5 flex-shrink-0">
              <Flag size={8} />Flagged
            </span>
          )}
          {photoCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-std-gray-lm bg-bg-gray-lm border border-nav-gray rounded-full px-2 py-0.5 flex-shrink-0">
              <FileImage size={9} />{photoCount}
            </span>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onRemove() }} className="p-1.5 rounded-lg text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 transition-colors flex-shrink-0 ml-3">
          <Minus size={13} />
        </button>
      </div>
      {/* Expanded content */}
      {!item.collapsed && (
        <div className="border-t border-nav-gray/40 divide-y divide-nav-gray/30">
          <DefFieldRow label="Issue" flagged={item.flagged} marked={item.marked}>
            <select value={item.issue} onChange={e => onUpdate({ issue: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none text-black">
              <option value="">— Select issue —</option>
              {DEFICIENCY_ISSUES.map(i => <option key={i}>{i}</option>)}
            </select>
          </DefFieldRow>
          <DefFieldRow label="Severity" flagged={item.flagged} marked={item.marked}>
            <div className="px-3 py-2.5">
              <SeverityPicker value={item.severity} onChange={v => onUpdate({ severity: v })} />
            </div>
          </DefFieldRow>
          <DefFieldRow label="Notes" flagged={item.flagged} marked={item.marked}>
            <textarea value={item.notes} onChange={e => onUpdate({ notes: e.target.value })}
              placeholder="Add notes…" rows={2}
              className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none resize-none" />
          </DefFieldRow>
          <DefFieldRow label="Photos" flagged={item.flagged} marked={item.marked}>
            <div className="px-3 py-3">
              {photoCount > 0 ? (
                <div className="space-y-2">
                  {item.photos.filter(p => p.filename).map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-bg-gray-lm border border-nav-gray flex items-center justify-center flex-shrink-0">
                        <FileImage size={18} className="text-std-gray-lm" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400 font-medium">{p.filename}</p>
                        <button
                          onClick={() => onUpdate({ photos: [...item.photos, makePhoto(`def_p_${Date.now()}`, `photo_${item.photos.length + 1}.jpg`)] })}
                          className="text-[11px] text-std-gray-lm hover:text-black mt-0.5 flex items-center gap-1">
                          <Plus size={10} /> Add another
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => onUpdate({ photos: [...item.photos, makePhoto(`def_p_${Date.now()}`, `photo_${item.photos.length + 1}.jpg`)] })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
                  <Plus size={14} /> Upload photo
                </button>
              )}
            </div>
          </DefFieldRow>
          <div className="px-6 py-2.5 flex items-center gap-2 bg-hover-gray-lm/30">
            <button onClick={() => onUpdate({ flagged: !item.flagged })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', item.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
              <Flag size={12} />{item.flagged ? 'Flagged' : 'Flag'}
            </button>
            <button onClick={() => onUpdate({ marked: !item.marked })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', item.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
              <Check size={12} />{item.marked ? 'Marked' : 'Mark Reviewed'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function StructureClimbQCPage() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<StructureClimbSurvey>(initialSurvey)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [rightTab, setRightTab] = useState<'flags' | 'ai' | null>(null)
  const [aiFlags, setAiFlags] = useState<Record<string, AIFlagEntry>>({})
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)
  const [activeDeficiencyId, setActiveDeficiencyId] = useState<string | null>(null)
  const [activeOverviewSub, setActiveOverviewSub] = useState<'details' | 'photos' | 'top_beacon' | 'lightning'>('details')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { setLastSavedAt(new Date()); setSaveState('saved') }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [survey])

  const activeSection = SECTIONS[activeSectionIdx]
  const { marked: totalMarked, total: totalFields, pct: overallPct, flagCount: totalFlags } = getOverallProgress(survey)
  const secProgress = getSectionProgress(activeSection.id, survey)
  const secFlags    = getSectionFlagCount(activeSection.id, survey)
  const allCurrentChecked = secProgress.total > 0 && secProgress.marked === secProgress.total

  // ── survey updaters ──────────────────────────────────────────────────────────
  const patchSurvey = useCallback((patch: Partial<StructureClimbSurvey>) => {
    setSurvey(prev => ({ ...prev, ...patch }))
  }, [])

  const updateDeficiency = useCallback((id: string, patch: Partial<ClimbDeficiency>) =>
    setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.map(d => d.id === id ? { ...d, ...patch } : d) })), [])
  const removeDeficiency = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.filter(d => d.id !== id) })), [])
  const addDeficiency = useCallback(() =>
    setSurvey(prev => ({ ...prev, deficiencies: [...prev.deficiencies, { id: `def_${Date.now()}`, issue: '', severity: '', notes: '', photos: [], flagged: false, marked: false, collapsed: false }] })), [])

  const updateGroundLead = useCallback((id: string, patch: Partial<GroundLead>) =>
    setSurvey(prev => ({ ...prev, groundLeads: prev.groundLeads.map(g => g.id === id ? { ...g, ...patch } : g) })), [])
  const removeGroundLead = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, groundLeads: prev.groundLeads.filter(g => g.id !== id) })), [])
  const addGroundLead = useCallback(() =>
    setSurvey(prev => ({ ...prev, groundLeads: [...prev.groundLeads, { id: `gl_${Date.now()}`, notes: '', photos: [], marked: false, flagged: false, collapsed: false }] })), [])

  const updateGuyAttachment = useCallback((id: string, patch: Partial<GuyAttachment>) =>
    setSurvey(prev => ({ ...prev, guyAttachments: prev.guyAttachments.map(g => g.id === id ? { ...g, ...patch } : g) })), [])
  const removeGuyAttachment = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, guyAttachments: prev.guyAttachments.filter(g => g.id !== id) })), [])
  const addGuyAttachment = useCallback(() =>
    setSurvey(prev => ({ ...prev, guyAttachments: [...prev.guyAttachments, { id: `ga_${Date.now()}`, guyLevel: '', guyLevelFlagged: false, guyLevelMarked: false, elevation: '', notes: '', notesFlagged: false, photos: [], marked: false, flagged: false, collapsed: false }] })), [])

  const updateMountCenterline = useCallback((id: string, patch: Partial<MountCenterline>) =>
    setSurvey(prev => ({ ...prev, mountCenterlines: prev.mountCenterlines.map(m => m.id === id ? { ...m, ...patch } : m) })), [])
  const removeMountCenterline = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, mountCenterlines: prev.mountCenterlines.filter(m => m.id !== id) })), [])
  const addMountCenterline = useCallback(() =>
    setSurvey(prev => ({ ...prev, mountCenterlines: [...prev.mountCenterlines, { id: `mc_${Date.now()}`, elevation: '', elevationFlagged: false, elevationMarked: false, antennaType: '', antennaTypeFlagged: false, antennaTypeMarked: false, numberOfAntennas: '', numberOfAntennasFlagged: false, numberOfAntennasMarked: false, mountType: '', mountTypeFlagged: false, mountTypeMarked: false, mountLocation: '', mountLocationFlagged: false, mountLocationMarked: false, iceShield: '', iceShieldFlagged: false, iceShieldMarked: false, coaxRoute: '', coaxRouteFlagged: false, coaxRouteMarked: false, owner: '', ownerMarked: false, notes: '', photos: [], equipmentCount: '', equipmentCountMarked: false, marked: false, flagged: false, collapsed: false }] })), [])

  const updateLight = useCallback((id: string, patch: Partial<Light>) =>
    setSurvey(prev => ({ ...prev, lights: prev.lights.map(l => l.id === id ? { ...l, ...patch } : l) })), [])
  const removeLight = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, lights: prev.lights.filter(l => l.id !== id) })), [])
  const addLight = useCallback(() =>
    setSurvey(prev => ({ ...prev, lights: [...prev.lights, { id: `lt_${Date.now()}`, elevation: '', elevationFlagged: false, elevationMarked: false, location: '', locationFlagged: false, locationMarked: false, notes: '', notesMarked: false, photos: [], marked: false, flagged: false, collapsed: false }] })), [])

  const updateOtherAppurtenance = useCallback((id: string, patch: Partial<OtherAppurtenance>) =>
    setSurvey(prev => ({ ...prev, otherAppurtenances: prev.otherAppurtenances.map(o => o.id === id ? { ...o, ...patch } : o) })), [])
  const removeOtherAppurtenance = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, otherAppurtenances: prev.otherAppurtenances.filter(o => o.id !== id) })), [])
  const addOtherAppurtenance = useCallback(() =>
    setSurvey(prev => ({ ...prev, otherAppurtenances: [...prev.otherAppurtenances, { id: `oa_${Date.now()}`, elevation: '', elevationFlagged: false, elevationMarked: false, location: '', locationFlagged: false, locationMarked: false, iceShield: '', iceShieldFlagged: false, iceShieldMarked: false, description: '', descriptionFlagged: false, descriptionMarked: false, owner: '', ownerMarked: false, notes: '', photos: [], marked: false, flagged: false, collapsed: false }] })), [])

  function goPrev() { if (activeSectionIdx > 0) setActiveSectionIdx(activeSectionIdx - 1) }
  function goNext() { if (activeSectionIdx < SECTIONS.length - 1) setActiveSectionIdx(activeSectionIdx + 1) }
  function getPrevLabel() { return activeSectionIdx > 0 ? SECTIONS[activeSectionIdx - 1].label : 'Previous' }
  function getNextLabel() { return activeSectionIdx < SECTIONS.length - 1 ? SECTIONS[activeSectionIdx + 1].label : 'Next' }

  function markAllChecked() {
    const id = activeSection.id
    if (id === 'overview') {
      patchSurvey({
        structureTypeMarked: !survey.structureTypeFlagged || survey.structureTypeMarked,
        legsMarked: !survey.legsFlagged || survey.legsMarked,
        safetyClimbMarked: !survey.safetyClimbFlagged || survey.safetyClimbMarked,
        amSkirtMarked: !survey.amSkirtFlagged || survey.amSkirtMarked,
        baseWidthMarked: !survey.baseWidthFlagged || survey.baseWidthMarked,
        topSteelWidthMarked: !survey.topSteelWidthFlagged || survey.topSteelWidthMarked,
        highestAppurtenanceMarked: !survey.highestAppurtenanceFlagged || survey.highestAppurtenanceMarked,
        apexElevationMarked: !survey.apexElevationFlagged || survey.apexElevationMarked,
        anchorBoltDiameterMarked: !survey.anchorBoltDiameterFlagged || survey.anchorBoltDiameterMarked,
        topBeaconMarked: !survey.topBeaconFlagged || survey.topBeaconMarked,
        lightningProtectionMarked: !survey.lightningProtectionFlagged || survey.lightningProtectionMarked,
      })
    } else if (id === 'safety_climb') {
      patchSurvey({
        safetyClimbLocationMarked: true, safetyClimbManufacturerMarked: true,
        safetyClimbTopHeightMarked: true, safetyClimbNotesMarked: true,
      })
    } else if (id === 'taper_changes') {
      setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => ({ ...t, marked: true })) }))
    } else if (id === 'deficiencies') {
      setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.map(d => d.flagged ? d : { ...d, marked: true }) }))
    } else if (id === 'base_foundation') {
      patchSurvey({ groutMarked: true, clearDistanceMarked: true, baseNotesMarked: true })
    } else if (id === 'ground_leads') {
      setSurvey(prev => ({ ...prev, groundLeads: prev.groundLeads.map(g => g.flagged ? g : { ...g, marked: true }) }))
    } else if (id === 'guy_attachments') {
      setSurvey(prev => ({ ...prev, guyAttachments: prev.guyAttachments.map(g => g.flagged ? g : { ...g, marked: true }) }))
    } else if (id === 'mount_centerlines') {
      setSurvey(prev => ({ ...prev, mountCenterlines: prev.mountCenterlines.map(m => m.flagged ? m : { ...m, marked: true }) }))
    } else if (id === 'lights') {
      setSurvey(prev => ({ ...prev, lights: prev.lights.map(l => l.flagged ? l : { ...l, marked: true }) }))
    } else if (id === 'other_appurtenances') {
      setSurvey(prev => ({ ...prev, otherAppurtenances: prev.otherAppurtenances.map(o => o.flagged ? o : { ...o, marked: true }) }))
    } else if (id === 'catch_all') {
      setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.flagged ? c : { ...c, marked: true }) }))
    }
  }

  // ── flag list for slide-over ──────────────────────────────────────────────────
  const flagList: { label: string; location: string }[] = []
  if (survey.structureTypeFlagged) flagList.push({ label: 'Structure Type', location: 'Structure Overview' })
  if (survey.legsFlagged) flagList.push({ label: 'Legs', location: 'Structure Overview' })
  if (survey.safetyClimbFlagged) flagList.push({ label: 'Safety Climb', location: 'Structure Overview' })
  if (survey.amSkirtFlagged) flagList.push({ label: 'AM Skirt', location: 'Structure Overview' })
  if (survey.baseWidthFlagged) flagList.push({ label: 'Base Width', location: 'Structure Overview' })
  if (survey.topSteelWidthFlagged) flagList.push({ label: 'Top Steel Width', location: 'Structure Overview' })
  if (survey.highestAppurtenanceFlagged) flagList.push({ label: 'Highest Appurtenance', location: 'Structure Overview' })
  if (survey.apexElevationFlagged) flagList.push({ label: 'Apex Elevation', location: 'Structure Overview' })
  if (survey.topBeaconFlagged) flagList.push({ label: 'Top Beacon', location: 'Structure Overview' })
  if (survey.lightningProtectionFlagged) flagList.push({ label: 'Lightning Protection', location: 'Structure Overview' })
  if (survey.safetyClimbLocationFlagged) flagList.push({ label: 'SC Location', location: 'Safety Climb' })
  if (survey.safetyClimbManufacturerFlagged) flagList.push({ label: 'SC Manufacturer', location: 'Safety Climb' })
  if (survey.safetyClimbTopHeightFlagged) flagList.push({ label: 'SC Top Height', location: 'Safety Climb' })
  survey.deficiencies.forEach(d => { if (d.flagged) flagList.push({ label: d.issue || 'Deficiency', location: 'Deficiencies' }) })
  if (survey.groutFlagged) flagList.push({ label: 'Grout', location: 'Structure Base & Foundation' })
  if (survey.clearDistanceFlagged) flagList.push({ label: 'Clear Distance', location: 'Structure Base & Foundation' })
  survey.groundLeads.forEach((g, i) => { if (g.flagged) flagList.push({ label: `Ground Lead ${i + 1}`, location: 'Ground Leads' }) })
  survey.guyAttachments.forEach(g => { if (g.flagged || g.guyLevelFlagged) flagList.push({ label: `Guy Attachment ${g.guyLevel} (${g.elevation} ft)`, location: 'Guy Attachments' }) })
  survey.mountCenterlines.forEach(m => { if (m.flagged) flagList.push({ label: `Mount - ${m.elevation} ft`, location: 'Mount Centerlines' }) })
  survey.lights.forEach(l => { if (l.flagged) flagList.push({ label: `Light - ${l.elevation} ft`, location: 'Lights' }) })
  survey.otherAppurtenances.forEach(o => { if (o.flagged) flagList.push({ label: `Appurtenance - ${o.elevation} ft`, location: 'Other Appurtenances' }) })

  const filteredSections = SECTIONS.filter(s => !navSearch || s.label.toLowerCase().includes(navSearch.toLowerCase()))
  const sectionsCompleted = SECTIONS.filter(s => { const { marked, total } = getSectionProgress(s.id, survey); return total > 0 && marked === total }).length
  const aiIssueCount = Object.keys(aiFlags).length

  function runAIAnalysis() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const newFlags: Record<string, AIFlagEntry> = {}
      if (!survey.anchorBoltDiameter) newFlags['anchorBoltDiameter'] = { issue: 'Anchor bolt diameter is required before finalizing the survey.', severity: 'error' }
      if (!survey.apexElevation) newFlags['apexElevation'] = { issue: 'Apex elevation field has no value. Must be completed.', severity: 'error' }
      if (survey.topSteelElevation !== survey.apexElevation && survey.apexElevation) {
        newFlags['apexElevationCheck'] = { issue: `Apex elevation (${survey.apexElevation}) differs from top steel elevation (${survey.topSteelElevation}). Verify this is correct.`, severity: 'warning' }
      }
      if (survey.deficiencies.some(d => !d.severity)) newFlags['deficiency_severity'] = { issue: 'One or more deficiencies are missing a severity rating.', severity: 'warning' }
      if (survey.mountCenterlines.length > 0 && survey.mountCenterlines.some(m => !m.owner)) {
        newFlags['mount_owner'] = { issue: 'Some mount centerlines are missing an owner. Verify ownership before finalizing.', severity: 'suggestion' }
      }
      setAiFlags(newFlags)
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2000)
  }

  // ── Input field class ─────────────────────────────────────────────────────────
  const inputCls = 'w-full px-2.5 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors'
  const selectCls = 'w-full px-2.5 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors'

  return (
    <AIFlagsContext.Provider value={aiFlags}>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-nav-gray flex-shrink-0">
        <div className="flex items-center h-11 px-2 gap-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm transition-colors flex-shrink-0"><ArrowLeft size={15} /></button>
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
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', rightTab === 'flags' ? 'bg-red-600/10 text-red-600' : totalFlags > 0 ? 'text-red-600 hover:bg-red-600/8' : 'text-std-gray-lm hover:bg-hover-gray-lm')}>
              <Flag size={13} /><span className="hidden lg:inline">Flags</span>
              {totalFlags > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'flags' ? 'bg-red-600 text-white' : 'bg-red-600/15 text-red-600')}>{totalFlags}</span>}
            </button>
            <button
              onClick={() => setRightTab(rightTab === 'ai' ? null : 'ai')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', rightTab === 'ai' ? 'bg-purple-600/10 text-purple-600' : 'text-purple-600 hover:bg-purple-600/8')}
            >
              <Sparkles size={13} />
              <span className="hidden lg:inline">AI Analysis</span>
              {aiAnalyzed && aiIssueCount > 0 && (
                <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-purple-600/15 text-purple-600')}>{aiIssueCount}</span>
              )}
            </button>
            <div className={clsx('hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300', saveState === 'saving' ? 'text-std-gray-lm' : saveState === 'saved' ? 'text-green-600' : 'text-std-gray-dm')}>
              {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveState === 'saved' && lastSavedAt && <><CheckCheck size={11} /> {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>}
            </div>
            <div className="h-5 w-px bg-nav-gray mx-1.5 flex-shrink-0" />
            <button onClick={() => setCompletionModalOpen(true)} disabled={surveyComplete} className={clsx('btn-success text-xs px-3 py-1.5', surveyComplete && 'opacity-60 cursor-default')}>
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
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Sections</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-2.5 py-1.5">
              <Search size={12} className="text-std-gray-lm flex-shrink-0" />
              <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Filter sections…" className="bg-transparent text-xs text-black placeholder-std-gray-lm outline-none w-full" />
              {navSearch && <button onClick={() => setNavSearch('')} className="text-std-gray-lm hover:text-black transition-colors flex-shrink-0"><X size={11} /></button>}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {filteredSections.map(sec => {
              const { marked, total, pct } = getSectionProgress(sec.id, survey)
              const flags    = getSectionFlagCount(sec.id, survey)
              const isActive = sec.id === activeSection.id
              const isDone   = total > 0 && marked === total
              return (
                <div key={sec.id} className={clsx('mx-1 rounded-lg transition-all border mb-px', isActive ? 'bg-teal-900/8 border-teal-400/35 shadow-sm' : 'border-transparent')}>
                  <button
                    onClick={() => setActiveSectionIdx(SECTIONS.findIndex(s => s.id === sec.id))}
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
                  {sec.id === 'overview' && (
                    <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1 space-y-px">
                      {([
                        { id: 'details' as const,    label: 'Details' },
                        { id: 'photos' as const,     label: 'Photos' },
                        { id: 'top_beacon' as const, label: 'Top Beacon' },
                        { id: 'lightning' as const,  label: 'Lightning Protection' },
                      ]).map(sub => {
                        const isSelected = isActive && activeOverviewSub === sub.id
                        return (
                          <div key={sub.id}
                            onClick={e => {
                              e.stopPropagation()
                              setActiveSectionIdx(SECTIONS.findIndex(s => s.id === 'overview'))
                              setActiveOverviewSub(sub.id)
                            }}
                            className={clsx('px-2 py-1.5 rounded-md cursor-pointer transition-colors', isSelected ? 'bg-teal-400/12 border border-teal-400/30' : 'hover:bg-teal-400/8')}
                          >
                            <span className={clsx('text-[11px]', isSelected ? 'text-teal-600 font-semibold' : 'text-teal-900 font-medium')}>
                              {sub.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {sec.id === 'deficiencies' && survey.deficiencies.length > 0 && (
                    <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1 space-y-px">
                      {survey.deficiencies
                        .filter(d => !navSearch || (d.issue || 'New Deficiency').toLowerCase().includes(navSearch.toLowerCase()))
                        .map(d => {
                          const isSelected = activeDeficiencyId === d.id
                          return (
                            <div key={d.id}
                              onClick={() => {
                                setActiveSectionIdx(SECTIONS.findIndex(s => s.id === 'deficiencies'))
                                setActiveDeficiencyId(d.id)
                                updateDeficiency(d.id, { collapsed: false })
                                setTimeout(() => document.getElementById(`def_${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                              }}
                              className={clsx('px-2 py-1.5 rounded-md cursor-pointer transition-colors', isSelected ? 'bg-teal-400/12 border border-teal-400/30' : 'hover:bg-teal-400/8')}
                            >
                              <div className="flex items-center justify-between">
                                <span className={clsx('text-[11px] truncate max-w-[110px]', d.marked ? 'text-green-600 font-medium' : isSelected ? 'text-teal-600 font-semibold' : 'text-teal-900 font-medium')}>
                                  {d.issue || 'New Deficiency'}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                  {d.marked && <Check size={9} className="text-green-600" />}
                                  {d.flagged && <Flag size={7} className="text-red-600" />}
                                </div>
                              </div>
                            </div>
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
              <h2 className="text-base font-bold text-teal-900">{activeSection.label}</h2>
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
            <div className="px-6 py-5 space-y-4">

              {/* ══ Structure Overview ══ */}
              {activeSection.id === 'overview' && (
                <>
                  {/* Sub-section tab bar */}
                  <div className="flex gap-1 bg-white rounded-xl border border-nav-gray px-2 py-1.5 overflow-x-auto flex-shrink-0">
                    {([
                      { id: 'details' as const,    label: 'Details' },
                      { id: 'photos' as const,     label: 'Photos' },
                      { id: 'top_beacon' as const, label: 'Top Beacon' },
                      { id: 'lightning' as const,  label: 'Lightning Protection' },
                    ]).map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveOverviewSub(sub.id)}
                        className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0',
                          activeOverviewSub === sub.id
                            ? 'bg-teal-400/15 text-teal-700 border border-teal-400/30'
                            : 'text-std-gray-lm hover:bg-hover-gray-lm')}
                      >{sub.label}</button>
                    ))}
                  </div>

                  {/* Details */}
                  {activeOverviewSub === 'details' && (
                    <>
                      <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                        <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Site Information</p>
                        </div>
                        <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3">
                          {([
                            ['Site Name', survey.siteName],
                            ['Site ID', survey.siteId],
                            ['Customer', survey.customer],
                            ['Technician', survey.technician],
                            ['Email', survey.technicianEmail],
                            ['Coordinates', survey.coordinates],
                          ] as [string, string][]).map(([label, value]) => (
                            <div key={label}>
                              <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-wide">{label}</p>
                              <p className="text-sm text-black mt-0.5 truncate">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/40">
                        <ClimbFieldRow label="Structure Type" flagged={survey.structureTypeFlagged} marked={survey.structureTypeMarked} required
                          onFlag={() => patchSurvey({ structureTypeFlagged: !survey.structureTypeFlagged })}
                          onMark={() => patchSurvey({ structureTypeMarked: !survey.structureTypeMarked })}
                        >
                          <select value={survey.structureType} onChange={e => patchSurvey({ structureType: e.target.value })} className={selectCls}>
                            <option value="">— Select —</option>
                            {STRUCTURE_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Legs" flagged={survey.legsFlagged} marked={survey.legsMarked}
                          onFlag={() => patchSurvey({ legsFlagged: !survey.legsFlagged })}
                          onMark={() => patchSurvey({ legsMarked: !survey.legsMarked })}
                        >
                          <select value={survey.legs} onChange={e => patchSurvey({ legs: e.target.value })} className={selectCls}>
                            <option value="">— Select —</option>
                            {LEGS_OPTIONS.map(l => <option key={l}>{l}</option>)}
                          </select>
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Safety Climb" flagged={survey.safetyClimbFlagged} marked={survey.safetyClimbMarked}
                          onFlag={() => patchSurvey({ safetyClimbFlagged: !survey.safetyClimbFlagged })}
                          onMark={() => patchSurvey({ safetyClimbMarked: !survey.safetyClimbMarked })}
                        >
                          <YesNoToggle value={survey.safetyClimb} onChange={v => patchSurvey({ safetyClimb: v })} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="AM Skirt" flagged={survey.amSkirtFlagged} marked={survey.amSkirtMarked}
                          onFlag={() => patchSurvey({ amSkirtFlagged: !survey.amSkirtFlagged })}
                          onMark={() => patchSurvey({ amSkirtMarked: !survey.amSkirtMarked })}
                        >
                          <YesNoToggle value={survey.amSkirt} onChange={v => patchSurvey({ amSkirt: v })} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Base Width (ft)" flagged={survey.baseWidthFlagged} marked={survey.baseWidthMarked}
                          onFlag={() => patchSurvey({ baseWidthFlagged: !survey.baseWidthFlagged })}
                          onMark={() => patchSurvey({ baseWidthMarked: !survey.baseWidthMarked })}
                        >
                          <input type="number" value={survey.baseWidth} onChange={e => patchSurvey({ baseWidth: e.target.value })} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Top Steel Width (ft)" flagged={survey.topSteelWidthFlagged} marked={survey.topSteelWidthMarked}
                          onFlag={() => patchSurvey({ topSteelWidthFlagged: !survey.topSteelWidthFlagged })}
                          onMark={() => patchSurvey({ topSteelWidthMarked: !survey.topSteelWidthMarked })}
                        >
                          <input type="number" value={survey.topSteelWidth} onChange={e => patchSurvey({ topSteelWidth: e.target.value })} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Top Steel Elevation (ft)" locked>
                          <input type="number" value={survey.topSteelElevation} readOnly className={clsx(inputCls, 'bg-green-600/[0.04] border-green-600/20 text-green-700 cursor-default')} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Highest Appurtenance" flagged={survey.highestAppurtenanceFlagged} marked={survey.highestAppurtenanceMarked}
                          onFlag={() => patchSurvey({ highestAppurtenanceFlagged: !survey.highestAppurtenanceFlagged })}
                          onMark={() => patchSurvey({ highestAppurtenanceMarked: !survey.highestAppurtenanceMarked })}
                        >
                          <select value={survey.highestAppurtenance} onChange={e => patchSurvey({ highestAppurtenance: e.target.value })} className={selectCls}>
                            <option value="">— Select —</option>
                            {APPURTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Apex Elevation (ft)" flagged={survey.apexElevationFlagged} marked={survey.apexElevationMarked}
                          onFlag={() => patchSurvey({ apexElevationFlagged: !survey.apexElevationFlagged })}
                          onMark={() => patchSurvey({ apexElevationMarked: !survey.apexElevationMarked })}
                        >
                          <input type="number" value={survey.apexElevation} onChange={e => patchSurvey({ apexElevation: e.target.value })} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Anchor Bolt Dia. (in)" flagged={survey.anchorBoltDiameterFlagged} marked={survey.anchorBoltDiameterMarked}
                          onFlag={() => patchSurvey({ anchorBoltDiameterFlagged: !survey.anchorBoltDiameterFlagged })}
                          onMark={() => patchSurvey({ anchorBoltDiameterMarked: !survey.anchorBoltDiameterMarked })}
                        >
                          <input type="number" value={survey.anchorBoltDiameter} onChange={e => patchSurvey({ anchorBoltDiameter: e.target.value })} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Notes" flagged={survey.overviewNotesFlagged} marked={survey.overviewNotesMarked}
                          onFlag={() => patchSurvey({ overviewNotesFlagged: !survey.overviewNotesFlagged })}
                          onMark={() => patchSurvey({ overviewNotesMarked: !survey.overviewNotesMarked })}
                        >
                          <textarea value={survey.overviewNotes} onChange={e => patchSurvey({ overviewNotes: e.target.value })} placeholder="Add overview notes…" rows={2} className={clsx(inputCls, 'resize-none')} />
                        </ClimbFieldRow>
                      </div>
                    </>
                  )}

                  {/* Photos */}
                  {activeOverviewSub === 'photos' && (
                    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/40">
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-std-gray-lm mb-3">Site Layout Photos</p>
                        <PhotoStrip
                          photos={survey.siteLayoutPhotos}
                          onAdd={() => patchSurvey({ siteLayoutPhotos: [...survey.siteLayoutPhotos, makePhoto(`slp_${Date.now()}`, `site_layout_${survey.siteLayoutPhotos.length + 1}.jpg`)] })}
                          onRemove={id => patchSurvey({ siteLayoutPhotos: survey.siteLayoutPhotos.filter(p => p.id !== id) })}
                        />
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-std-gray-lm mb-3">Laser Distance Photos</p>
                        <PhotoStrip
                          photos={survey.laserDistancePhotos}
                          onAdd={() => patchSurvey({ laserDistancePhotos: [...survey.laserDistancePhotos, makePhoto(`ldp_${Date.now()}`, `laser_dist_${survey.laserDistancePhotos.length + 1}.jpg`)] })}
                          onRemove={id => patchSurvey({ laserDistancePhotos: survey.laserDistancePhotos.filter(p => p.id !== id) })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Top Beacon */}
                  {activeOverviewSub === 'top_beacon' && (
                    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/30">
                      <ClimbFieldRow label="Top Beacon Present" flagged={survey.topBeaconFlagged} marked={survey.topBeaconMarked}
                        onFlag={() => patchSurvey({ topBeaconFlagged: !survey.topBeaconFlagged })}
                        onMark={() => patchSurvey({ topBeaconMarked: !survey.topBeaconMarked })}
                      >
                        <YesNoToggle value={survey.topBeacon} onChange={v => patchSurvey({ topBeacon: v })} />
                      </ClimbFieldRow>
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-std-gray-lm mb-2">Notes</p>
                        <input value={survey.topBeaconNotes} onChange={e => patchSurvey({ topBeaconNotes: e.target.value })} placeholder="Add notes…" className={inputCls} />
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-std-gray-lm mb-3">Photos</p>
                        <PhotoStrip
                          photos={survey.topBeaconPhotos}
                          onAdd={() => patchSurvey({ topBeaconPhotos: [...survey.topBeaconPhotos, makePhoto(`tbp_${Date.now()}`, `top_beacon_${survey.topBeaconPhotos.length + 1}.jpg`)] })}
                          onRemove={id => patchSurvey({ topBeaconPhotos: survey.topBeaconPhotos.filter(p => p.id !== id) })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lightning Protection */}
                  {activeOverviewSub === 'lightning' && (
                    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/30">
                      <ClimbFieldRow label="Protection Type" flagged={survey.lightningProtectionFlagged} marked={survey.lightningProtectionMarked}
                        onFlag={() => patchSurvey({ lightningProtectionFlagged: !survey.lightningProtectionFlagged })}
                        onMark={() => patchSurvey({ lightningProtectionMarked: !survey.lightningProtectionMarked })}
                      >
                        <select value={survey.lightningProtectionType} onChange={e => patchSurvey({ lightningProtectionType: e.target.value })} className={selectCls}>
                          <option value="">— Select —</option>
                          {LIGHTNING_PROTECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </ClimbFieldRow>
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold text-std-gray-lm mb-3">Photos</p>
                        <PhotoStrip
                          photos={survey.lightningProtectionPhotos}
                          onAdd={() => patchSurvey({ lightningProtectionPhotos: [...survey.lightningProtectionPhotos, makePhoto(`lpp_${Date.now()}`, `lightning_${survey.lightningProtectionPhotos.length + 1}.jpg`)] })}
                          onRemove={id => patchSurvey({ lightningProtectionPhotos: survey.lightningProtectionPhotos.filter(p => p.id !== id) })}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══ Safety Climb ══ */}
              {activeSection.id === 'safety_climb' && (
                <>
                  <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/40">
                    <ClimbFieldRow label="Location" flagged={survey.safetyClimbLocationFlagged} marked={survey.safetyClimbLocationMarked}
                      onFlag={() => patchSurvey({ safetyClimbLocationFlagged: !survey.safetyClimbLocationFlagged })}
                      onMark={() => patchSurvey({ safetyClimbLocationMarked: !survey.safetyClimbLocationMarked })}
                    >
                      <select value={survey.safetyClimbLocation} onChange={e => patchSurvey({ safetyClimbLocation: e.target.value })} className={selectCls}>
                        <option value="">— Select —</option>
                        {MOUNT_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </ClimbFieldRow>
                    <ClimbFieldRow label="Manufacturer" flagged={survey.safetyClimbManufacturerFlagged} marked={survey.safetyClimbManufacturerMarked}
                      onFlag={() => patchSurvey({ safetyClimbManufacturerFlagged: !survey.safetyClimbManufacturerFlagged })}
                      onMark={() => patchSurvey({ safetyClimbManufacturerMarked: !survey.safetyClimbManufacturerMarked })}
                    >
                      <select value={survey.safetyClimbManufacturer} onChange={e => patchSurvey({ safetyClimbManufacturer: e.target.value })} className={selectCls}>
                        <option value="">— Select —</option>
                        {SAFETY_CLIMB_MANUFACTURERS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </ClimbFieldRow>
                    <ClimbFieldRow label="Top Height (ft)" flagged={survey.safetyClimbTopHeightFlagged} marked={survey.safetyClimbTopHeightMarked}
                      onFlag={() => patchSurvey({ safetyClimbTopHeightFlagged: !survey.safetyClimbTopHeightFlagged })}
                      onMark={() => patchSurvey({ safetyClimbTopHeightMarked: !survey.safetyClimbTopHeightMarked })}
                    >
                      <input type="number" value={survey.safetyClimbTopHeight} onChange={e => patchSurvey({ safetyClimbTopHeight: e.target.value })} placeholder="—" className={inputCls} />
                    </ClimbFieldRow>
                    <ClimbFieldRow label="Notes" flagged={survey.safetyClimbNotesFlagged} marked={survey.safetyClimbNotesMarked}
                      onFlag={() => patchSurvey({ safetyClimbNotesFlagged: !survey.safetyClimbNotesFlagged })}
                      onMark={() => patchSurvey({ safetyClimbNotesMarked: !survey.safetyClimbNotesMarked })}
                    >
                      <textarea value={survey.safetyClimbNotes} onChange={e => patchSurvey({ safetyClimbNotes: e.target.value })} placeholder="Add notes…" rows={2} className={clsx(inputCls, 'resize-none')} />
                    </ClimbFieldRow>
                  </div>
                  <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                      <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Safety Climb Photos</p>
                    </div>
                    <div className="grid grid-cols-2">
                      {([
                        { label: 'Overview Photos', key: 'safetyClimbOverviewPhotos' as const },
                        { label: 'Bottom Assembly Photos', key: 'safetyClimbBottomAssemblyPhotos' as const },
                        { label: 'Top Assembly Photos', key: 'safetyClimbTopAssemblyPhotos' as const },
                        { label: 'Top Internal Components', key: 'safetyClimbTopInternalPhotos' as const },
                      ]).map(({ label, key }, i) => (
                        <div key={key} className={clsx('px-5 py-4', i < 2 ? 'border-b border-nav-gray/40' : '', i % 2 === 0 ? 'border-r border-nav-gray/40' : '')}>
                          <p className="text-xs font-semibold text-std-gray-lm mb-2">{label}</p>
                          <PhotoStrip
                            photos={survey[key]}
                            onAdd={() => patchSurvey({ [key]: [...survey[key], makePhoto(`${key}_${Date.now()}`, `${key}_${survey[key].length + 1}.jpg`)] })}
                            onRemove={id => patchSurvey({ [key]: survey[key].filter((p: ClimbPhoto) => p.id !== id) })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ══ Taper Changes ══ */}
              {activeSection.id === 'taper_changes' && (
                <>
                  {survey.taperChanges.map((tc, idx) => (
                    <div key={tc.id} className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                      <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Taper Change {idx + 1}</p>
                        <button
                          onClick={() => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.filter(t => t.id !== tc.id) }))}
                          className="p-1 rounded text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 transition-colors"
                        ><Minus size={13} /></button>
                      </div>
                      <div className="divide-y divide-nav-gray/40">
                        <ClimbFieldRow label={<span className="flex items-center gap-1">Base Width (ft)</span> as unknown as string} flagged={tc.baseWidthFlagged} marked={false}
                          onFlag={() => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, baseWidthFlagged: !t.baseWidthFlagged } : t) }))}
                        >
                          <input type="number" value={tc.baseWidth} onChange={e => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, baseWidth: e.target.value } : t) }))} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Top Width (ft)" flagged={tc.topWidthFlagged} marked={false}
                          onFlag={() => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, topWidthFlagged: !t.topWidthFlagged } : t) }))}
                        >
                          <input type="number" value={tc.topWidth} onChange={e => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, topWidth: e.target.value } : t) }))} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                        <ClimbFieldRow label="Top Elevation (ft)" flagged={tc.topElevationFlagged} marked={tc.topElevationMarked}
                          onFlag={() => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, topElevationFlagged: !t.topElevationFlagged } : t) }))}
                          onMark={() => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, topElevationMarked: !t.topElevationMarked } : t) }))}
                        >
                          <input type="number" value={tc.topElevation} onChange={e => setSurvey(prev => ({ ...prev, taperChanges: prev.taperChanges.map(t => t.id === tc.id ? { ...t, topElevation: e.target.value } : t) }))} placeholder="—" className={inputCls} />
                        </ClimbFieldRow>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setSurvey(prev => ({ ...prev, taperChanges: [...prev.taperChanges, { id: `tc_${Date.now()}`, baseWidth: '', baseWidthFlagged: false, topWidth: '', topWidthFlagged: false, topElevation: '', topElevationFlagged: false, topElevationMarked: false, marked: false }] }))}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-nav-gray text-sm text-teal-500 hover:border-teal-400 hover:bg-teal-400/5 transition-colors font-medium"
                  >
                    <Plus size={15} /> Add Taper Change
                  </button>
                </>
              )}

              {/* ══ Deficiencies ══ */}
              {activeSection.id === 'deficiencies' && (
                <div className="card overflow-hidden">
                  {survey.deficiencies.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-std-gray-lm text-sm font-medium">No deficiencies recorded</p>
                      <p className="text-std-gray-dm text-xs mt-1">Add a deficiency to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-nav-gray/60">
                      {survey.deficiencies.map(def => (
                        <DeficiencyAccordion
                          key={def.id}
                          item={def}
                          onUpdate={patch => updateDeficiency(def.id, patch)}
                          onRemove={() => removeDeficiency(def.id)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="border-t border-nav-gray/60 px-6 py-3">
                    <button onClick={addDeficiency} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-teal-400 hover:text-teal-600 hover:bg-teal-400/8 rounded-lg transition-colors font-medium">
                      <Plus size={15} /> Add Deficiency
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Structure Base & Foundation ══ */}
              {activeSection.id === 'base_foundation' && (
                <>
                  <div className="rounded-xl border border-nav-gray bg-white overflow-hidden divide-y divide-nav-gray/40">
                    <ClimbFieldRow label="Grout Present" flagged={survey.groutFlagged} marked={survey.groutMarked}
                      onFlag={() => patchSurvey({ groutFlagged: !survey.groutFlagged })}
                      onMark={() => patchSurvey({ groutMarked: !survey.groutMarked })}
                    >
                      <YesNoToggle value={survey.grout} onChange={v => patchSurvey({ grout: v })} />
                    </ClimbFieldRow>
                    <ClimbFieldRow label="Clear Distance (in)" flagged={survey.clearDistanceFlagged} marked={survey.clearDistanceMarked}
                      onFlag={() => patchSurvey({ clearDistanceFlagged: !survey.clearDistanceFlagged })}
                      onMark={() => patchSurvey({ clearDistanceMarked: !survey.clearDistanceMarked })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={survey.clearDistance}
                          onChange={e => patchSurvey({ clearDistance: e.target.value })}
                          disabled={survey.clearDistanceNA}
                          placeholder="—"
                          className={clsx(inputCls, survey.clearDistanceNA && 'opacity-40 cursor-not-allowed')}
                        />
                        <label className="flex items-center gap-1.5 text-xs text-std-gray-lm flex-shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={survey.clearDistanceNA}
                            onChange={e => patchSurvey({ clearDistanceNA: e.target.checked, clearDistance: e.target.checked ? '' : survey.clearDistance })}
                            className="w-3.5 h-3.5 rounded accent-teal-500"
                          />
                          N/A
                        </label>
                      </div>
                    </ClimbFieldRow>
                    <ClimbFieldRow label="Base Notes" flagged={survey.baseNotesFlagged} marked={survey.baseNotesMarked}
                      onFlag={() => patchSurvey({ baseNotesFlagged: !survey.baseNotesFlagged })}
                      onMark={() => patchSurvey({ baseNotesMarked: !survey.baseNotesMarked })}
                    >
                      <textarea value={survey.baseNotes} onChange={e => patchSurvey({ baseNotes: e.target.value })} placeholder="Add base notes…" rows={2} className={clsx(inputCls, 'resize-none')} />
                    </ClimbFieldRow>
                  </div>

                  {/* Foundation photo grid */}
                  <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                      <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Foundation Photos</p>
                    </div>
                    <div className="grid grid-cols-2">
                      {([
                        { label: 'Azimuth 0°', key: 'azimuth0Photos' as const },
                        { label: 'Azimuth 90°', key: 'azimuth90Photos' as const },
                        { label: 'Azimuth 180°', key: 'azimuth180Photos' as const },
                        { label: 'Azimuth 270°', key: 'azimuth270Photos' as const },
                      ]).map(({ label, key }, i) => (
                        <div key={key} className={clsx('px-5 py-4', i < 2 ? 'border-b border-nav-gray/40' : '', i % 2 === 0 ? 'border-r border-nav-gray/40' : '')}>
                          <p className="text-xs font-semibold text-std-gray-lm mb-2">{label}</p>
                          <PhotoStrip
                            photos={survey[key]}
                            onAdd={() => patchSurvey({ [key]: [...survey[key], makePhoto(`${key}_${Date.now()}`, `${key}_${survey[key].length + 1}.jpg`)] })}
                            onRemove={id => patchSurvey({ [key]: survey[key].filter((p: ClimbPhoto) => p.id !== id) })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-nav-gray/40 px-5 py-4">
                      <p className="text-xs font-semibold text-std-gray-lm mb-2">Grout / Leveling Nut Condition</p>
                      <PhotoStrip
                        photos={survey.groutLevelingPhotos}
                        onAdd={() => patchSurvey({ groutLevelingPhotos: [...survey.groutLevelingPhotos, makePhoto(`glt_${Date.now()}`, `grout_leveling_${survey.groutLevelingPhotos.length + 1}.jpg`)] })}
                        onRemove={id => patchSurvey({ groutLevelingPhotos: survey.groutLevelingPhotos.filter((p: ClimbPhoto) => p.id !== id) })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ══ Ground Leads ══ */}
              {activeSection.id === 'ground_leads' && (
                <div className="card overflow-hidden">
                  {survey.groundLeads.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-std-gray-lm text-sm font-medium">No ground leads recorded</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-nav-gray/60">
                      {survey.groundLeads.map((gl, idx) => {
                        const photoCount = gl.photos.filter(p => p.filename).length
                        return (
                          <ItemAccordion
                            key={gl.id}
                            title={`Ground Lead ${idx + 1}`}
                            photoCount={photoCount}
                            flagCount={gl.flagged ? 1 : 0}
                            collapsed={gl.collapsed}
                            onToggle={() => updateGroundLead(gl.id, { collapsed: !gl.collapsed })}
                            onRemove={() => removeGroundLead(gl.id)}
                          >
                            <div className="px-5 py-3 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-std-gray-lm mb-1.5">Notes</p>
                                <textarea value={gl.notes} onChange={e => updateGroundLead(gl.id, { notes: e.target.value })} placeholder="Add notes…" rows={2} className={clsx(inputCls, 'resize-none')} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-std-gray-lm mb-1.5">Ground Lead Photos</p>
                                <PhotoStrip
                                  photos={gl.photos}
                                  onAdd={() => updateGroundLead(gl.id, { photos: [...gl.photos, makePhoto(`gl_p_${Date.now()}`, `ground_lead_${gl.photos.length + 1}.jpg`)] })}
                                  onRemove={id => updateGroundLead(gl.id, { photos: gl.photos.filter(p => p.id !== id) })}
                                />
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button onClick={() => updateGroundLead(gl.id, { flagged: !gl.flagged })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', gl.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
                                  <Flag size={12} />{gl.flagged ? 'Flagged' : 'Flag'}
                                </button>
                                <button onClick={() => updateGroundLead(gl.id, { marked: !gl.marked })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', gl.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
                                  <Check size={12} />{gl.marked ? 'Marked' : 'Mark Reviewed'}
                                </button>
                              </div>
                            </div>
                          </ItemAccordion>
                        )
                      })}
                    </div>
                  )}
                  <div className="border-t border-nav-gray/60 px-6 py-3">
                    <button onClick={addGroundLead} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-teal-400 hover:text-teal-600 hover:bg-teal-400/8 rounded-lg transition-colors font-medium">
                      <Plus size={15} /> Add Ground Lead
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Guy Attachments ══ */}
              {activeSection.id === 'guy_attachments' && (
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="bg-[#4a86c8]">
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-8">#</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-28">Guy Level</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-32">Elevation (ft)</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5">Notes</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-20">Photos</th>
                          <th className="w-28" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nav-gray/40 bg-white">
                        {survey.guyAttachments.length === 0 && (
                          <tr><td colSpan={6} className="text-center text-sm text-std-gray-dm italic py-8">No guy attachments recorded</td></tr>
                        )}
                        {survey.guyAttachments.map((ga, idx) => (
                          <tr key={ga.id} className={clsx('transition-colors', ga.flagged ? 'bg-red-600/[0.03]' : ga.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                            <td className="px-4 py-2 text-xs text-std-gray-lm font-medium">{idx + 1}</td>
                            <td className="px-4 py-2">
                              <input type="number" value={ga.guyLevel} onChange={e => updateGuyAttachment(ga.id, { guyLevel: e.target.value })} placeholder="—"
                                className="w-20 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-green-700">{ga.elevation || '—'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <input value={ga.notes} onChange={e => updateGuyAttachment(ga.id, { notes: e.target.value })} placeholder="Optional…"
                                className="w-full min-w-[120px] px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-4 py-2">
                              <PhotoCell
                                photos={ga.photos}
                                onAdd={() => updateGuyAttachment(ga.id, { photos: [...ga.photos, makePhoto(`ga_p_${Date.now()}`, `guy_attach_${ga.photos.length + 1}.jpg`)] })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => updateGuyAttachment(ga.id, { flagged: !ga.flagged })} className={clsx('p-1.5 rounded border transition-colors', ga.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={11} /></button>
                                <button onClick={() => updateGuyAttachment(ga.id, { marked: !ga.marked })} className={clsx('p-1.5 rounded border transition-colors', ga.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={11} /></button>
                                <button onClick={() => removeGuyAttachment(ga.id)} className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-nav-gray/40 px-5 py-2.5 flex justify-end">
                    <button onClick={addGuyAttachment} className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors">
                      <Plus size={12} /> Add Guy Attachment
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Mount Centerlines ══ */}
              {activeSection.id === 'mount_centerlines' && (
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[1080px]">
                      <thead>
                        <tr className="bg-[#4a86c8]">
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-8">#</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-24">Elev. (ft)</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5">Antenna Type</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-20"># Ant.</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5">Mount Type</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5">Location</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-28">Ice Shield</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5">Coax Route</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-28">Owner</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-24">Equip. Count</th>
                          <th className="text-left text-xs font-bold text-white px-3 py-2.5 w-20">Photos</th>
                          <th className="w-28" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nav-gray/40 bg-white">
                        {survey.mountCenterlines.length === 0 && (
                          <tr><td colSpan={12} className="text-center text-sm text-std-gray-dm italic py-8">No mount centerlines recorded</td></tr>
                        )}
                        {survey.mountCenterlines.map((mc, idx) => (
                          <tr key={mc.id} className={clsx('transition-colors', mc.flagged ? 'bg-red-600/[0.03]' : mc.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                            <td className="px-3 py-2 text-xs text-std-gray-lm font-medium">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input type="number" value={mc.elevation} onChange={e => updateMountCenterline(mc.id, { elevation: e.target.value })} placeholder="—"
                                className="w-20 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-3 py-2">
                              <select value={mc.antennaType} onChange={e => updateMountCenterline(mc.id, { antennaType: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {ANTENNA_TYPES.map(t => <option key={t}>{t}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={mc.numberOfAntennas} onChange={e => updateMountCenterline(mc.id, { numberOfAntennas: e.target.value })} placeholder="—"
                                className="w-16 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors text-center" />
                            </td>
                            <td className="px-3 py-2">
                              <select value={mc.mountType} onChange={e => updateMountCenterline(mc.id, { mountType: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {MOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select value={mc.mountLocation} onChange={e => updateMountCenterline(mc.id, { mountLocation: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {MOUNT_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <YesNoToggle value={mc.iceShield} onChange={v => updateMountCenterline(mc.id, { iceShield: v })} />
                            </td>
                            <td className="px-3 py-2">
                              <select value={mc.coaxRoute} onChange={e => updateMountCenterline(mc.id, { coaxRoute: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {COAX_ROUTES.map(r => <option key={r}>{r}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input value={mc.owner} onChange={e => updateMountCenterline(mc.id, { owner: e.target.value })} placeholder="Unknown"
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-3 py-2">
                              <input value={mc.equipmentCount} onChange={e => updateMountCenterline(mc.id, { equipmentCount: e.target.value })} placeholder="—"
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-3 py-2">
                              <PhotoCell
                                photos={mc.photos}
                                onAdd={() => updateMountCenterline(mc.id, { photos: [...mc.photos, makePhoto(`mc_p_${Date.now()}`, `mount_${mc.photos.length + 1}.jpg`)] })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => updateMountCenterline(mc.id, { flagged: !mc.flagged })} className={clsx('p-1.5 rounded border transition-colors', mc.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={11} /></button>
                                <button onClick={() => updateMountCenterline(mc.id, { marked: !mc.marked })} className={clsx('p-1.5 rounded border transition-colors', mc.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={11} /></button>
                                <button onClick={() => removeMountCenterline(mc.id)} className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-nav-gray/40 px-5 py-2.5 flex justify-end">
                    <button onClick={addMountCenterline} className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors">
                      <Plus size={12} /> Add Mount Centerline
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Lights ══ */}
              {activeSection.id === 'lights' && (
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="bg-[#4a86c8]">
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-8">#</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-32">Elevation (ft)</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-40">Location</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5">Notes</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-20">Photos</th>
                          <th className="w-28" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nav-gray/40 bg-white">
                        {survey.lights.length === 0 && (
                          <tr><td colSpan={6} className="text-center text-sm text-std-gray-dm italic py-8">No lights recorded</td></tr>
                        )}
                        {survey.lights.map((lt, idx) => (
                          <tr key={lt.id} className={clsx('transition-colors', lt.flagged ? 'bg-red-600/[0.03]' : lt.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                            <td className="px-4 py-2 text-xs text-std-gray-lm font-medium">{idx + 1}</td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-green-700">{lt.elevation || '—'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <select value={lt.location} onChange={e => updateLight(lt.id, { location: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {LIGHT_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input value={lt.notes} onChange={e => updateLight(lt.id, { notes: e.target.value })} placeholder="Optional…"
                                className="w-full min-w-[100px] px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-4 py-2">
                              <PhotoCell
                                photos={lt.photos}
                                onAdd={() => updateLight(lt.id, { photos: [...lt.photos, makePhoto(`lt_p_${Date.now()}`, `light_${lt.photos.length + 1}.jpg`)] })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => updateLight(lt.id, { flagged: !lt.flagged })} className={clsx('p-1.5 rounded border transition-colors', lt.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={11} /></button>
                                <button onClick={() => updateLight(lt.id, { marked: !lt.marked })} className={clsx('p-1.5 rounded border transition-colors', lt.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={11} /></button>
                                <button onClick={() => removeLight(lt.id)} className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-nav-gray/40 px-5 py-2.5 flex justify-end">
                    <button onClick={addLight} className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors">
                      <Plus size={12} /> Add Light
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Other Appurtenances ══ */}
              {activeSection.id === 'other_appurtenances' && (
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="bg-[#4a86c8]">
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-8">#</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-32">Elevation (ft)</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-36">Location</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-28">Ice Shield</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5">Description</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-32">Owner</th>
                          <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-20">Photos</th>
                          <th className="w-28" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-nav-gray/40 bg-white">
                        {survey.otherAppurtenances.length === 0 && (
                          <tr><td colSpan={8} className="text-center text-sm text-std-gray-dm italic py-8">No other appurtenances recorded</td></tr>
                        )}
                        {survey.otherAppurtenances.map((oa, idx) => (
                          <tr key={oa.id} className={clsx('transition-colors', oa.flagged ? 'bg-red-600/[0.03]' : oa.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                            <td className="px-4 py-2 text-xs text-std-gray-lm font-medium">{idx + 1}</td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-green-700">{oa.elevation || '—'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <select value={oa.location} onChange={e => updateOtherAppurtenance(oa.id, { location: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                                <option value="">— Select —</option>
                                {MOUNT_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <YesNoToggle value={oa.iceShield} onChange={v => updateOtherAppurtenance(oa.id, { iceShield: v })} />
                            </td>
                            <td className="px-4 py-2">
                              <input value={oa.description} onChange={e => updateOtherAppurtenance(oa.id, { description: e.target.value })} placeholder="Describe…"
                                className="w-full min-w-[100px] px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-4 py-2">
                              <input value={oa.owner} onChange={e => updateOtherAppurtenance(oa.id, { owner: e.target.value })} placeholder="Unknown"
                                className="w-full px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                            </td>
                            <td className="px-4 py-2">
                              <PhotoCell
                                photos={oa.photos}
                                onAdd={() => updateOtherAppurtenance(oa.id, { photos: [...oa.photos, makePhoto(`oa_p_${Date.now()}`, `appurtenance_${oa.photos.length + 1}.jpg`)] })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => updateOtherAppurtenance(oa.id, { flagged: !oa.flagged })} className={clsx('p-1.5 rounded border transition-colors', oa.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={11} /></button>
                                <button onClick={() => updateOtherAppurtenance(oa.id, { marked: !oa.marked })} className={clsx('p-1.5 rounded border transition-colors', oa.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={11} /></button>
                                <button onClick={() => removeOtherAppurtenance(oa.id)} className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-nav-gray/40 px-5 py-2.5 flex justify-end">
                    <button onClick={addOtherAppurtenance} className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors">
                      <Plus size={12} /> Add Appurtenance
                    </button>
                  </div>
                </div>
              )}

              {/* ══ Catch All ══ */}
              {activeSection.id === 'catch_all' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-std-gray-lm">{survey.catchAll.length} items</p>
                    <button
                      onClick={() => setSurvey(prev => ({ ...prev, catchAll: [...prev.catchAll, { id: `ca_${Date.now()}`, description: '', flagged: false, marked: false }] }))}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    ><Plus size={12} /> Add Item</button>
                  </div>
                  {survey.catchAll.length === 0 && (
                    <div className="card border-dashed py-16 text-center">
                      <p className="text-std-gray-lm text-sm font-medium">No catch-all items</p>
                      <p className="text-std-gray-dm text-xs mt-1">Add an item to capture any additional observations</p>
                    </div>
                  )}
                  {survey.catchAll.length > 0 && (
                    <div className="card overflow-hidden divide-y divide-nav-gray/40">
                      {survey.catchAll.map(item => (
                        <div key={item.id} className="px-5 py-4">
                          <textarea
                            value={item.description}
                            onChange={e => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, description: e.target.value } : c) }))}
                            placeholder="Describe the observation…"
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors resize-none"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, flagged: !c.flagged } : c) }))}
                              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors', item.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}
                            ><Flag size={11} />{item.flagged ? 'Flagged' : 'Flag'}</button>
                            <button
                              onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, marked: !c.marked } : c) }))}
                              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors', item.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}
                            ><Check size={11} />{item.marked ? 'Marked' : 'Mark'}</button>
                            <button
                              onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.filter(c => c.id !== item.id) }))}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-nav-gray text-xs font-medium text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors ml-auto"
                            ><Minus size={11} /> Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── Footer nav ── */}
          <div className="bg-white border-t border-nav-gray px-3 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
            <button onClick={goPrev} disabled={activeSectionIdx === 0}
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
            <button onClick={goNext} disabled={activeSectionIdx === SECTIONS.length - 1}
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
              {aiAnalyzed && aiIssueCount > 0 && (
                <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-purple-600/15 text-purple-600">{aiIssueCount}</span>
              )}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>
            </div>

            {!aiAnalyzed && !aiAnalyzing && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-std-gray-lm leading-relaxed">
                  Analyzes the survey for missing required data, anomalies, and quality issues. Issues are flagged directly on the relevant fields in each section.
                </p>
                <button
                  onClick={runAIAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
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
                <p className="text-xs text-std-gray-lm text-center">Checking {totalFields} fields for issues</p>
              </div>
            )}

            {aiAnalyzed && !aiAnalyzing && (
              <>
                <div className="flex-1 overflow-y-auto">
                  {aiIssueCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                      <CheckCheck size={22} className="text-green-600" />
                      <p className="text-sm font-medium text-black">No issues found</p>
                      <p className="text-xs text-std-gray-lm text-center">This survey looks good!</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-[11px] text-std-gray-lm font-medium uppercase tracking-wide px-1">
                        {aiIssueCount} issue{aiIssueCount !== 1 ? 's' : ''} found
                      </p>
                      {Object.entries(aiFlags).map(([fieldId, entry]) => {
                        const borderCls = entry.severity === 'error' ? 'border-red-600/25 bg-red-600/[0.04]' : entry.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-purple-600/20 bg-purple-600/[0.03]'
                        const iconEl = entry.severity === 'error'
                          ? <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" />
                          : entry.severity === 'warning'
                            ? <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            : <Sparkles size={11} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        return (
                          <div key={fieldId} className={clsx('p-3 rounded-lg border', borderCls)}>
                            <div className="flex items-start gap-2">
                              {iconEl}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-black truncate capitalize">{fieldId.replace(/_/g, ' ')}</p>
                                <p className="text-[11px] text-std-gray-lm mt-0.5 leading-relaxed">{entry.issue}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-nav-gray flex-shrink-0">
                  <button
                    onClick={runAIAnalysis}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-600/30 bg-purple-600/5 text-purple-600 text-xs font-medium hover:bg-purple-600/10 transition-colors"
                  >
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
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-black">Fields</span><span className="text-xs text-std-gray-lm">{overallPct}% complete</span></div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-gray-lm rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-black w-20 text-right flex-shrink-0">{totalMarked}/{totalFields} checked</span>
              </div>
              {totalFields - totalMarked > 0 && <p className="text-[11px] text-amber-600 font-medium">{totalFields - totalMarked} field{totalFields - totalMarked > 1 ? 's' : ''} not yet checked</p>}
            </div>
            <div className="px-6 py-4 flex gap-2">
              <button onClick={() => setCompletionModalOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button onClick={() => { setSurveyComplete(true); setCompletionModalOpen(false) }} className="btn-success flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
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
