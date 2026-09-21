"use client"

import Link from "next/link"

interface PageHeroProps {
  eyebrow?: string | null
  title: string
  description?: string | null
  /** Breadcrumb trail shown above the title; the last entry is the current page. */
  crumbs?: Array<{ label: string; href?: string }>
}

/**
 * Cream "paper" masthead used on every inner page so they share the
 * home page's type scale and palette.
 */
export function PageHero({ eyebrow, title, description, crumbs = [] }: PageHeroProps) {
  return (
    <section className="surface-paper border-b border-line/70 dark:border-border">
      <div className="mx-auto max-w-[1560px] px-4 py-14 text-center sm:px-6 lg:px-10 lg:py-20">
        {crumbs.length > 0 && (
          <nav className="mb-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-ink-soft/70 dark:text-foreground/60">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-brand">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-brand">{crumb.label}</span>
                )}
                {index < crumbs.length - 1 && <span className="text-ink-soft/40">/</span>}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <div className="flex justify-center">
            <span className="eyebrow eyebrow-center">{eyebrow}</span>
          </div>
        )}

        <h1 className="display-heading mt-5 text-[32px] text-ink sm:text-[44px] lg:text-[54px] dark:text-foreground">
          {title}
        </h1>

        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.7] text-ink-soft dark:text-foreground/70">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
