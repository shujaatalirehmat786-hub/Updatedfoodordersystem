import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min"

export type { CountryCode } from "libphonenumber-js/min"

export const DEFAULT_PHONE_COUNTRY: CountryCode = "PK"

export interface CountryOption {
  code: CountryCode
  name: string
  callingCode: string
  flag: string
  searchLabel: string
}

export interface PhoneFieldState {
  country: CountryOption
  rawValue: string
  normalizedValue: string
  isValid: boolean
  isPossible: boolean
  error: string | null
}

function getCountryDisplayNames(): Intl.DisplayNames | null {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") {
    return null
  }

  try {
    return new Intl.DisplayNames(["en"], { type: "region" })
  } catch {
    return null
  }
}

export function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

function getDisplayName(countryCode: CountryCode): string {
  const displayNames = getCountryDisplayNames()
  const name = displayNames?.of(countryCode)
  return name || countryCode
}

function sortCountryOptions(options: CountryOption[]): CountryOption[] {
  return options.sort((a, b) => {
    if (a.code === DEFAULT_PHONE_COUNTRY) return -1
    if (b.code === DEFAULT_PHONE_COUNTRY) return 1
    return a.name.localeCompare(b.name)
  })
}

const COUNTRY_OPTIONS: CountryOption[] = sortCountryOptions(
  getCountries()
    .map((code) => {
      const countryCode = code as CountryCode
      const callingCode = getCountryCallingCode(countryCode)
      const name = getDisplayName(countryCode)
      const flag = getFlagEmoji(countryCode)
      return {
        code: countryCode,
        name,
        callingCode,
        flag,
        searchLabel: `${name} ${countryCode} +${callingCode} ${flag}`,
      }
    })
    .filter((country) => Boolean(country.callingCode)),
)

const COUNTRY_BY_CODE = new Map<CountryCode, CountryOption>(
  COUNTRY_OPTIONS.map((country) => [country.code, country]),
)

const COUNTRY_BY_CALLING_CODE = new Map<string, CountryOption[]>(
  COUNTRY_OPTIONS.reduce((map, country) => {
    const list = map.get(country.callingCode) || []
    list.push(country)
    map.set(country.callingCode, list)
    return map
  }, new Map<string, CountryOption[]>()),
)

export function getCountryOptions(): CountryOption[] {
  return COUNTRY_OPTIONS
}

export function getCountryOption(code?: CountryCode | null): CountryOption {
  if (code && COUNTRY_BY_CODE.has(code)) {
    return COUNTRY_BY_CODE.get(code)!
  }

  return COUNTRY_BY_CODE.get(DEFAULT_PHONE_COUNTRY) || COUNTRY_OPTIONS[0]
}

export function getCountryFromCallingCode(callingCode: string): CountryOption | null {
  return COUNTRY_BY_CALLING_CODE.get(callingCode)?.[0] || null
}

function sanitizePhoneText(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
}

function cleanInternationalCandidate(value: string, selectedCountry: CountryOption): string {
  let candidate = sanitizePhoneText(value)
  if (!candidate) {
    return ""
  }

  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`
  }

  if (candidate.startsWith("+")) {
    let digits = candidate.slice(1).replace(/\D/g, "")
    const callingCode = selectedCountry.callingCode

    if (digits.startsWith(`${callingCode}${callingCode}`)) {
      digits = digits.slice(callingCode.length)
    }

    return digits ? `+${digits}` : ""
  }

  const digits = candidate.replace(/\D/g, "")
  if (!digits) {
    return ""
  }

  const callingCode = selectedCountry.callingCode
  if (digits.startsWith(callingCode) && digits.length > callingCode.length + 4) {
    return `+${digits}`
  }

  return digits
}

export function normalizePhoneValue(
  value: string,
  selectedCountryCode: CountryCode = DEFAULT_PHONE_COUNTRY,
): PhoneFieldState {
  const selectedCountry = getCountryOption(selectedCountryCode)
  const cleaned = cleanInternationalCandidate(value, selectedCountry)

  if (!cleaned) {
    return {
      country: selectedCountry,
      rawValue: "",
      normalizedValue: "",
      isValid: false,
      isPossible: false,
      error: null,
    }
  }

  const parsed =
    cleaned.startsWith("+")
      ? parsePhoneNumberFromString(cleaned)
      : parsePhoneNumberFromString(cleaned, selectedCountry.code)

  if (parsed) {
    const parsedCountry = getCountryOption((parsed.country as CountryCode | undefined) || selectedCountry.code)
    return {
      country: parsedCountry,
      rawValue: parsed.nationalNumber,
      normalizedValue: parsed.number,
      isValid: parsed.isValid(),
      isPossible: parsed.isPossible(),
      error: parsed.isValid() ? null : "Enter a valid international phone number.",
    }
  }

  const digitsOnly = cleaned.replace(/\D/g, "")
  const fallbackParsed = parsePhoneNumberFromString(digitsOnly, selectedCountry.code)
  if (fallbackParsed) {
    const fallbackCountry = getCountryOption(
      (fallbackParsed.country as CountryCode | undefined) || selectedCountry.code,
    )
    return {
      country: fallbackCountry,
      rawValue: fallbackParsed.nationalNumber,
      normalizedValue: fallbackParsed.number,
      isValid: fallbackParsed.isValid(),
      isPossible: fallbackParsed.isPossible(),
      error: fallbackParsed.isValid() ? null : "Enter a valid international phone number.",
    }
  }

  return {
    country: selectedCountry,
    rawValue: digitsOnly,
    normalizedValue: "",
    isValid: false,
    isPossible: false,
    error: digitsOnly ? "Enter a valid international phone number." : null,
  }
}
