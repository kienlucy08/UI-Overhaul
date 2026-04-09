export const mockSite = {
  id: 'TX6100',
  name: 'Orange - Claybar',
  internalId: 'TX-6100-INT',
  cuidId: 'cuid_tx6100_abc123',
  coordinates: { lat: 30.23702697, lng: -93.76688727 },
  elevation: '87 ft',
  address: '1234 Claybar Rd, Orange, TX 77630',
  country: 'USA',
  owner: 'TowerCo',
  ownerSiteId: 'TC-TX-6100',
  leaseLandType: 'Ground Lease',
  dedicatedAccessRoad: 'Yes',
  functionalNightMode: 'No',
  nearestHospital: 'Baptist Hospitals of Southeast Texas — 4.2 mi',
  structures: [
    { id: 'str_001', name: 'Guyed', type: 'Guyed Tower', height: '300ft', created: 'Oct 8, 2025 11:02 PM' },
  ],
  compounds: [
    { id: 'cmp_001', name: 'Compound', cuid: '13771fc7-5c54-4c11-b680-e004c2e77fee', created: 'Oct 8, 2025 11:02 PM' },
  ],
  siteVisits: [
    { id: 'visit_001', name: 'Antelope Drive Deming', created: 'Oct 8, 2025 12:00 PM', type: 'Inspection', surveyCount: 4 },
  ],
  siteAccess: [],
  reports: [
    { id: 'rpt_001', name: 'TEST_10656_Report_20260208', date: 'Feb 3, 2026 12:00 PM', version: 'AllTowers_TIA_Inspection_v4.34' },
    { id: 'rpt_002', name: 'TEST-10656_Report_20251107', date: 'Sep 15, 2025 12:00 PM', version: 'AllTowers_TIA_Inspection_v4.33' },
  ],
}

export const mockSiteSummary = {
  id: 'TX6100',
  name: 'Antelope Drive Deming',
  coordinates: { lat: 32.30432, lng: -107.75219 },
  structureCount: 1,
  compoundCount: 1,
  siteVisitCount: 1,
  scanCount: 0,
  reportCount: 3,
  structures: [{ id: 'str_001', name: 'Guyed', type: 'Guyed Tower', height: '300ft' }],
  compounds: [{ id: 'cmp_001', name: 'Compound', cuid: '13771fc7-5c54-4c11-b680-e004c2e77fee' }],
  siteVisits: [{ id: 'visit_001', name: 'Antelope Drive Deming', date: 'May 29, 2025 9:15 AM', type: 'Inspection', surveyCount: 4, status: 'QA Editor' }],
  attachments: [
    { id: 'att_001', name: 'Site Overview.jpg', size: '2.4 MB', date: 'May 29, 2025' },
    { id: 'att_002', name: 'Access Road Documentation.pdf', size: '840 KB', date: 'May 29, 2025' },
  ],
  reports: [
    { id: 'rpt_001', name: 'TEST_10656_Report_20260208', date: 'Feb 3, 2026 12:00 PM', version: 'AllTowers_TIA_Inspection_v4.34' },
    { id: 'rpt_002', name: 'TEST-10656_Report_20251107', date: 'Sep 15, 2025 12:00 PM', version: 'AllTowers_TIA_Inspection_v4.33' },
    { id: 'rpt_003', name: 'TEST-10656_Report_20250215', date: 'Feb 15, 2025 12:00 PM', version: 'AllTowers_TIA_Inspection_v4.32' },
  ],
}

