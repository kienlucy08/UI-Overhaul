import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, FolderOpen, Users, Table2,
  BarChart3, Building2, ChevronLeft, ChevronRight,
  Bell, Settings, LogOut, Search, ChevronDown,
  Layers, FileCode2, Upload, Puzzle, type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'

type NavItem = {
  label: string
  icon: LucideIcon
  path: string
  children?: { label: string; icon: LucideIcon; path: string }[]
}

const navItems: NavItem[] = [
  {
    label: 'QA Dashboard', icon: LayoutDashboard, path: '/dashboard',
    children: [
      { label: 'Scope of Work', icon: Layers, path: '/dashboard/scope' },
      { label: 'Templates', icon: FileCode2, path: '/dashboard/templates' },
      { label: 'Survey Import', icon: Upload, path: '/dashboard/import' },
    ],
  },
  { label: 'Sites', icon: MapPin, path: '/sites' },
  { label: 'Projects', icon: FolderOpen, path: '/projects' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Table Builder', icon: Table2, path: '/table-builder' },
  { label: 'Table Analysis', icon: BarChart3, path: '/table-analysis' },
  { label: 'Organization', icon: Building2, path: '/organization' },
  { label: 'Components', icon: Puzzle, path: '/components' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isQCEditor = /\/surveys\/.*\/qc/.test(location.pathname)
  // Hide global nav by default when entering QC editor; restore when leaving
  const [topNavOpen, setTopNavOpen] = useState(!isQCEditor)
  useEffect(() => { setTopNavOpen(!isQCEditor) }, [isQCEditor])

  return (
    <div className="flex h-screen overflow-hidden bg-bg-gray-lm">
      {/* Sidebar — Dark Teal #002832 */}
      <aside
        className={clsx(
          'flex flex-col bg-sidebar text-white transition-all duration-200 ease-in-out flex-shrink-0',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 min-h-[60px]">
          <div className="flex-shrink-0 w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center">
            {/* Cool Turquoise logo mark */}
            <span className="text-white font-bold text-sm">FS</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-white text-base tracking-tight">FieldSync</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {!collapsed && (
            <p className="px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">
              Menu
            </p>
          )}
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ label, icon: Icon, path, children }) => {
              const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
              const hasChildren = children && children.length > 0 && !collapsed
              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        // Cool Turquoise active indicator on dark teal bg
                        ? 'bg-teal-400/20 text-teal-200 border border-teal-400/30'
                        : 'text-white/65 hover:bg-white/8 hover:text-white border border-transparent'
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      size={18}
                      className={clsx('flex-shrink-0', isActive ? 'text-teal-300' : '')}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1 font-medium">{label}</span>
                    )}
                  </NavLink>

                  {/* Sub-items — shown when parent is active */}
                  {hasChildren && isActive && (
                    <ul className="mt-1 ml-4 pl-3 border-l border-teal-400/20 space-y-0.5">
                      {children.map(({ label: cl, icon: CIcon, path: cp }) => (
                        <li key={cp}>
                          <NavLink
                            to={cp}
                            className={({ isActive: ca }) => clsx(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                              ca
                                ? 'bg-teal-400/15 text-teal-200'
                                : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                            )}
                          >
                            <CIcon size={14} className="flex-shrink-0" />
                            <span className="truncate">{cl}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse + version */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {!collapsed && (
            <p className="text-center text-[10px] text-white/25 mt-1">
              FieldSync v2025 · Software Releases
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar — hidden by default in QC editor */}
        {topNavOpen ? (
          <header className="bg-white border-b border-nav-gray px-6 py-3 flex items-center justify-between flex-shrink-0 min-h-[60px]">
            {/* Global search */}
            <div className="flex items-center gap-2 bg-bg-gray-lm border border-nav-gray rounded-lg px-3 py-2 w-72 max-w-sm">
              <Search size={16} className="text-std-gray-lm flex-shrink-0" />
              <input
                type="text"
                placeholder="Search sites, surveys, customers..."
                className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-hover-gray-lm transition-colors text-std-gray-lm">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-hover-gray-lm transition-colors text-std-gray-lm"
                onClick={() => navigate('/settings')}
              >
                <Settings size={18} />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-hover-gray-lm transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    LK
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-black leading-tight">lkien@fieldsync.io</p>
                    <p className="text-[11px] text-std-gray-lm leading-tight">FieldSync</p>
                  </div>
                  <ChevronDown size={14} className="text-std-gray-lm" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-nav-gray py-1 z-50">
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-black hover:bg-hover-gray-lm">
                      <Settings size={15} className="text-std-gray-lm" /> Settings
                    </button>
                    <hr className="my-1 border-nav-gray" />
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Collapse strip when in QC editor */}
              {isQCEditor && (
                <button
                  onClick={() => setTopNavOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"
                  title="Hide navigation bar"
                >
                  <ChevronDown size={15} className="rotate-180" />
                </button>
              )}
            </div>
          </header>
        ) : isQCEditor ? (
          /* Slim toggle strip — only shown in QC editor when nav is hidden */
          <div className="flex items-center justify-end px-4 py-1 bg-white border-b border-nav-gray/40 flex-shrink-0">
            <button
              onClick={() => setTopNavOpen(true)}
              className="flex items-center gap-1 text-[11px] text-std-gray-lm hover:text-black transition-colors"
            >
              <ChevronDown size={11} /> Show navigation
            </button>
          </div>
        ) : null}

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
