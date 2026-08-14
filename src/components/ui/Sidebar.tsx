'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Menu,
  X,
  type LucideIcon,
  // Common icons used in sidebars — map by name
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  FileText,
  Settings,
  BarChart3,
  Bell,
  MessageSquare,
  Shield,
  CreditCard,
  Heart,
  Star,
  Home,
  Search,
  Plus,
  HelpCircle,
  Globe,
  Tag,
  Layers,
  BookOpen,
  Award,
  Bookmark,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Package,
  Mail,
  Phone,
  MapPin,
  Image,
  Upload,
  Download,
  Link as LinkIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserPlus,
  UserCheck,
  UserX,
  Activity,
  PieChart,
  Database,
  Server,
  Code,
  Terminal,
  Folder,
  File,
  Trash2,
  Edit,
  Copy,
  Share2,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  Target,
  Lightbulb,
  Sparkles,
  Crown,
  Gem,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Briefcase, Users, Building2, FileText, Settings,
  BarChart3, Bell, MessageSquare, Shield, CreditCard, Heart, Star,
  Home, Search, Plus, HelpCircle, Globe, Tag, Layers, BookOpen,
  Award, Bookmark, Clock, Calendar, CheckCircle, AlertCircle, Zap,
  TrendingUp, Package, Mail, Phone, MapPin, Image, Upload, Download,
  Link: LinkIcon, ExternalLink, Eye, EyeOff, Lock, Unlock,
  UserPlus, UserCheck, UserX, Activity, PieChart, Database, Server,
  Code, Terminal, Folder, File, Trash2, Edit, Copy, Share2, Filter,
  SlidersHorizontal, RefreshCw, MoreHorizontal, ChevronRight,
  ChevronDown, ArrowLeft, ArrowRight, Flag, Target, Lightbulb,
  Sparkles, Crown, Gem, Menu, X, LogOut, PanelLeft, PanelLeftClose,
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SidebarItem {
  label: string;
  tamilLabel?: string;
  icon: string; // icon name from ICON_MAP
  href: string;
  badge?: string | number;
}

export interface SidebarUser {
  name: string;
  email?: string;
  avatar?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
  portalTitle: string;
  portalIcon?: string;
  user?: SidebarUser;
  onLogout?: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: resolve icon                                               */
/* ------------------------------------------------------------------ */

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function Sidebar({
  items,
  collapsed,
  onToggle,
  portalTitle,
  portalIcon = 'LayoutDashboard',
  user,
  onLogout,
  className = '',
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const PortalIcon = useMemo(() => resolveIcon(portalIcon), [portalIcon]);

  /* ---- Shared nav content ---- */
  const navContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* ── Brand ── */}
      <div className="px-4 h-16 flex items-center gap-3 shrink-0 border-b border-gray-100">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <PortalIcon className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-base font-bold text-gray-900 font-[Outfit] overflow-hidden whitespace-nowrap"
            >
              {portalTitle}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 no-scrollbar">
        {items.map((item) => {
          const Icon = resolveIcon(item.icon);
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className="group relative block"
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <div
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white'
                  }`}
              >
                {/* Active glow bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full
                      bg-gradient-to-b from-purple-500 to-indigo-500"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-purple-400' : ''}`}
                  strokeWidth={isActive ? 2 : 1.6}
                />

                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {item.badge != null && (!collapsed || isMobile) && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    bg-purple-600/20 text-purple-300 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed badge dot */}
                {item.badge != null && collapsed && !isMobile && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
                )}
              </div>

              {/* Tooltip in collapsed mode (desktop only) */}
              {collapsed && !isMobile && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-3 py-1.5
                    rounded-lg bg-[rgba(15,15,30,0.95)] border border-gray-200 text-xs text-white
                    font-medium whitespace-nowrap opacity-0 pointer-events-none
                    group-hover:opacity-100 transition-opacity duration-200 z-50
                    shadow-lg"
                >
                  {item.label}
                  {item.badge != null && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section: User ── */}
      {user && (
        <div className="shrink-0 border-t border-gray-100 px-3 py-3">
          <div className={`flex items-center gap-3 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
            {/* Avatar */}
            <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-white/35 truncate">{user.email}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {onLogout && (!collapsed || isMobile) && (
              <button
                onClick={onLogout}
                className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-rose-400
                  hover:bg-red-100 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Collapse toggle (desktop) ── */}
      {!isMobile && (
        <div className="shrink-0 border-t border-gray-100 px-3 py-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
              text-white/30 hover:text-white/60 hover:bg-white transition-all text-xs"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-40
          border-r border-gray-100 ${className}`}
        style={{
          background: 'rgba(10,10,26,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {navContent(false)}
      </motion.aside>

      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl
          bg-[rgba(10,10,26,0.9)] border border-gray-200 backdrop-blur-xl
          text-white/60 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              key="mobile-drawer"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col
                border-r border-gray-100"
              style={{
                background: 'rgba(10,10,26,0.98)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30
                  hover:text-white/60 hover:bg-white transition-all z-10"
                aria-label="Close menu"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {navContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