export const mockSiteVisit = {
  id: 'visit_001',
  siteId: 'TX6100',
  siteName: 'Orange - Claybar',
  customer: 'TowerCo',
  siteAddress: '1234 Claybar Rd, Orange, TX 77630',
  siteCoordinates: '30.23702697, -93.76688727',
  structureOwner: 'TowerCo',
  projectCode: 'TX-INSP-2025',
  scopeOfWork: 'Inspection',
  temperature: '72°F',
  windSpeed: '6 MPH',
  windDirection: 'SE',
  weather: 'Cloudy',
  contributors: [{ name: 'Lucy Kien', email: 'lkien@fieldsync.io' }],
  structure: {
    structureType: 'Guyed',
    legs: '3',
    guyAttachments: '9',
    elevations: '100 ft, 200 ft, 300 ft',
    guyAnchorCompounds: '6',
    lighting: 'Yes',
  },
  jsaReport: null,
  attachments: [
    { id: 'att_001', name: 'Pre-climb JSA Form.pdf', size: '512 KB', date: 'Oct 8, 2025' },
    { id: 'att_002', name: 'Glamour Shot.jpg', size: '3.1 MB', date: 'Oct 8, 2025' },
  ],
  scans: [],
  surveys: [
    { id: 'survey_001', name: 'Compound Inspection', type: 'Compound Inspection', status: 'In Progress', completedFields: 8, totalFields: 20 },
    { id: 'survey_002', name: 'Structure Inspection', type: 'Structure Inspection', status: 'Completed', completedFields: 24, totalFields: 24 },
    { id: 'survey_003', name: 'Guy Facilities', type: 'Guy Facilities', status: 'In Progress', completedFields: 12, totalFields: 30 },
    { id: 'survey_004', name: 'Plumb & Twist', type: 'Plumb & Twist', status: 'Not Started', completedFields: 0, totalFields: 15 },
  ],
}

// ─── QC Editor ────────────────────────────────────────────────────────────────
export type FieldType = 'yesno' | 'text' | 'select' | 'photo' | 'textarea' | 'number'

export type SurveyField = {
  id: string
  label: string
  value: string | null
  type: FieldType
  required: boolean
  marked: boolean
  flagged: boolean
  note?: string
}

export type SurveySubsection = {
  id: string
  title: string
  fields: SurveyField[]
}

export type SurveySubItem = {
  id: string
  label: string
  fields: SurveyField[]
}

export type SurveyItem = {
  id: string
  label: string
  subsections: SurveySubsection[]
  /** nested repeatable items within an item, e.g. feedlines within a carrier */
  subItems?: {
    groupLabel: string
    items: SurveySubItem[]
  }
}

export type SurveySection = {
  id: string
  title: string
  subsections: SurveySubsection[]
  /** repeatable items (deficiencies, signs, carriers, etc.) */
  items?: SurveyItem[]
  /** if true, items are shown as a drill-in list rather than inline accordions */
  drillIn?: boolean
}

