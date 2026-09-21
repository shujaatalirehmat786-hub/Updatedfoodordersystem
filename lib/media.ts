/**
 * Image + currency helpers.
 *
 * The backend returns uploaded media as a *relative* path (for example
 * `store-images/0b646ac9-….jpg` on `product.imageId.fileUrl`). The host that
 * serves those files is not part of the API payload, so it is configured with
 * `NEXT_PUBLIC_MEDIA_BASE_URL`. When that is unset, relative paths resolve to
 * `null` and callers fall back to the bundled artwork instead of requesting a
 * URL that cannot exist.
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/+$/, "")

export function resolveMediaUrl(value?: string | null): string | null {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed
  if (trimmed.startsWith("/")) return trimmed
  if (!MEDIA_BASE) return null
  return `${MEDIA_BASE}/${trimmed.replace(/^\/+/, "")}`
}

function firstMedia(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const resolved = resolveMediaUrl(value)
    if (resolved) return resolved
  }
  return null
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Neutral monogram tile for records with no photo.
 *
 * Deliberately not a stock food photo: showing an unrelated dish (shellfish on
 * a vegetarian item, for instance) misrepresents the menu.
 */
export function getPlaceholderImage(label?: string | null): string {
  const letter = escapeXml((label || "").trim().charAt(0).toUpperCase() || "\u2022")
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">` +
    `<rect width="400" height="400" fill="#f5f1ec"/>` +
    `<circle cx="200" cy="200" r="126" fill="none" stroke="#f54a00" stroke-opacity="0.22" stroke-width="2"/>` +
    `<text x="200" y="206" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Georgia, 'Times New Roman', serif" font-size="150" fill="#f54a00" fill-opacity="0.32">${letter}</text>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function getProductImage(product: any): string {
  return (
    firstMedia(
      product?.image,
      product?.imageUrl,
      product?.imageId?.fileUrl,
      Array.isArray(product?.images) ? product.images[0]?.fileUrl || product.images[0] : null,
    ) || getPlaceholderImage(product?.name)
  )
}

export function getDepartmentImage(department: any): string {
  return (
    firstMedia(department?.image, department?.imageUrl, department?.imageId?.fileUrl) ||
    getPlaceholderImage(department?.name)
  )
}

/** Department name published directly on the product, falling back to a lookup. */
export function getProductDepartmentId(product: any): string | null {
  if (product?.department) {
    if (typeof product.department === "string") return product.department
    if (product.department._id) return product.department._id
    if (product.department.id) return product.department.id
  }
  if (product?.departmentId) {
    return typeof product.departmentId === "string" ? product.departmentId : product.departmentId?._id || null
  }
  return null
}

export function getProductDepartmentName(product: any, departments: any[] = []): string | null {
  if (typeof product?.departmentName === "string" && product.departmentName.trim()) {
    return product.departmentName.trim()
  }
  if (product?.department && typeof product.department === "object" && product.department.name) {
    return product.department.name
  }
  const id = getProductDepartmentId(product)
  if (!id) return null
  const match = departments.find((department) => String(department._id) === String(id))
  return match?.name || null
}

/** Currency symbol published by the store, defaulting to `$`. */
export function getCurrencySymbol(store?: any): string {
  const symbol = store?.currencySymbol || store?.raw?.currencySymbol
  return typeof symbol === "string" && symbol.trim() ? symbol.trim() : "$"
}
