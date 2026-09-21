'use client';

import type React from 'react';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { markProfileCompleted } from '@/lib/auth';
import { DEFAULT_PHONE_COUNTRY, getCountryOption, type PhoneFieldState } from '@/lib/phone';
import { PhoneCountryInput } from '@/components/phone-country-input';
import { useStore } from '@/hooks/use-store';
import { Loader2, Sparkles, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ClipboardEvent, type KeyboardEvent } from 'react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'new' | 'existing';
  onModeChange?: (mode: 'new' | 'existing') => void;
}

export function AuthDialog({
  open,
  onOpenChange,
  mode = 'new',
  onModeChange,
}: AuthDialogProps) {
  const router = useRouter();
  const createInitialPhoneField = (): PhoneFieldState => ({
    country: getCountryOption(DEFAULT_PHONE_COUNTRY),
    rawValue: '',
    normalizedValue: '',
    isValid: false,
    isPossible: false,
    error: null,
  });
  const [phoneField, setPhoneField] = useState<PhoneFieldState>(createInitialPhoneField);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [notice, setNotice] = useState<string | null>(null);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpSubmitInFlightRef = useRef(false);
  const { login, verifyOtp, isLoading, error, user } = useAuth();
  const { store, refreshStore } = useStore();

  useEffect(() => {
    if (open) {
      void refreshStore();
    }
  }, [open, refreshStore]);

  useEffect(() => {
    if (open) {
      setPhoneField(createInitialPhoneField());
      setOtp('');
      setStep('details');
      setPhoneValidationError(null);
    }
  }, [mode, open]);

  useEffect(() => {
    if (!open) {
      setPhoneField(createInitialPhoneField());
      setOtp('');
      setStep('details');
      setNotice(null);
      setPhoneValidationError(null);
    }
  }, [open]);

  const currentStoreName = useMemo(() => store?.name || 'Savera', [store]);
  const currentStoreSlug = useMemo(() => store?.subdomain || 'savera', [store]);

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = Array.from(
        { length: 6 },
        (_, position) => prev[position] || '',
      );
      next[index] = digit;
      return next.join('').slice(0, 6);
    });

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) {
      return;
    }
    event.preventDefault();
    setOtp(pasted);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneField.isValid || !phoneField.normalizedValue) {
      setPhoneValidationError(
        phoneField.error || 'Please enter a valid international phone number.',
      );
      return;
    }

    try {
      const result = await login(phoneField.normalizedValue, currentStoreSlug);
      if (result.success) {
        setNotice(null);
        setStep('verify');
        return;
      }

      if (result.reason === 'user_exists' && mode === 'new') {
        setNotice(
          result.message ||
            'This account already exists. Please use the alternate sign-in option.',
        );
        onModeChange?.('existing');
        setStep('details');
      }
    } catch {
      return;
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSubmitInFlightRef.current || otp.length < 6) {
      return;
    }

    otpSubmitInFlightRef.current = true;
    try {
      const result = await verifyOtp(phoneField.normalizedValue, otp, currentStoreSlug);
      if (result?.success) {
        const currentUser = result.user || user;
        const successRedirect = mode === 'new' ? '/profile?fromAuth=true' : '/';

        setPhoneField(createInitialPhoneField());
        setOtp('');
        setStep('details');
        onOpenChange(false);

        if (mode === 'existing') {
          markProfileCompleted(
            currentStoreSlug,
            currentUser?.phone || phoneField.normalizedValue,
          );
        }

        router.push(successRedirect);
      }
    } finally {
      otpSubmitInFlightRef.current = false;
    }
  };

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPhoneField(createInitialPhoneField());
      setOtp('');
      setStep('details');
      setPhoneValidationError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-lg"
      >
        <div className="relative mx-auto isolate overflow-hidden rounded-[1.75rem] border border-white/20 bg-white text-ink shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_28%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative p-5 sm:p-6">
            <DialogHeader className="mb-5 text-left">
              <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                {step === 'verify' ? 'Text verification' : 'Secure access'}
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
                {step === 'verify' ? 'Enter the code' : 'Sign in to continue'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {step === 'verify'
                  ? `We sent a 6-digit text message code to ${phoneField.normalizedValue || phoneField.rawValue}.`
                  : 'Enter your phone number to continue.'}
              </DialogDescription>
            </DialogHeader>

            {step === 'details' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="rounded-[1.5rem] border border-line bg-cream-light p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft0 text-white">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">
                        {currentStoreName}
                      </p>
                      <p className="mt-1 text-xs text-brand/80">
                        This store is selected from the current domain.
                      </p>
                    </div>
                  </div>
                </div>

                {notice && (
                  <p className="rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
                    {notice}
                  </p>
                )}

                <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Phone number
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      We will send a secure code
                    </div>
                  </div>

                  <PhoneCountryInput
                    id="phone"
                    label="Phone number"
                    value={phoneField.rawValue}
                    countryCode={phoneField.country.code}
                    onChange={(next) => {
                      setPhoneField(next);
                      setPhoneValidationError(null);
                    }}
                    disabled={isLoading}
                    helperText="Pakistan (+92) is selected by default. You can search and choose another country."
                    error={phoneValidationError}
                  />
                </div>

                {error && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-ink text-white transition-colors hover:bg-ink/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </Button>

                {mode === 'existing' && (
                  <div className="border-t border-line pt-4 text-center">
                    <button
                      type="button"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                      onClick={() => {
                        setNotice(null);
                        onModeChange?.('new');
                      }}
                      disabled={isLoading}
                    >
                      Switch to first-time sign in
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="rounded-[1.5rem] border border-line bg-cream-light p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Store
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">
                        {currentStoreName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {phoneField.normalizedValue || phoneField.rawValue}
                      </p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand shadow-sm">
                      SMS sent
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
                  <Label
                    htmlFor="otp"
                    className="text-sm font-medium text-ink-soft"
                  >
                    Verification code
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the 6-digit text message code sent to your phone. You
                    can paste it directly.
                  </p>
                  <div
                    className="mt-4 grid grid-cols-6 gap-2"
                    onPaste={handleOtpPaste}
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={otp[index] || ''}
                        onChange={(event) =>
                          handleOtpDigitChange(index, event.target.value)
                        }
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        disabled={isLoading}
                        className="h-12 rounded-2xl border-line bg-cream-light text-center text-lg font-semibold shadow-sm transition-all duration-200 focus-visible:scale-[1.03] focus-visible:bg-white"
                      />
                    ))}
                  </div>
                </div>

                {notice && (
                  <p className="rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
                    {notice}
                  </p>
                )}

                {error && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-brand text-white transition-colors hover:bg-brand-dark"
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    'Verify and continue'
                  )}
                </Button>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    className="font-medium text-muted-foreground transition-colors hover:text-brand"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                    }}
                    disabled={isLoading}
                  >
                    Change phone
                  </button>
                  <button
                    type="button"
                    className="font-medium text-brand transition-colors hover:text-brand-dark"
                    onClick={() => login(phoneField.normalizedValue, currentStoreSlug)}
                    disabled={isLoading}
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
