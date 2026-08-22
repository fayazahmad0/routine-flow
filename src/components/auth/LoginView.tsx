/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck, Check, RefreshCw, ChevronDown, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digits: number;
  placeholder: string;
}

const COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', digits: 10, placeholder: '98765 43210' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', digits: 10, placeholder: '(555) 000-0000' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', digits: 10, placeholder: '7911 123456' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', digits: 9, placeholder: '50 123 4567' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', digits: 10, placeholder: '(555) 000-0000' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', digits: 9, placeholder: '412 345 678' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', digits: 8, placeholder: '8123 4567' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', digits: 10, placeholder: '151 23456789' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', digits: 9, placeholder: '50 123 4567' },
];

export const LoginView: React.FC = () => {
  const {
    signInWithGoogle,
    signInAsGuest,
    sendPhoneOtp,
    verifyPhoneOtp,
    resendPhoneOtp,
    error,
    clearError,
  } = useAuth();
  
  const [authMode, setAuthMode] = useState<'main' | 'phone_input' | 'phone_otp'>('main');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]); // Default: India (+91)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const [phoneNationalNumber, setPhoneNationalNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Resend OTP countdown
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Close country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus OTP input when entering OTP mode
  useEffect(() => {
    if (authMode === 'phone_otp') {
      setResendCountdown(30);
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [authMode]);

  // Sanitize national number to remove duplicate dialCode or leading zeroes
  const getSanitizedNationalDigits = (): string => {
    let digits = phoneNationalNumber.replace(/\D/g, '');
    
    // If India (+91)
    if (selectedCountry.code === 'IN') {
      // Strip leading country code if user typed 91 + 10 digits
      if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.substring(2);
      }
      // Strip leading zero if user typed 0 + 10 digits
      if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.substring(1);
      }
    }
    
    return digits;
  };

  const getFullE164Number = (): string => {
    const cleanDigits = getSanitizedNationalDigits();
    return `${selectedCountry.dialCode}${cleanDigits}`;
  };

  const getFormattedDisplayNumber = (): string => {
    const cleanDigits = getSanitizedNationalDigits();
    if (selectedCountry.code === 'IN' && cleanDigits.length === 10) {
      return `+91 ${cleanDigits.substring(0, 5)} ${cleanDigits.substring(5)}`;
    }
    return `${selectedCountry.dialCode} ${cleanDigits}`;
  };

  const handleGoogleLogin = async () => {
    try {
      clearError();
      setLocalError(null);
      setSuccessMessage(null);
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch (err: any) {
      // Diagnostic error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      clearError();
      setLocalError(null);
      setSuccessMessage(null);
      setIsSubmitting(true);
      await signInAsGuest();
    } catch (err: any) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    const cleanDigits = getSanitizedNationalDigits();
    if (!cleanDigits) {
      setLocalError('Please enter your mobile phone number.');
      return;
    }

    if (selectedCountry.code === 'IN') {
      if (cleanDigits.length !== 10) {
        setLocalError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    } else {
      if (cleanDigits.length < selectedCountry.digits - 1) {
        setLocalError(`Please enter a valid ${selectedCountry.name} mobile phone number.`);
        return;
      }
    }

    const fullPhoneNumber = getFullE164Number();

    try {
      setIsSubmitting(true);
      const sent = await sendPhoneOtp(fullPhoneNumber, 'recaptcha-container');
      if (sent) {
        setSuccessMessage(`OTP sent successfully to ${getFormattedDisplayNumber()}`);
        setAuthMode('phone_otp');
      }
    } catch (err) {
      // Error is set in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    const fullPhoneNumber = getFullE164Number();

    try {
      setIsSubmitting(true);
      const sent = await resendPhoneOtp(fullPhoneNumber, 'recaptcha-container');
      if (sent) {
        setSuccessMessage(`New verification code sent to ${getFormattedDisplayNumber()}`);
        setResendCountdown(30);
        setOtp('');
      }
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setLocalError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      clearError();
      setLocalError(null);
      setIsSubmitting(true);
      await verifyPhoneOtp(cleanOtp);
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#121212] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] flex items-center justify-center shadow-xs mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" className="opacity-40" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
          RoutineFlow
        </h2>
        <p className="mt-1.5 text-center text-xs font-mono uppercase tracking-widest text-[#78716C] dark:text-[#A39E96]">
          Daily Habit & Schedule System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A1918] py-8 px-6 sm:px-10 border border-[#E8E3DA] dark:border-[#282725] rounded-2xl shadow-xs">
          
          {/* Success Notice */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-[#F2F8F4] dark:bg-[#182C20] border border-[#CDE5D7] dark:border-[#244833] rounded-xl text-xs text-[#2D5A43] dark:text-[#88D4A8] font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Error display */}
          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-[#FBEBEB] dark:bg-[#351C1C] border border-[#F5C2C2] dark:border-[#5E2B2B] rounded-xl text-xs text-[#991B1B] dark:text-[#FCA5A5] font-medium leading-relaxed"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-normal">{error || localError}</span>
                </div>

                {(error?.includes('authorized for domain') || error?.includes('unauthorized-domain')) && (
                  <div className="p-2.5 bg-white/70 dark:bg-[#201010] border border-[#F5C2C2] dark:border-[#5E2B2B] rounded-lg text-[11px] text-[#7F1D1D] dark:text-[#FECACA] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono truncate select-all">{currentHostname}</span>
                      <button
                        type="button"
                        onClick={handleCopyDomain}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#991B1B] text-white dark:bg-[#FECACA] dark:text-[#7F1D1D] rounded font-semibold text-[10px] hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                      >
                        {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#991B1B]/80 dark:text-[#FECACA]/80">
                      Add to: <strong>Firebase Console</strong> → <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong>.
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-[#F5C2C2]/40 dark:border-[#5E2B2B]/40">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="px-2.5 py-1 bg-[#1A1A1A] text-white dark:bg-[#F3EFEA] dark:text-[#121212] rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Retry Google Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="px-2.5 py-1 bg-[#FAF8F5] text-[#1A1A1A] dark:bg-[#282725] dark:text-[#F3EFEA] border border-[#E8E3DA] dark:border-[#383634] rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#F2EDE4] dark:hover:bg-[#33312E] transition-colors"
                  >
                    Guest Demo Access
                  </button>
                  {(error?.includes('Popup') || error?.includes('blocked') || error?.includes('domain') || localError?.includes('Popup')) && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white dark:bg-[#201F1E] text-[#1A1A1A] dark:text-[#F3EFEA] border border-[#E8E3DA] dark:border-[#383634] rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#FAF8F5] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {authMode === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {/* Continue with Google */}
                <button
                  id="login-google-btn"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FAF8F5] dark:bg-[#22211F] text-[#1A1A1A] dark:text-[#F3EFEA] font-medium text-xs sm:text-sm rounded-xl border border-[#E8E3DA] dark:border-[#2E2C2A] hover:bg-[#F2EDE4] dark:hover:bg-[#282725] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                {/* Continue with Phone */}
                <button
                  id="login-phone-btn"
                  type="button"
                  onClick={() => {
                    clearError();
                    setLocalError(null);
                    setSuccessMessage(null);
                    setAuthMode('phone_input');
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-[#1A1A1A] hover:bg-[#33312E] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] font-medium text-xs sm:text-sm rounded-xl active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>Continue with Phone Number</span>
                </button>

                {/* Guest / Instant Demo Access */}
                <button
                  id="login-guest-btn"
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-[#FAF8F5] dark:hover:bg-[#201F1E] text-[#57534E] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] border border-dashed border-[#D6D0C4] dark:border-[#383634] font-medium text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue as Guest</span>
                </button>

                {/* Feature highlight list */}
                <div className="pt-4 mt-4 border-t border-[#E8E3DA] dark:border-[#282725] space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#A39E96]">
                    <Check className="w-3.5 h-3.5 text-[#2D5A43] dark:text-[#68B087] shrink-0" />
                    <span>Real-time habit, streak & calendar tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#A39E96]">
                    <Check className="w-3.5 h-3.5 text-[#2D5A43] dark:text-[#68B087] shrink-0" />
                    <span>Timezone-safe daily completion logging</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#A39E96]">
                    <Check className="w-3.5 h-3.5 text-[#2D5A43] dark:text-[#68B087] shrink-0" />
                    <span>Private & secure Cloud Firestore synchronization</span>
                  </div>
                </div>
              </motion.div>
            )}

            {authMode === 'phone_input' && (
              <motion.form
                key="phone_input"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setLocalError(null);
                      setSuccessMessage(null);
                      setAuthMode('main');
                    }}
                    className="flex items-center gap-1 text-xs font-mono text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#78716C] dark:text-[#A39E96]">
                    Step 1 of 2
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="phone-input"
                    className="block text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] mb-1.5"
                  >
                    Mobile Phone Number
                  </label>

                  {/* Phone input with Country Selector */}
                  <div className="flex rounded-xl border border-[#E8E3DA] dark:border-[#282725] bg-[#FAF8F5] dark:bg-[#161616] focus-within:border-[#1A1A1A] dark:focus-within:border-[#F3EFEA] transition-all">
                    {/* Country Code Picker Button */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        id="country-selector-btn"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F2EDE4]/60 dark:bg-[#201F1E] border-r border-[#E8E3DA] dark:border-[#282725] rounded-l-xl text-xs font-mono text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#EAE4D9] dark:hover:bg-[#262523] transition-colors cursor-pointer"
                        aria-label="Select country code"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="font-semibold">{selectedCountry.dialCode}</span>
                        <ChevronDown className="w-3 h-3 text-[#78716C]" />
                      </button>

                      {/* Dropdown Menu */}
                      {isCountryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-[#1E1D1B] border border-[#E8E3DA] dark:border-[#2E2C2A] rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto py-1">
                          {COUNTRIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setIsCountryDropdownOpen(false);
                                clearError();
                                setLocalError(null);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#F2EDE4] dark:hover:bg-[#282725] transition-colors ${
                                selectedCountry.code === c.code ? 'font-bold bg-[#FAF8F5] dark:bg-[#242220]' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-sm">{c.flag}</span>
                                <span className="text-[#1A1A1A] dark:text-[#F3EFEA]">{c.name}</span>
                              </span>
                              <span className="font-mono text-[#78716C] dark:text-[#A39E96]">{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* National Number Input */}
                    <input
                      id="phone-input"
                      type="tel"
                      inputMode="numeric"
                      placeholder={selectedCountry.placeholder}
                      value={phoneNationalNumber}
                      onChange={(e) => {
                        setPhoneNationalNumber(e.target.value);
                        if (localError) setLocalError(null);
                        if (error) clearError();
                      }}
                      required
                      autoFocus
                      className="flex-1 px-3.5 py-2.5 bg-transparent text-sm text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#A8A29E] focus:outline-none font-mono"
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] font-mono text-[#78716C] dark:text-[#A39E96]">
                    {selectedCountry.code === 'IN'
                      ? 'Defaulted to 🇮🇳 India (+91). Enter your 10-digit mobile number.'
                      : `Selected: ${selectedCountry.flag} ${selectedCountry.name} (${selectedCountry.dialCode})`}
                  </p>
                </div>

                <button
                  id="send-otp-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-[0.99] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] font-medium text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending OTP SMS...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {authMode === 'phone_otp' && (
              <motion.form
                key="phone_otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setLocalError(null);
                      setSuccessMessage(null);
                      setAuthMode('phone_input');
                    }}
                    className="flex items-center gap-1 text-xs font-mono text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change Number
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#78716C] dark:text-[#A39E96]">
                    Step 2 of 2
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="otp-input"
                      className="block text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA]"
                    >
                      Enter 6-Digit Verification Code
                    </label>
                  </div>

                  <input
                    id="otp-input"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      if (localError) setLocalError(null);
                      if (error) clearError();
                    }}
                    required
                    className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono text-xl font-bold bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#282725] rounded-xl text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] transition-all"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#78716C] dark:text-[#A39E96]">
                    <span>
                      Sent to <span className="font-semibold text-[#1A1A1A] dark:text-[#F3EFEA]">{getFormattedDisplayNumber()}</span>
                    </span>
                    <button
                      type="button"
                      id="resend-otp-btn"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0 || isSubmitting}
                      className={`hover:underline cursor-pointer ${
                        resendCountdown > 0
                          ? 'text-[#A8A29E] cursor-not-allowed'
                          : 'text-[#1A1A1A] dark:text-[#F3EFEA] font-semibold'
                      }`}
                    >
                      {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-[0.99] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] font-medium text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Enter</span>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Invisible Recaptcha container */}
          <div id="recaptcha-container" className="flex justify-center mt-2"></div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#78716C] dark:text-[#A39E96]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#78716C]" />
          <span>Secured with Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};

