import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { settingsApi } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  BookMarked,
  Clock,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatRollNumber, getStudentAssignedLibrary } from '../../lib/utils';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([studentApi.getProfile(), settingsApi.getSettings()])
      .then(([profRes, setRes]) => {
        if (profRes.status === 'fulfilled' && profRes.value?.data) {
          setProfile(profRes.value.data);
        }
        if (setRes.status === 'fulfilled') {
          const sData = setRes.value?.data?.data || setRes.value?.data;
          if (sData) setSettings(sData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const userRoll = formatRollNumber(profile?.rollNumber || user?.studentProfile?.rollNumber || user?.username);
  const assignedCampus = getStudentAssignedLibrary(profile || user?.studentProfile || userRoll);
  const gender = profile?.gender ? profile.gender.toUpperCase() : 'STUDENT';
  const accessDisplayText = gender === 'MALE'
    ? 'KIET & KIET 2 Libraries'
    : gender === 'FEMALE'
    ? 'All 3 Libraries (Universal Access)'
    : assignedCampus;

  const emailDisplay = profile?.email && profile.email.trim() ? profile.email.trim() : 'N/A';
  const phoneDisplay = profile?.phone && profile.phone.trim() ? profile.phone.trim() : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative pb-10">
      {/* Subtle Library Book Line-Art Background Watermark (Unobtrusive & Elegant) */}
      <div className="absolute top-12 right-4 -z-10 pointer-events-none opacity-[0.07] dark:opacity-[0.05] select-none">
        <svg width="280" height="280" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle Open Book Line Art */}
          <path d="M100 60 C80 40 40 40 20 48 L20 150 C40 142 80 142 100 162 C120 142 160 142 180 150 L180 48 C160 40 120 40 100 60 Z" stroke="#8D6B94" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M100 60 L100 162" stroke="#8D6B94" strokeWidth="2" strokeLinecap="round" />
          {/* Subtle Shelf Silhouettes */}
          <path d="M10 175 L190 175" stroke="#8D6B94" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 175 L35 152 M45 175 L45 146 M55 175 L55 150" stroke="#8D6B94" strokeWidth="2" strokeLinecap="round" />
          <path d="M145 175 L145 148 M155 175 L155 145 M165 175 L165 152" stroke="#8D6B94" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-[#8D6B94] dark:text-[#B185A7] mb-1">
          <BookMarked className="w-3.5 h-3.5" />
          <span>KDL Institutional Membership</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">
          Student Profile & Library Credentials
        </h1>
        <p className="text-xs sm:text-sm text-[#7A697E] dark:text-[#B8A6BD] mt-1 max-w-2xl font-medium">
          Official academic membership record, institutional library privileges, and multi-campus circulation clearance.
        </p>
      </div>

      {/* 1. PROFILE HERO IDENTITY CARD (DIGITAL LIBRARY SMART CARD) */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8DBC5] dark:border-[#3B3142] bg-gradient-to-br from-[#FFF4E9] via-white to-[#E8DBC5]/40 dark:from-[#211A24] dark:via-[#261E2B] dark:to-[#1C1721] p-6 sm:p-8 shadow-sm transition-all">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#8D6B94]/10 dark:bg-[#8D6B94]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#C3A29E]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar + Primary Identification Details */}
          <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#8D6B94] to-[#6D5073] text-[#FFF4E9] flex items-center justify-center font-black text-xl sm:text-2xl shadow-md border-2 border-white dark:border-[#3B3142]">
                {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-white dark:border-[#211A24]" title="Active Member">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] font-bold text-[10px] uppercase tracking-wider">
                  Student Member
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FFF4E9] dark:bg-[#302731] border border-[#E8DBC5] dark:border-[#3B3142] text-[#2B232E] dark:text-[#FFF4E9] font-mono text-[11px] font-bold">
                  {userRoll}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#2B232E] dark:text-[#FFF4E9] tracking-tight uppercase leading-tight truncate">
                {profile?.name || userRoll}
              </h2>

              <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1 font-medium flex items-center gap-2 flex-wrap">
                <span>{profile?.department || 'Department'}</span>
                <span>•</span>
                <span>Year {profile?.academicYear || 1} (Sec {profile?.section || 'A'})</span>
                <span>•</span>
                <span className="text-[#8D6B94] dark:text-[#B185A7] font-semibold">{assignedCampus}</span>
              </p>
            </div>
          </div>

          {/* Account Status Badges */}
          <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#2B232E] border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Active • Good Standing
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#2B232E] border border-[#E8DBC5] dark:border-[#3B3142] shadow-2xs text-xs font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
              <span className="w-2 h-2 rounded-full bg-[#8D6B94] mr-1.5 shrink-0" />
              {assignedCampus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN CREDENTIALS & CIRCULATION PRIVILEGES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Academic & Institutional Registry */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26] rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] bg-[#FFF4E9]/40 dark:bg-[#1A151E]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Academic Registry
                </CardTitle>
                <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                  Official department & institutional enrollment
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Department */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Department / Branch
                </span>
                <span className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {profile?.department || 'N/A'}
                </span>
              </div>
            </div>

            {/* Academic Year & Section */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Academic Standing
                </span>
                <span className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Year {profile?.academicYear || 1} • Section {profile?.section || 'A'}
                </span>
              </div>
            </div>

            {/* Campus Allocation */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Assigned Library & Campus
                </span>
                <span className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {assignedCampus}
                </span>
              </div>
            </div>

            {/* Gender & Access Classification */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Library Entry Access
                </span>
                <span className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {accessDisplayText}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Verified Communication & Contact Information */}
        <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26] rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] bg-[#FFF4E9]/40 dark:bg-[#1A151E]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  Contact & Portal Credentials
                </CardTitle>
                <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                  Verified contact points and account authentication
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Email Address */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Institutional Email
                </span>
                <span className="text-sm font-semibold text-[#2B232E] dark:text-[#FFF4E9] break-all">
                  {emailDisplay}
                </span>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Contact Telephone
                </span>
                <span className="text-sm font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                  {phoneDisplay}
                </span>
              </div>
            </div>

            {/* Roll Number Identifier */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Permanent Roll ID
                </span>
                <span className="text-sm font-mono font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {userRoll}
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-[#FFF4E9] dark:bg-[#2C2330] text-[#8D6B94] dark:text-[#B185A7] shrink-0 mt-0.5 border border-[#E8DBC5]/60 dark:border-[#3B3142]">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider block">
                  Authentication Security
                </span>
                <span className="text-sm font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                  Verified Institutional Session
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. LIBRARY MEMBERSHIP PRIVILEGES & CIRCULATION TERMS */}
      <Card className="border-[#E8DBC5] dark:border-[#3B3142] shadow-sm bg-white dark:bg-[#211C26] rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#E8DBC5]/60 dark:border-[#3B3142] bg-[#FFF4E9]/40 dark:bg-[#1A151E]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7]">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                Circulation Privileges & Policy Guidelines
              </CardTitle>
              <CardDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                Standard borrowing limits and lending entitlements under your student membership
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#28202D] border border-[#E8DBC5]/80 dark:border-[#3B3142] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider block">
                Borrowing Limit
              </span>
              <p className="text-sm font-black text-[#2B232E] dark:text-[#FFF4E9]">
                {settings?.defaultMaxBorrowLimit ?? settings?.maxBooksPerStudent ?? 3} Books
              </p>
              <p className="text-[11px] text-[#7A697E] dark:text-[#D1C2D4]">
                Concurrently active loans
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#28202D] border border-[#E8DBC5]/80 dark:border-[#3B3142] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider block">
                Loan Duration
              </span>
              <p className="text-sm font-black text-[#2B232E] dark:text-[#FFF4E9]">
                {settings?.standardLoanDurationDays ?? settings?.defaultLoanDays ?? 14} Days
              </p>
              <p className="text-[11px] text-[#7A697E] dark:text-[#D1C2D4]">
                Per book issue cycle
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#28202D] border border-[#E8DBC5]/80 dark:border-[#3B3142] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider block">
                Overdue Rate
              </span>
              <p className="text-sm font-black text-[#2B232E] dark:text-[#FFF4E9]">
                ₹{Number(settings?.fineRatePerOverdueDay ?? settings?.finePerDay ?? 1).toFixed(2)} / day
              </p>
              <p className="text-[11px] text-[#7A697E] dark:text-[#D1C2D4]">
                Applies past due date
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#28202D] border border-[#E8DBC5]/80 dark:border-[#3B3142] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] tracking-wider block">
                Gate Verification
              </span>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                Authorized
              </p>
              <p className="text-[11px] text-[#7A697E] dark:text-[#D1C2D4]">
                Instant turnstile clearance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
