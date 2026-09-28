import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/studentApi';
import { facultyApi } from '../../api/facultyApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { UserPlus, CheckCircle2, ShieldAlert, Building, GraduationCap, Briefcase, UploadCloud, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRollNumber } from '../../lib/utils';

export const RegisterUser = () => {
  const navigate = useNavigate();
  const { librarianProfile, user } = useAuth();

  const assignedLibObj = librarianProfile?.assignedLibrary || user?.assignedLibrary;
  const assignedLibraryName = assignedLibObj?.name || 'KIET Library';
  const assignedLibraryCode = (assignedLibObj?.code || '').toUpperCase();
  const isWomenOnly = assignedLibObj?.isWomenOnly || assignedLibraryCode === 'KIET_WOMEN';
  const isWomenLib = assignedLibraryCode === 'KIET_WOMEN' || isWomenOnly;

  const [userType, setUserType] = useState('STUDENT'); // 'STUDENT' or 'FACULTY'

  const genderOptions = isWomenLib
    ? [{ value: 'FEMALE', label: 'FEMALE (All 3 Libraries Access)' }]
    : [
        { value: 'MALE', label: 'MALE (KIET & KIET 2 Access)' },
        { value: 'FEMALE', label: 'FEMALE (All 3 Libraries Access)' },
      ];

  const branchOptions = isWomenLib
    ? [
        { value: 'AIDS', label: 'AIDS - AI & Data Science' },
        { value: 'CAI', label: 'CAI - Computer Applications & Informatics' },
        { value: 'CSM', label: 'CSM - CS & ML' },
      ]
    : [
        { value: 'AIDS', label: 'AIDS - AI & Data Science' },
        { value: 'CSM', label: 'CSM - CS & ML' },
        { value: 'CSD', label: 'CSD - Computer Science & Design' },
        { value: 'CAI', label: 'CAI - Computer Applications & Informatics' },
        { value: 'CSC', label: 'CSC - CS & Cybersecurity' },
      ];

  const [studentForm, setStudentForm] = useState({
    rollNumber: '',
    name: '',
    email: '',
    phone: '',
    gender: isWomenLib ? 'FEMALE' : 'MALE',
    department: '',
    academicYear: '1',
    password: '',
  });

  const [facultyForm, setFacultyForm] = useState({
    facultyId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (isWomenLib && studentForm.gender !== 'FEMALE') {
      setStudentForm((prev) => ({ ...prev, gender: 'FEMALE' }));
    }
  }, [isWomenLib]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkYear, setBulkYear] = useState('1');
  const [bulkDept, setBulkDept] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const handleTypeSwitch = (type) => {
    setUserType(type);
    setErrorMsg(null);
    setSuccessMsg(null);
    setBulkResult(null);
    if (type === 'FACULTY') {
      setStudentForm({
        rollNumber: '',
        name: '',
        email: '',
        phone: '',
        gender: isWomenLib ? 'FEMALE' : 'MALE',
        department: '',
        academicYear: '1',
        password: '',
      });
    } else if (type === 'STUDENT') {
      setFacultyForm({
        facultyId: '',
        name: '',
        email: '',
        phone: '',
        password: '',
      });
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'HTNO,NAME,DEPARTMENT,GENDER,ACADEMIC_YEAR,EMAIL,PHONE\n' +
      '25B21A4201,KADA MAHESH BHAGAVAN,CSM,MALE,1,student@kiet.edu,9876543210\n' +
      '25JN1A4501,ANITHA K,AIDS,FEMALE,1,anitha@kiet.edu,9876543211\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_bulk_registration_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm({
      ...studentForm,
      [name]: name === 'rollNumber' ? (value ?? '').toUpperCase() : value,
    });
  };

  const handleFacultyChange = (e) => {
    const { name, value } = e.target;
    setFacultyForm({
      ...facultyForm,
      [name]: name === 'facultyId' ? (value ?? '').toUpperCase() : value,
    });
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setErrorMsg('Please select an Excel (.xlsx, .xls) or CSV (.csv) file to upload.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setBulkResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      if (bulkYear) formData.append('academicYear', bulkYear);
      if (bulkDept) formData.append('department', bulkDept);

      const res = await studentApi.bulkImportFile(formData);
      const data = res?.data;
      if (data) {
        setBulkResult(data);
        setSuccessMsg(
          `Bulk upload complete! ${data.successfulCount} student accounts registered successfully (${data.failedCount} failed/skipped).`
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userType === 'BULK_STUDENT') {
      return handleBulkSubmit(e);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (userType === 'STUDENT') {
        if (!studentForm.rollNumber || !studentForm.name || !studentForm.password) {
          setErrorMsg('Please fill in all mandatory fields (Roll Number, Full Name, Password)');
          setLoading(false);
          return;
        }

        if (!studentForm.department) {
          setErrorMsg('Please select a valid Department / Branch');
          setLoading(false);
          return;
        }

        if (isWomenLib && studentForm.gender === 'MALE') {
          setErrorMsg("Male students cannot be registered through KIET Women's Library.");
          setLoading(false);
          return;
        }

        const res = await studentApi.registerStudent({
          rollNumber: studentForm.rollNumber.trim().toUpperCase(),
          name: studentForm.name.trim(),
          gender: isWomenLib ? 'FEMALE' : studentForm.gender,
          department: studentForm.department,
          academicYear: parseInt(studentForm.academicYear, 10),
          email: studentForm.email ? studentForm.email.trim() : '',
          phone: studentForm.phone ? studentForm.phone.trim() : '',
          password: studentForm.password,
        });

        if (res?.data) {
          setSuccessMsg(`Student ${res.data.name} (${formatRollNumber(res.data.rollNumber)}) registered successfully!`);
          setStudentForm({
            rollNumber: '',
            name: '',
            email: '',
            phone: '',
            gender: isWomenLib ? 'FEMALE' : 'MALE',
            department: '',
            academicYear: '1',
            password: '',
          });
        }
      } else {
        // FACULTY registration
        if (!facultyForm.facultyId || !facultyForm.name || !facultyForm.email || !facultyForm.phone || !facultyForm.password) {
          setErrorMsg('Please fill in all required faculty fields (Faculty ID, Full Name, Email, Phone, Password)');
          setLoading(false);
          return;
        }

        const res = await facultyApi.registerFaculty({
          facultyId: facultyForm.facultyId.trim().toUpperCase(),
          fullName: facultyForm.name.trim(),
          name: facultyForm.name.trim(),
          email: facultyForm.email.trim().toLowerCase(),
          phone: facultyForm.phone.trim(),
          password: facultyForm.password,
        });

        if (res?.data) {
          setSuccessMsg(`Faculty member ${res.data.name || res.data.fullName} (${res.data.facultyId}) registered successfully!`);
          setFacultyForm({
            facultyId: '',
            name: '',
            email: '',
            phone: '',
            password: '',
          });
        }

      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2">
          <UserPlus className="h-6 w-6 text-[#8D6B94] dark:text-[#B185A7]" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">REGISTER NEW USER</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Register students and faculty for centralized library access, or bulk import via spreadsheet.
        </p>
      </div>

      <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">User Registration</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Select mode: Single Student, Single Faculty, or Bulk File Upload.
              </CardDescription>
            </div>
            <Badge variant={isWomenOnly ? 'danger' : 'default'} className="px-2.5 py-1 text-xs">
              <Building className="w-3 h-3 mr-1 inline-block" />
              {assignedLibraryName}
            </Badge>
          </div>

          {/* USER TYPE Selector Buttons */}
          <div className="pt-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
              REGISTRATION MODE
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeSwitch('STUDENT')}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  userType === 'STUDENT'
                    ? 'bg-white dark:bg-[#8D6B94] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('FACULTY')}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  userType === 'FACULTY'
                    ? 'bg-white dark:bg-[#8D6B94] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSwitch('BULK_STUDENT')}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                  userType === 'BULK_STUDENT'
                    ? 'bg-white dark:bg-[#8D6B94] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Upload</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Registration Error</span>
                </div>
                <p className="text-xs">{errorMsg}</p>
              </Alert>
            )}

            {successMsg && (
              <Alert variant="success">
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Registration Successful!</span>
                </div>
                <p className="text-xs">{successMsg}</p>
              </Alert>
            )}

            {userType === 'STUDENT' ? (
              /* STUDENT FORM */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Roll Number *
                  </label>
                  <Input
                    name="rollNumber"
                    placeholder="e.g. 210001"
                    value={studentForm.rollNumber}
                    onChange={handleStudentChange}
                    className="font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <Input
                    name="name"
                    placeholder="e.g. Rahul Sharma"
                    value={studentForm.name}
                    onChange={handleStudentChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Gender *
                  </label>
                  <Select name="gender" value={studentForm.gender} onChange={handleStudentChange}>
                    {genderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Department / Branch *
                  </label>
                  <Select name="department" value={studentForm.department} onChange={handleStudentChange} required>
                    <option value="" disabled>
                      Select Department / Branch
                    </option>
                    {branchOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Academic Year *
                  </label>
                  <Select name="academicYear" value={studentForm.academicYear} onChange={handleStudentChange}>
                    <option value="1">Year 1 (1st Year)</option>
                    <option value="2">Year 2 (2nd Year)</option>
                    <option value="3">Year 3 (3rd Year)</option>
                    <option value="4">Year 4 (Final Year)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="student@kiet.edu"
                    value={studentForm.email}
                    onChange={handleStudentChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    placeholder="9876543210"
                    value={studentForm.phone}
                    onChange={handleStudentChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Login Password *
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={studentForm.password}
                    onChange={handleStudentChange}
                    required
                  />
                </div>
              </div>
            ) : userType === 'FACULTY' ? (
              /* FACULTY FORM */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Faculty ID *
                  </label>
                  <Input
                    name="facultyId"
                    placeholder="e.g. FAC001"
                    value={facultyForm.facultyId}
                    onChange={handleFacultyChange}
                    className="font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <Input
                    name="name"
                    placeholder="e.g. Dr. A. K. Verma"
                    value={facultyForm.name}
                    onChange={handleFacultyChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="faculty@kiet.edu"
                    value={facultyForm.email}
                    onChange={handleFacultyChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phone Number *
                  </label>
                  <Input
                    name="phone"
                    placeholder="9876543210"
                    value={facultyForm.phone}
                    onChange={handleFacultyChange}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Login Password *
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={facultyForm.password}
                    onChange={handleFacultyChange}
                    required
                  />
                </div>
              </div>
            ) : (
              /* BULK UPLOAD FORM */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#8D6B94] dark:text-[#B185A7]" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Bulk Import via Excel or CSV
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Supports college sheets (.xlsx, .xls, .csv) with Roll Number / HTNO and Name.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-xs text-[#8D6B94] dark:text-[#B185A7] border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download CSV Template
                  </Button>
                </div>

                {/* File Dropzone */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-[#8D6B94] transition-all bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    id="bulk-file-input"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setBulkFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="bulk-file-input" className="cursor-pointer flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#8D6B94]/10 dark:bg-[#8D6B94]/20 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6 text-[#8D6B94] dark:text-[#B185A7]" />
                    </div>
                    {bulkFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                          {bulkFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(bulkFile.size / 1024).toFixed(1)} KB — Click to choose a different file
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Click to browse or drag and drop spreadsheet here
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Excel (.xlsx, .xls) or CSV (.csv) up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Optional Fallback Overrides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Default Academic Year (If missing in row)
                    </label>
                    <Select value={bulkYear} onChange={(e) => setBulkYear(e.target.value)}>
                      <option value="1">Year 1 (1st Year Freshers)</option>
                      <option value="2">Year 2 (2nd Year)</option>
                      <option value="3">Year 3 (3rd Year)</option>
                      <option value="4">Year 4 (Final Year)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Department (Optional Fallback)
                    </label>
                    <Select value={bulkDept} onChange={(e) => setBulkDept(e.target.value)}>
                      <option value="">Auto-detect from sheet name or row</option>
                      {branchOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Default Account Credentials:</p>
                  <p>• <strong>Username:</strong> Lowercase Roll Number (e.g. 25b21a4201)</p>
                  <p>• <strong>Password:</strong> Lowercase Roll Number (e.g. 25b21a4201) unless a password column is provided</p>
                </div>

                {/* Results breakdown if present */}
                {bulkResult && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                        <div className="text-lg font-bold text-slate-800 dark:text-white">
                          {bulkResult.totalParsed}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase font-semibold">Parsed</div>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {bulkResult.successfulCount}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Registered</div>
                      </div>
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-center">
                        <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                          {bulkResult.failedCount}
                        </div>
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Failed / Skipped</div>
                      </div>
                    </div>

                    {bulkResult.failed?.length > 0 && (
                      <div className="border border-rose-200 dark:border-rose-900 rounded-lg p-3 bg-rose-50/50 dark:bg-rose-950/20 max-h-48 overflow-y-auto">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Failed Records ({bulkResult.failed.length})</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          {bulkResult.failed.slice(0, 50).map((f, idx) => (
                            <div key={idx} className="flex justify-between py-1 border-b border-rose-100 dark:border-rose-900/40 last:border-0">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatRollNumber(f.rollNumber)}</span>
                              <span className="text-rose-600 dark:text-rose-400 text-[11px]">{f.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => navigate('/librarian/users')}>
                View User Directory
              </Button>
              <Button type="submit" isLoading={loading}>
                {userType === 'BULK_STUDENT' ? (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload & Register Students
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {userType === 'STUDENT' ? 'Register Student' : 'Register Faculty'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
