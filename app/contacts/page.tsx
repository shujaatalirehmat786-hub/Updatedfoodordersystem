"use client"

import { Mail, MapPin, Phone, Clock, Facebook, Instagram, Twitter } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageHero } from "@/components/page-hero"
import { useStore } from "@/hooks/use-store"
import {
  getStoreAddress,
  getStoreBusinessHours,
  getStoreEmail,
  getStoreName,
  getStorePhone,
  getStoreSocialLinks,
} from "@/lib/store"

export default function ContactsPage() {
  const { store } = useStore()
  const storeName = getStoreName(store) || store?.subdomain || ""
  const displayStoreName = storeName.replace(/[.,\s]+$/, "")
  const storeAddress = getStoreAddress(store)
  const storeEmail = getStoreEmail(store)
  const storePhone = getStorePhone(store)
  const businessHours = getStoreBusinessHours(store)
  const social = getStoreSocialLinks(store)

  const contactCards = [
    storeAddress ? { Icon: MapPin, label: "Address", value: storeAddress, href: null } : null,
    storePhone
      ? { Icon: Phone, label: "Phone", value: storePhone, href: `tel:${storePhone.replace(/\s+/g, "")}` }
      : null,
    storeEmail ? { Icon: Mail, label: "Email", value: storeEmail, href: `mailto:${storeEmail}` } : null,
  ].filter(Boolean) as Array<{ Icon: typeof MapPin; label: string; value: string; href: string | null }>

  const socialItems = [
    { href: social.instagramUrl, Icon: Instagram, label: "Instagram" },
    { href: social.facebookUrl, Icon: Facebook, label: "Facebook" },
    { href: social.twitterUrl, Icon: Twitter, label: "Twitter" },
  ].filter((item) => Boolean(item.href))

  const mapQuery = storeAddress ? encodeURIComponent(storeAddress) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageHero
          eyebrow="Get in touch"
          title={displayStoreName ? `Contact ${displayStoreName}` : "Contact us"}
          description="Every detail below is published by the store."
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Contacts" },
          ]}
        />

        {/* Contact details */}
        <section className="bg-background py-16 lg:py-28 2xl:py-32">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            {contactCards.length > 0 ? (
              <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-7">
                {contactCards.map(({ Icon, label, value, href }) => (
                  <article
                    key={label}
                    className="w-full max-w-sm flex-1 basis-72 border border-line/80 bg-card p-8 text-center dark:border-border"
                  >
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/40 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 font-display text-[24px] font-semibold text-ink dark:text-foreground">
                      {label}
                    </h3>
                    <div className="mx-auto mt-4 h-px w-full bg-line dark:bg-border" />
                    {href ? (
                      <a
                        href={href}
                        className="mt-4 block text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-ink-soft transition-colors hover:text-brand dark:text-foreground/75"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-4 text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-ink-soft dark:text-foreground/75">{value}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                This store has not published any contact details yet.
              </p>
            )}

            {socialItems.length > 0 && (
              <div className="mt-14 flex flex-col items-center">
                <span className="eyebrow eyebrow-center">Follow along</span>
                <div className="mt-6 flex items-center gap-4">
                  {socialItems.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href as string}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-brand hover:bg-brand hover:text-white dark:border-foreground/30 dark:text-foreground"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Opening hours + map */}
        {(businessHours.length > 0 || mapQuery) && (
          <section className="surface-paper py-16 lg:py-28 2xl:py-32">
            <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
              {businessHours.length > 0 && (
                <div>
                  <span className="eyebrow">Opening hours</span>
                  <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[38px] dark:text-foreground">
                    When we're open
                  </h2>

                  <div className="mt-8 divide-y divide-line border border-line bg-card dark:divide-border dark:border-border">
                    {businessHours.map((slot) => (
                      <div key={slot.day} className="flex items-center justify-between px-6 py-4">
                        <span className="flex items-center gap-3 font-display text-[19px] font-semibold text-ink dark:text-foreground">
                          <Clock className="h-4 w-4 text-brand" />
                          {slot.day}
                        </span>
                        <span
                          className={`text-[15px] lg:text-[17px] 2xl:text-[20px] ${
                            slot.isOpen ? "text-ink-soft dark:text-foreground/75" : "text-muted-foreground"
                          }`}
                        >
                          {slot.isOpen ? `${slot.startTime} – ${slot.endTime}` : "Closed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mapQuery && (
                <div>
                  <span className="eyebrow">Find us</span>
                  <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[38px] dark:text-foreground">
                    Where to find us
                  </h2>
                  <div className="mt-8 overflow-hidden border border-line bg-card dark:border-border">
                    <iframe
                      title="Store location"
                      src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                      className="h-[360px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