export const mockSurvey = {
  id: 'survey_001',
  name: 'Compound Inspection',
  siteId: 'TX6100',
  siteName: 'Orange - Claybar',
  surveyType: 'Compound Inspection',
  customer: 'TowerCo',
  coordinates: '30.23702697, -93.76688727',
  technicianName: 'Samuel Fagan',
  technicianEmail: 'Samuelf@murphytower.com',
  sections: [
    {
      id: 'compound_overview',
      title: 'Compound Overview',
      subsections: [
        {
          id: 'site_info',
          title: 'Site Info',
          fields: [
            { id: 'co_si_01', label: 'Access Road Present', value: 'Yes', type: 'yesno', required: true, marked: true, flagged: false },
            { id: 'co_si_02', label: 'Access Road Gate Present', value: 'No', type: 'yesno', required: true, marked: true, flagged: false },
            { id: 'co_si_03', label: 'Power Provider', value: 'Emepa', type: 'text', required: true, marked: false, flagged: false },
            { id: 'co_si_04', label: 'Fiber Provider', value: 'CSPIRE', type: 'text', required: false, marked: false, flagged: false },
            { id: 'co_si_05', label: 'Glamour Photo', value: 'glamour_01.jpg', type: 'photo', required: true, marked: true, flagged: false },
          ] as SurveyField[],
        },
        {
          id: 'access_road_info',
          title: 'Access Road Info',
          fields: [
            { id: 'co_ar_01', label: 'Road Surface Type', value: 'Gravel', type: 'select', required: false, marked: false, flagged: false },
            { id: 'co_ar_02', label: 'Road Width (ft)', value: '12', type: 'number', required: false, marked: false, flagged: false },
            { id: 'co_ar_03', label: 'Road Condition', value: null, type: 'select', required: true, marked: false, flagged: true },
          ] as SurveyField[],
        },
        {
          id: 'manufacturer_info',
          title: 'Manufacturer Info',
          fields: [
            { id: 'co_mi_01', label: 'Fence Manufacturer', value: null, type: 'text', required: false, marked: false, flagged: false },
            { id: 'co_mi_02', label: 'Gate Manufacturer', value: null, type: 'text', required: false, marked: false, flagged: false },
          ] as SurveyField[],
        },
        {
          id: 'compound_gate',
          title: 'Compound Gate',
          fields: [
            { id: 'co_cg_01', label: 'Gate Type', value: 'Single Swing', type: 'select', required: true, marked: false, flagged: false },
            { id: 'co_cg_02', label: 'Gate Condition', value: 'Good', type: 'select', required: true, marked: false, flagged: false },
            { id: 'co_cg_03', label: 'Lock Present', value: 'No', type: 'yesno', required: true, marked: false, flagged: true },
            { id: 'co_cg_04', label: 'Gate Photo', value: null, type: 'photo', required: true, marked: false, flagged: false },
          ] as SurveyField[],
        },
        {
          id: 'compound_power',
          title: 'Compound Power',
          fields: [
            { id: 'co_cp_01', label: 'Power Source', value: 'Grid', type: 'select', required: true, marked: false, flagged: false },
            { id: 'co_cp_02', label: 'Meter Present', value: 'Yes', type: 'yesno', required: true, marked: false, flagged: false },
            { id: 'co_cp_03', label: 'Meter Number', value: '4892-002', type: 'text', required: false, marked: false, flagged: false },
          ] as SurveyField[],
        },
        {
          id: 'compound_overview_sub',
          title: 'Compound Overview',
          fields: [
            { id: 'co_ov_01', label: 'Compound Shape', value: 'Rectangular', type: 'text', required: false, marked: false, flagged: false },
            { id: 'co_ov_02', label: 'Compound Size', value: '100ft x 80ft', type: 'text', required: false, marked: false, flagged: false },
            { id: 'co_ov_03', label: 'Compound Overview Photo', value: null, type: 'photo', required: true, marked: false, flagged: false },
          ] as SurveyField[],
        },
      ],
      items: undefined,
    },
    {
      id: 'deficiencies',
      title: 'Deficiencies',
      subsections: [],
      items: [
        {
          id: 'def_01',
          label: 'Vegetation',
          subsections: [{
            id: 'def_01_detail', title: 'Detail',
            fields: [
              { id: 'def_01_type', label: 'Issue', value: 'Vegetation', type: 'select', required: true, marked: false, flagged: false },
              { id: 'def_01_sev', label: 'Severity', value: 'Low', type: 'select', required: true, marked: false, flagged: false },
              { id: 'def_01_loc', label: 'Location', value: 'NW Corner', type: 'text', required: false, marked: false, flagged: false },
              { id: 'def_01_photo', label: 'Photo', value: 'veg_01.jpg', type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
        {
          id: 'def_02',
          label: 'Trash / Debris',
          subsections: [{
            id: 'def_02_detail', title: 'Detail',
            fields: [
              { id: 'def_02_type', label: 'Issue', value: 'Trash/debris in compound', type: 'select', required: true, marked: false, flagged: true },
              { id: 'def_02_sev', label: 'Severity', value: 'Medium', type: 'select', required: true, marked: false, flagged: false },
              { id: 'def_02_loc', label: 'Location', value: 'SE Gate area', type: 'text', required: false, marked: false, flagged: false },
              { id: 'def_02_photo', label: 'Photo', value: null, type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
        {
          id: 'def_03',
          label: 'Fence Damage',
          subsections: [{
            id: 'def_03_detail', title: 'Detail',
            fields: [
              { id: 'def_03_type', label: 'Issue', value: 'Fence damage', type: 'select', required: true, marked: false, flagged: false },
              { id: 'def_03_sev', label: 'Severity', value: 'High', type: 'select', required: true, marked: false, flagged: false },
              { id: 'def_03_loc', label: 'Location', value: 'East side', type: 'text', required: false, marked: false, flagged: false },
              { id: 'def_03_photo', label: 'Photo', value: 'fence_01.jpg', type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
      ],
    },
    {
      id: 'signage',
      title: 'Signage',
      subsections: [],
      items: [
        {
          id: 'sign_01',
          label: 'No Trespassing Sign',
          subsections: [{
            id: 'sign_01_detail', title: 'Sign Detail',
            fields: [
              { id: 'sign_01_type', label: 'Sign Type', value: 'No Trespassing', type: 'text', required: true, marked: false, flagged: false },
              { id: 'sign_01_cond', label: 'Condition', value: 'Good', type: 'select', required: true, marked: false, flagged: false },
              { id: 'sign_01_photo', label: 'Photo', value: 'sign_1.jpg', type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
        {
          id: 'sign_02',
          label: 'Warning Sign',
          subsections: [{
            id: 'sign_02_detail', title: 'Sign Detail',
            fields: [
              { id: 'sign_02_type', label: 'Sign Type', value: 'High Voltage', type: 'text', required: true, marked: false, flagged: false },
              { id: 'sign_02_cond', label: 'Condition', value: 'Fair', type: 'select', required: true, marked: false, flagged: false },
              { id: 'sign_02_photo', label: 'Photo', value: null, type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
      ],
    },
    {
      id: 'generators',
      title: 'Generators',
      subsections: [],
      items: [
        {
          id: 'gen_01',
          label: 'Generator #1',
          subsections: [{
            id: 'gen_01_detail', title: 'Generator Detail',
            fields: [
              { id: 'gen_01_make', label: 'Make', value: 'Generac', type: 'text', required: true, marked: false, flagged: false },
              { id: 'gen_01_model', label: 'Model', value: 'XD5000E', type: 'text', required: true, marked: false, flagged: false },
              { id: 'gen_01_fuel', label: 'Fuel Type', value: 'Diesel', type: 'select', required: true, marked: false, flagged: false },
              { id: 'gen_01_kw', label: 'Power Output (kW)', value: '5', type: 'number', required: false, marked: false, flagged: false },
              { id: 'gen_01_cond', label: 'Condition', value: 'Good', type: 'select', required: true, marked: false, flagged: false },
              { id: 'gen_01_photo', label: 'Photo', value: 'gen_01.jpg', type: 'photo', required: false, marked: false, flagged: false },
            ] as SurveyField[],
          }],
        },
      ],
    },
    {
      id: 'fuel_tanks',
      title: 'Fuel Tanks',
      subsections: [],
      items: [],
    },
    {
      id: 'carrier_facilities',
      title: 'Carrier Facilities',
      subsections: [],
      drillIn: true,
      items: [
        {
          id: 'cf_01',
          label: 'AT&T',
          subsections: [
            {
              id: 'cf_01_detail', title: 'Facility Info',
              fields: [
                { id: 'cf_01_carrier', label: 'Carrier Name', value: 'AT&T', type: 'text', required: true, marked: false, flagged: false },
                { id: 'cf_01_loc', label: 'Location', value: 'East', type: 'select', required: true, marked: false, flagged: false },
                { id: 'cf_01_meter', label: 'Power Meter Number', value: 'ATT-0042', type: 'text', required: false, marked: false, flagged: false },
                { id: 'cf_01_cond', label: 'Condition', value: 'Good', type: 'select', required: true, marked: false, flagged: false },
              ] as SurveyField[],
            },
            {
              id: 'cf_01_photos', title: 'Photos',
              fields: [
                { id: 'cf_01_overview', label: 'Overview Photo', value: 'att_overview.jpg', type: 'photo', required: true, marked: false, flagged: false },
                { id: 'cf_01_meter_photo', label: 'Power Meter Photo', value: 'att_meter.jpg', type: 'photo', required: true, marked: false, flagged: false },
                { id: 'cf_01_breaker', label: 'Breaker Photo', value: null, type: 'photo', required: false, marked: false, flagged: false },
              ] as SurveyField[],
            },
          ],
          subItems: {
            groupLabel: 'Feedlines',
            items: [
              { id: 'fl_01', label: '7/8" — 6 count', fields: [
                { id: 'fl_01_num', label: 'Count', value: '6', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_01_size', label: 'Size', value: '7/8"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
              { id: 'fl_02', label: '1/2" — 3 count', fields: [
                { id: 'fl_02_num', label: 'Count', value: '3', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_02_size', label: 'Size', value: '1/2"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
              { id: 'fl_03', label: '1/4" — 4 count', fields: [
                { id: 'fl_03_num', label: 'Count', value: '4', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_03_size', label: 'Size', value: '1/4"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
            ],
          },
        },
        {
          id: 'cf_02',
          label: 'Verizon',
          subsections: [
            {
              id: 'cf_02_detail', title: 'Facility Info',
              fields: [
                { id: 'cf_02_carrier', label: 'Carrier Name', value: 'Verizon', type: 'text', required: true, marked: false, flagged: false },
                { id: 'cf_02_loc', label: 'Location', value: 'West', type: 'select', required: true, marked: false, flagged: true },
                { id: 'cf_02_meter', label: 'Power Meter Number', value: null, type: 'text', required: false, marked: false, flagged: false },
                { id: 'cf_02_cond', label: 'Condition', value: 'Fair', type: 'select', required: true, marked: false, flagged: false },
              ] as SurveyField[],
            },
            {
              id: 'cf_02_photos', title: 'Photos',
              fields: [
                { id: 'cf_02_overview', label: 'Overview Photo', value: 'vz_overview.jpg', type: 'photo', required: true, marked: false, flagged: false },
                { id: 'cf_02_meter_photo', label: 'Power Meter Photo', value: null, type: 'photo', required: true, marked: false, flagged: false },
              ] as SurveyField[],
            },
          ],
          subItems: {
            groupLabel: 'Feedlines',
            items: [
              { id: 'fl_vz_01', label: '1-5/8" — 2 count', fields: [
                { id: 'fl_vz_01_num', label: 'Count', value: '2', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_vz_01_size', label: 'Size', value: '1-5/8"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
              { id: 'fl_vz_02', label: '7/8" — 4 count', fields: [
                { id: 'fl_vz_02_num', label: 'Count', value: '4', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_vz_02_size', label: 'Size', value: '7/8"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
              { id: 'fl_vz_03', label: '1/2" — 6 count', fields: [
                { id: 'fl_vz_03_num', label: 'Count', value: '6', type: 'number', required: true, marked: false, flagged: false },
                { id: 'fl_vz_03_size', label: 'Size', value: '1/2"', type: 'text', required: true, marked: false, flagged: false },
              ] as SurveyField[] },
            ],
          },
        },
      ],
    },
    {
      id: 'catch_all',
      title: 'Catch All',
      subsections: [],
      items: [
        {
          id: 'ca_01',
          label: 'Catch All #1',
          subsections: [
            {
              id: 'ca_01_detail',
              title: 'Detail',
              fields: [
                { id: 'ca_01_desc', label: 'Description', value: 'Overgrown vegetation around compound perimeter', type: 'textarea', required: false, marked: false, flagged: false },
                { id: 'ca_01_photo', label: 'Photo', value: null, type: 'photo', required: false, marked: false, flagged: false },
              ] as SurveyField[],
            },
          ],
        },
      ],
    },
    {
      id: 'flags',
      title: 'Flags',
      subsections: [],
      items: [],
    },
  ] as SurveySection[],
}

// ─── QA Dashboard ─────────────────────────────────────────────────────────────
export type SurveyType = 'Compound' | 'Structure Climb' | 'Structure Flight' | 'Service COP' | 'Plumb & Twist' | 'Guy Facilities'

export const mockDashboardSurveys = [
  { id: 'survey_001',    name: 'Compound Survey',     siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:17 PM',  status: 'In Progress', type: 'Compound'        as SurveyType },
  { id: 'survey_climb',  name: 'Structure Climb',     siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:18 PM',  status: 'In Progress', type: 'Structure Climb' as SurveyType },
  { id: 'survey_flight', name: 'Structure Flight',    siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:19 PM',  status: 'Not Started', type: 'Structure Flight' as SurveyType },
  { id: 'survey_cop',    name: 'Service COP',         siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:20 PM',  status: 'In Progress', type: 'Service COP'     as SurveyType },
  { id: 'survey_pt',     name: 'Plumb & Twist',       siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:21 PM',  status: 'In Progress', type: 'Plumb & Twist'   as SurveyType },
  { id: 'survey_guy',    name: 'Guy Facilities',      siteId: 'TX6100',  siteName: 'Orange - Claybar',    created: 'Mar 5, 2025 12:22 PM',  status: 'In Progress', type: 'Guy Facilities'  as SurveyType },
]

export const mockDashboardScans = [
  { id: 'scan_001', name: 'Guyed Tower LiDAR',          siteId: 'TX6100',  siteName: 'Orange - Claybar',       created: 'Oct 8, 2025 11:30 AM',  status: 'Completed',   type: 'LiDAR' },
  { id: 'scan_002', name: 'Structure Point Cloud',       siteId: 'NM10656', siteName: 'Antelope Drive Deming',  created: 'May 29, 2025 10:15 AM', status: 'In Progress', type: 'LiDAR' },
  { id: 'scan_003', name: 'Compound Drone Survey',       siteId: 'CA2201',  siteName: 'Vista Del Mar',          created: 'Mar 12, 2025 3:00 PM',  status: 'Not Started', type: 'Drone' },
  { id: 'scan_004', name: 'Monopole Full-Structure Scan',siteId: 'TX4450',  siteName: 'South Loop Industrial',  created: 'Jan 5, 2025 9:00 AM',   status: 'Completed',   type: 'LiDAR' },
]

export const mockDashboardSiteVisits = [
  { id: 'visit_001', name: 'Annual TIA Inspection',   siteId: 'TX6100',  siteName: 'Orange - Claybar',      created: 'Oct 8, 2025 11:02 AM',  surveyCount: 4, status: 'QA Review',   type: 'Inspection' },
  { id: 'visit_002', name: 'Routine Inspection',      siteId: 'NM10656', siteName: 'Antelope Drive Deming', created: 'May 29, 2025 9:15 AM',  surveyCount: 2, status: 'In Progress', type: 'Inspection' },
  { id: 'visit_003', name: 'Close-out Visit',         siteId: 'CA2201',  siteName: 'Vista Del Mar',         created: 'Mar 12, 2025 2:44 PM',  surveyCount: 3, status: 'Completed',   type: 'Close-out' },
  { id: 'visit_004', name: 'Initial Site Assessment', siteId: 'TX4450',  siteName: 'South Loop Industrial', created: 'Jan 5, 2025 8:30 AM',   surveyCount: 1, status: 'Completed',   type: 'Assessment' },
]

export const mockSitesList = [
  { id: 'TX6100',  name: 'Orange - Claybar',       state: 'TX', owner: 'TowerCo',            siteVisitsCount: 2, lastSiteVisitDate: 'Oct 8, 2025 11:02 AM',  created: 'Feb 14, 2022 9:30 AM',  status: 'active' },
  { id: 'NM10656', name: 'Antelope Drive Deming',  state: 'NM', owner: 'TowerCo',            siteVisitsCount: 1, lastSiteVisitDate: 'May 29, 2025 9:15 AM',  created: 'May 29, 2025 9:15 AM',  status: 'active' },
  { id: 'CA2201',  name: 'Vista Del Mar',           state: 'CA', owner: 'Crown Castle',       siteVisitsCount: 2, lastSiteVisitDate: 'Mar 12, 2025 2:44 PM',  created: 'Jun 3, 2021 10:15 AM',  status: 'active' },
  { id: 'TX4450',  name: 'South Loop Industrial',  state: 'TX', owner: 'SBA Communications',  siteVisitsCount: 1, lastSiteVisitDate: 'Jan 5, 2025 8:30 AM',   created: 'Jan 5, 2025 8:30 AM',   status: 'inactive' },
]
