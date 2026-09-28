import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { LogIn, ShieldCheck, ShieldAlert, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../components/common/Logo';


const LOGIN_PHRASES = [
  "Student & Faculty Portal",
  "Real-Time Seat Tracking",
  "Academic Book Catalog",
  "Secure Institutional Access"
];

const LoginTypingText = () => {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setText(LOGIN_PHRASES[0]);
      return;
    }

    const currentPhrase = LOGIN_PHRASES[phraseIndex];
    let timer;

    if (!isDeleting && text === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % LOGIN_PHRASES.length);
    } else {
      const speed = isDeleting ? 45 : 85;
      timer = setTimeout(() => {
        setText(
          isDeleting
            ? currentPhrase.substring(0, text.length - 1)
            : currentPhrase.substring(0, text.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [text, phraseIndex, isDeleting]);

  return (
    <span className="inline-flex items-center text-[#8D6B94] font-serif italic font-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-base xs:text-lg sm:text-2xl lg:text-3xl leading-snug mt-1 transition-all">
      <span className="whitespace-nowrap truncate">{text}</span>
      <span
        className="ml-1 inline-block w-[2.5px] h-[0.75em] bg-[#8D6B94] rounded-full animate-pulse align-baseline shrink-0"
        aria-hidden="true"
      />
    </span>
  );
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const from = location.state?.from?.pathname;

  const handleUsernameChange = (e) => {
    setUsername(e.target.value ?? '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username/roll number and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await login(username.trim(), password);
      const userRole = data?.user?.role || 'OPEN_USER';

      let targetRoute = '/';
      if (userRole === 'ADMIN') targetRoute = '/admin/dashboard';
      else if (userRole === 'LIBRARIAN') targetRoute = '/librarian/dashboard';
      else if (userRole === 'STUDENT') targetRoute = '/student/dashboard';
      else if (userRole === 'FACULTY') targetRoute = '/faculty/dashboard';
      else if (userRole === 'LIBRARY_ENTRANCE') targetRoute = '/library-entrance/dashboard';

      if (from && from !== '/login') {
        if (userRole === 'LIBRARY_ENTRANCE' && from.startsWith('/library-entrance')) {
          targetRoute = from;
        } else if (userRole === 'ADMIN' && from.startsWith('/admin')) {
          targetRoute = from;
        } else if (userRole === 'LIBRARIAN' && from.startsWith('/librarian')) {
          targetRoute = from;
        } else if (userRole === 'STUDENT' && from.startsWith('/student')) {
          targetRoute = from;
        } else if (userRole === 'FACULTY' && from.startsWith('/faculty')) {
          targetRoute = from;
        }
      }

      navigate(targetRoute, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full flex-1 flex items-center justify-center py-4 sm:py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-[#E8DBC5] bg-white shadow-2xl overflow-hidden">
        
        {/* Left Visual Column matching reference image */}
        <div className="relative p-5 sm:p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-[#FFF4E9] via-[#E8DBC5]/40 to-[#C3A29E]/30 overflow-hidden border-b md:border-b-0 md:border-r border-[#E8DBC5]">
          {/* Subtle Ambient Soft Glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#8D6B94]/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C3A29E]/20 rounded-full blur-[90px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <Logo size="lg" subtitle="KIET Digital Library" />

            <div className="pt-6 space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B232E] tracking-tight leading-tight">
                Access your library workspace <br />
                <LoginTypingText />
              </h2>
              <p className="text-sm text-[#7A697E] leading-relaxed">
                Explore books, manage your account, track seat availability, and stay connected with your campus library.
              </p>
            </div>
          </div>

          {/* Aesthetic Decorative Visual / Illustration */}
          <div className="relative z-10 pt-10 flex items-center justify-center">
            <div className="w-full max-w-xs p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-[#E8DBC5] flex items-center space-x-4 shadow-sm">
              <div className="p-3 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2B232E]">Verified Institutional Portal</h4>
                <p className="text-[11px] text-[#7A697E]">Secure role-based access for Students & Staff</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column matching reference image */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#2B232E] tracking-tight">Welcome Back</h2>
              <p className="text-xs text-[#7A697E] mt-1">Log in to your portal account</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8D6B94] hover:text-[#B185A7] transition-all px-3 py-1.5 rounded-full bg-[#E8DBC5]/50 hover:bg-[#E8DBC5]/80 border border-[#E8DBC5] shadow-2xs"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Back</span>
            </Link>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="text-xs">
                <div className="flex items-center space-x-2 font-bold mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Login Failed</span>
                </div>
                <p>{errorMsg}</p>
              </Alert>
            )}

            <div>
              <label className="block text-xs font-bold text-[#2B232E] uppercase mb-1.5">
                Roll Number / Faculty ID / Email
              </label>
              <Input
                placeholder="e.g. 23B21A4268, Faculty ID, or Email"
                value={username}
                onChange={handleUsernameChange}
                className="font-mono uppercase placeholder:font-sans placeholder:normal-case"
                required
                autoComplete="username"
                spellCheck="false"
              />
              <p className="text-[11px] text-[#7A697E] mt-1 font-medium">
                Roll numbers are case-insensitive (e.g. 23B21A4268 or 23b21a4268)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B232E] uppercase mb-1.5">
                Password
              </label>
              <div className="relative w-full">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8D6B94] hover:text-[#2B232E] dark:text-[#B185A7] dark:hover:text-[#FFF4E9] transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] font-bold h-11" size="lg" isLoading={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </form>

          <div className="pt-2 text-center text-[11px] text-[#7A697E]">
            For access issues or password reset, contact the library admin staff.
          </div>
        </div>

      </div>
    </div>
  );
};
