"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DEFAULT_PHONE_COUNTRY,
  getCountryOption,
  getCountryOptions,
  normalizePhoneValue,
  type CountryOption,
  type CountryCode,
  type PhoneFieldState,
} from "@/lib/phone"
import { cn } from "@/lib/utils"

interface PhoneCountryInputProps {
  id: string
  label: string
  value: string
  countryCode: CountryCode
  onChange: (next: PhoneFieldState) => void
  disabled?: boolean
  error?: string | null
  helperText?: string
  className?: string
}

export function PhoneCountryInput({
  id,
  label,
  value,
  countryCode,
  onChange,
  disabled,
  error,
  helperText,
  className,
}: PhoneCountryInputProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const selectedCountry = useMemo(
    () => getCountryOption(countryCode || DEFAULT_PHONE_COUNTRY),
    [countryCode],
  )
  const countries = useMemo(() => getCountryOptions(), [])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleDocumentClick)
    return () => document.removeEventListener("mousedown", handleDocumentClick)
  }, [])

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
    } else {
      setSearch("")
    }
  }, [isOpen])

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return countries
    }

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        country.callingCode.includes(query) ||
        country.searchLabel.toLowerCase().includes(query)
      )
    })
  }, [countries, search])

  const emitChange = (nextValue: string, nextCountry: CountryOption) => {
    onChange(normalizePhoneValue(nextValue, nextCountry.code))
  }

  const handleCountrySelect = (nextCountry: CountryOption) => {
    emitChange(value, nextCountry)
    setIsOpen(false)
  }

  const handleValueChange = (nextValue: string) => {
    emitChange(nextValue, selectedCountry)
  }

  const phoneDescriptionId = `${id}-description`
  const phoneErrorId = `${id}-error`

  return (
    <div ref={wrapperRef} className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
      </Label>

      <div className="flex min-w-0 items-stretch overflow-visible rounded-2xl border border-line bg-white shadow-sm focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/15">
        <div className="relative shrink-0">
          <button
            type="button"
            className="flex h-full min-h-[3.5rem] items-center gap-2 border-r border-line bg-cream-light px-3 text-left text-sm font-medium text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            disabled={disabled}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {selectedCountry.flag}
            </span>
            <span className="hidden whitespace-nowrap sm:inline">
              +{selectedCountry.callingCode}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {isOpen && (
            <div
              role="listbox"
              aria-label="Select country code"
              className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-black/10"
            >
              <div className="border-b border-line p-3">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-cream-light px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search country"
                    className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredCountries.map((country) => {
                  const isSelected = country.code === selectedCountry.code
                  return (
                    <button
                      key={country.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-brand-soft text-brand-dark"
                          : "text-ink-soft hover:bg-cream hover:text-brand",
                      )}
                      onClick={() => handleCountrySelect(country)}
                      disabled={disabled}
                    >
                      <span className="text-lg leading-none" aria-hidden="true">
                        {country.flag}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{country.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {country.code} · +{country.callingCode}
                        </span>
                      </span>
                    </button>
                  )
                })}

                {!filteredCountries.length && (
                  <p className="px-3 py-4 text-sm text-muted-foreground">No countries match your search.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center">
          <Input
            id={id}
            type="tel"
            value={value}
            onChange={(event) => handleValueChange(event.target.value)}
            disabled={disabled}
            inputMode="tel"
            autoComplete="tel"
            placeholder="3001234567"
            className="h-[3.5rem] min-w-0 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
            aria-describedby={error ? phoneErrorId : helperText ? phoneDescriptionId : undefined}
          />
        </div>
      </div>

      {helperText && !error && (
        <p id={phoneDescriptionId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={phoneErrorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
