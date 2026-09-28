import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  UserPlus,
  Users,
  BookOpen,
  BookMarked,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Bell,
  BarChart3,
  Settings,
  ShieldAlert,
  Building2,
  UserCheck,
  ClipboardCheck,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn, formatRollNumber, getStudentAssignedLibrary } from '../../lib/utils';

// Unique Library-Themed Micro-Animation Component for "Knowledge Builds Tomorrow"
const KnowledgeBuildsCard = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 650);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden p-3.5 rounded-xl bg-gradient-to-br from-[#FFF4E9] via-[#E8DBC5]/40 to-[#FFF4E9] dark:from-[#2B232E] dark:via-[#352B3A] dark:to-[#2B232E] border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs transition-all">
      {/* Card Header with Page Dots */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-[#8D6B94] dark:text-[#B185A7]">
          <div className="p-1 rounded-md bg-[#8D6B94]/15 animate-float-subtle">
            <BookMarked className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8D6B94] dark:text-[#B185A7]">
            Library Motto
          </span>
        </div>
        <div className="flex space-x-1">
          <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 0 ? 'bg-[#8D6B94] w-3' : 'bg-[#C3A29E]/50 w-1.5'}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'bg-[#8D6B94] w-3' : 'bg-[#C3A29E]/50 w-1.5'}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#8D6B94] w-3' : 'bg-[#C3A29E]/50 w-1.5'}`} />
        </div>
      </div>

      {/* Sequential Text Reveal */}
      <div className="min-h-[38px] flex flex-col justify-center">
        <div className="text-xs font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight flex items-center flex-wrap gap-x-1.5">
          <span className="text-[#8D6B94] dark:text-[#B185A7] animate-word-reveal">Knowledge</span>
          {step >= 1 && (
            <span className="text-[#2B232E] dark:text-[#FFF4E9] animate-word-reveal">Builds</span>
          )}
          {step >= 2 && (
            <span className="text-[#8D6B94] dark:text-[#B185A7] underline decoration-[#C3A29E] underline-offset-2 animate-word-reveal">
              Tomorrow
            </span>
          )}
        </div>

        {/* Thin Animated Page Line Underline */}
        <div className="mt-2 h-0.5 w-full bg-[#E8DBC5]/80 dark:bg-[#3B3142] rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-[#8D6B94] to-[#C3A29E] transition-all duration-500 ease-out ${
              step === 0 ? 'w-1/3' : step === 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        </div>
      </div>

      <p className="text-[9px] font-semibold text-[#7A697E] dark:text-[#B8A6BD] mt-2 flex items-center justify-between">
        <span>KDL - KIET Digital Library</span>
        <Sparkles className="w-2.5 h-2.5 text-[#8D6B94]" />
      </p>
    </div>
  );
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, user, librarianProfile, studentProfile } = useAuth();
  const location = useLocation();

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Search Catalog', path: '/student/books', aliases: ['/student/catalog'], icon: BookOpen },
    { name: 'Borrowing History', path: '/student/history', aliases: ['/student/current-books'], icon: BookMarked },
    { name: 'My Fines', path: '/student/fines', icon: DollarSign },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
    { name: 'My Profile', path: '/student/profile', icon: User },
  ];

  const facultyLinks = [
    { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/faculty/profile', icon: User },
    { name: 'Search Catalog', path: '/faculty/books', aliases: ['/faculty/catalog'], icon: BookOpen },
    { name: 'Borrowing History', path: '/faculty/history', aliases: ['/faculty/current-books'], icon: BookMarked },
    { name: 'My Fines', path: '/faculty/fines', icon: DollarSign },
    { name: 'Notifications', path: '/faculty/notifications', icon: Bell },
  ];

  const librarianLinks = [
    { name: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
    { name: 'User Registration', path: '/librarian/users/register', aliases: ['/librarian/students/register'], icon: UserPlus },
    { name: 'User Directory', path: '/librarian/users', aliases: ['/librarian/students'], icon: Users },
    { name: 'Book Inventory', path: '/librarian/inventory', aliases: ['/librarian/books'], icon: BookOpen },
    { name: 'Issue Book', path: '/librarian/issue', icon: ArrowUpRight },
    { name: 'Return Book', path: '/librarian/return', icon: ArrowDownLeft },
    { name: 'Fine Clearance', path: '/librarian/fines', aliases: ['/librarian/fines-deposits', '/librarian/deposits'], icon: DollarSign },
    { name: 'TC Clearance', path: '/librarian/tc-clearance', icon: ClipboardCheck },
    { name: 'Library Reports', path: '/librarian/reports', icon: BarChart3 },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Libraries', path: '/admin/libraries', icon: Building2 },
    { name: 'Librarians', path: '/admin/librarians', icon: UserCheck },
    { name: 'User Directory', path: '/admin/users', aliases: ['/admin/students'], icon: Users },
    { name: 'Fine Clearance', path: '/admin/fines', aliases: ['/admin/fines-deposits'], icon: DollarSign },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', path: '/admin/audit', aliases: ['/admin/audit-logs'], icon: ShieldAlert },
  ];

  const entranceLinks = [
    { name: 'Entrance Dashboard', path: '/library-entrance/dashboard', icon: LayoutDashboard },
  ];

  let links = [];
  if (role === 'STUDENT') links = studentLinks;
  if (role === 'FACULTY') links = facultyLinks;
  if (role === 'LIBRARIAN') links = librarianLinks;
  if (role === 'ADMIN') links = adminLinks;
  if (role === 'LIBRARY_ENTRANCE') links = entranceLinks;

  const studentAssignedLib = getStudentAssignedLibrary(studentProfile || user?.studentProfile || user?.username);
  const assignedLibraryName = role === 'LIBRARIAN'
    ? (librarianProfile?.assignedLibrary?.name || 'Assigned Library')
    : role === 'STUDENT'
    ? studentAssignedLib
    : `${role} Operations`;

  // Close sidebar on Escape key press without blocking background interactions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavClick = () => {
    // Only auto-close on mobile/tablet screens (< 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile-Only Backdrop Overlay when Sidebar is Open (< 1024px) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[#161219]/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Responsive Navigation Sidebar Shell */}
      <aside
        className={cn(
          // Base mobile drawer (off-canvas overlay)
          'fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] h-full max-h-dvh bg-white dark:bg-[#1C1721] border-r border-[#E8DBC5] dark:border-[#3B3142] shadow-2xl flex flex-col transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop in-flow column (side-by-side with main content)
          'lg:relative lg:flex-none lg:h-full lg:max-h-screen lg:max-h-dvh lg:z-20 lg:shadow-none',
          isOpen
            ? 'lg:w-72 lg:min-w-[18rem] lg:translate-x-0 lg:opacity-100'
            : 'lg:w-0 lg:min-w-0 lg:translate-x-0 lg:border-r-0 lg:overflow-hidden lg:pointer-events-none lg:opacity-0'
        )}
      >
        {/* Fixed Width Inner Wrapper to prevent squashing during transition */}
        <div className="w-72 h-full flex flex-col shrink-0 overflow-hidden">
          {/* Sidebar Top Header with Assigned Library & Close Trigger (Height matches TopNav h-16) */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#E8DBC5] dark:border-[#3B3142] bg-[#FFF4E9]/60 dark:bg-[#2B232E]/40 shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
              <div className="p-2 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#8D6B94] dark:text-[#B185A7] leading-none">
                  Assigned Library
                </p>
                <p className="text-xs font-semibold text-[#2B232E] dark:text-[#FFF4E9] truncate mt-1 leading-tight">
                  {assignedLibraryName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#7A697E] hover:text-[#2B232E] dark:text-[#D1C2D4] dark:hover:text-white rounded-lg hover:bg-[#FFF4E9] dark:hover:bg-[#2B232E] transition-colors focus:outline-none cursor-pointer shrink-0"
              title="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;

              const isExactMatch = location.pathname === link.path;
              const isAliasMatch = link.aliases && link.aliases.includes(location.pathname);
              const hasExactOrAliasAnywhere = links.some(
                (l) => l.path === location.pathname || (l.aliases && l.aliases.includes(location.pathname))
              );
              const isSubPathMatch =
                !hasExactOrAliasAnywhere &&
                location.pathname.startsWith(`${link.path}/`) &&
                !links.some(
                  (other) =>
                    other.path !== link.path &&
                    other.path.length > link.path.length &&
                    location.pathname.startsWith(other.path)
                );

              const isActive = isExactMatch || isAliasMatch || isSubPathMatch;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 my-0.5 rounded-xl text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-md font-semibold dark:bg-[#8D6B94]'
                      : 'text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#E8DBC5]/40 dark:hover:bg-[#2B232E] hover:text-[#8D6B94] dark:hover:text-[#B185A7]'
                  )}
                >
                  <div className="flex items-center">
                    <Icon
                      className={cn(
                        'w-4 h-4 mr-3 transition-colors shrink-0',
                        isActive
                          ? 'text-[#FFF4E9]'
                          : 'text-[#8D6B94] dark:text-[#B185A7] group-hover:text-[#8D6B94]'
                      )}
                    />
                    <span>{link.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer with Animated Knowledge Builds Tomorrow Feature Card */}
          <div className="p-3.5 border-t border-[#E8DBC5]/80 dark:border-[#3B3142] bg-[#FFF4E9]/60 dark:bg-[#1A151E] space-y-3 shrink-0">
            <KnowledgeBuildsCard />

            {/* User Profile Pill */}
            <div className="flex items-center space-x-3 pt-1 px-1">
              <div className="h-8 w-8 rounded-full bg-[#8D6B94] text-[#FFF4E9] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold font-mono uppercase text-[#2B232E] dark:text-[#FFF4E9] truncate">
                  {role === 'STUDENT' ? formatRollNumber(studentProfile?.rollNumber || user?.username || 'User') : (user?.username || 'User')}
                </p>
                <p className="text-[10px] text-[#8D6B94] dark:text-[#B185A7] uppercase font-semibold">
                  {role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
