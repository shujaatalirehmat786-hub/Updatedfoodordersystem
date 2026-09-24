"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useStore } from "@/hooks/use-store"
import { getStoreDescription, getStoreName } from "@/lib/store"

const BELIEF_CARDS = [
  {
    image: "/savera/story-believe-1.jpg",
    title: "Fresh, Always",
    description:
      "Premium basmati rice, fresh vegetables, herbs and quality meats — sourced and prepared fresh every day.",
  },
  {
    image: "/savera/story-believe-2.jpg",
    title: "Traditional Recipes",
    description:
      "Recipes rooted in real regional cooking — the way our families have always made them, no shortcuts.",
  },
  {
    image: "/savera/story-believe-3.jpg",
    title: "Made With Care",
    description:
      "From slow-cooked dum biryani to hand-rolled breads, every dish is given the time it deserves.",
  },
]

/** Store names are often stored in all caps, which reads badly inside prose. */
function toProseName(name: string): string {
  if (!name || /[a-z]/.test(name)) return name
  return name.toLowerCase().replace(/(^|[\s.\-'])([a-z])/g, (_, prefix, letter) => prefix + letter.toUpperCase())
}

export default function AboutPage() {
  const { store } = useStore()

  const storeName = getStoreName(store) || store?.subdomain || ""
  // Store names often carry trailing punctuation that reads badly mid-sentence.
  const displayStoreName = storeName.replace(/[.,\s]+$/, "")
  const proseStoreName = toProseName(displayStoreName)
  const rawDescription = getStoreDescription(store)
  // Some stores publish an "about" string that is just the store name again.
  const aboutText =
    rawDescription && rawDescription.trim().toLowerCase() !== storeName.trim().toLowerCase()
      ? rawDescription.trim()
      : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ---------------------------------------------------------------- Hero */}
        <section className="surface-paper relative overflow-hidden">
          {/*
            Orange sweep drawn with clip-path rather than a stretched SVG, so
            the angle stays exact at any width. Band height and the left-edge
            stop are measured from the Figma render of this page.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[38.3%] bg-brand"
            style={{ clipPath: "polygon(0 100%, 0 79.23%, 100% 0, 100% 100%)" }}
          />

          <div className="relative mx-auto grid max-w-[1600px] items-center gap-10 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:px-10 lg:pb-40 lg:pt-20">
            <div className="max-w-3xl">
              <span className="eyebrow">Our story</span>

              <h1 className="display-heading mt-6 text-ink dark:text-foreground">
                <span className="block text-[38px] sm:text-[54px] lg:text-[70px] 2xl:text-[78px]">Authentic flavors.</span>
                <span className="mt-1 block text-[30px] sm:text-[42px] lg:text-[53px] 2xl:text-[58px]">A story worth sharing.</span>
              </h1>

              <p className="mt-7 max-w-xl text-[15px] lg:text-[19px] 2xl:text-[21px] leading-[1.75] text-ink-soft sm:text-base dark:text-foreground/75">
                From traditional recipes to every carefully prepared dish, discover what makes
                {proseStoreName ? ` ${proseStoreName}` : " this kitchen"} special.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[460px] lg:ml-auto lg:max-w-[520px]">
              <img
                src="/savera/story-hero.webp"
                alt=""
                aria-hidden
                className="aspect-square w-full object-contain drop-shadow-[0_24px_50px_rgba(17,17,17,0.22)]"
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ A family kitchen */}
        <section className="bg-background py-16 lg:py-28 2xl:py-32">
          <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <img
              src="/savera/story.jpg"
              alt=""
              aria-hidden
              className="aspect-[737/716] w-full object-cover"
            />

            <div>
              <span className="eyebrow">South Indian favorites</span>

              <h2 className="display-heading mt-5 text-[28px] text-ink sm:text-[38px] lg:text-[46px] 2xl:text-[50px] dark:text-foreground">
                A family kitchen, brought to Texas.
              </h2>

              <p className="mt-7 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.8] text-ink-soft/80 dark:text-foreground/70">
                {aboutText ||
                  `${proseStoreName || "This kitchen"} started with a simple idea — bring the flavors of home to the table, exactly as they've been made for generations. Recipes passed down through family, regional specialties from across India, and the kind of slow-cooked care that can't be rushed.`}
              </p>

              <p className="mt-6 max-w-xl text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.8] text-ink-soft/80 dark:text-foreground/70">
                What began as cooking for family and friends grew into a kitchen built to share those same flavors with
                all of Irving.
              </p>

              <div className="mt-10 h-px w-full max-w-xl bg-line dark:bg-border" />

              <p className="mt-7 max-w-xl font-display text-[19px] leading-[1.5] text-ink sm:text-[21px] dark:text-foreground">
                “Every dish still starts the same way it always has — with fresh ingredients and a lot of patience.”
              </p>

              <p className="mt-6 text-xs font-medium uppercase tracking-[0.12em] text-brand sm:text-sm">
                — The {displayStoreName || "kitchen"}
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ What we believe */}
        <section className="surface-paper py-16 lg:py-28 2xl:py-32">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <span className="eyebrow eyebrow-center">What we believe</span>
              <h2 className="display-heading mt-5 max-w-3xl text-[28px] text-ink sm:text-[40px] lg:text-[48px] 2xl:text-[52px] dark:text-foreground">
                Fresh ingredients. Honest cooking.
              </h2>
            </div>

            <div className="mt-14 grid gap-7 md:grid-cols-3">
              {BELIEF_CARDS.map((card) => (
                <article key={card.title} className="border border-ink/20 bg-card p-3 dark:border-border">
                  <img src={card.image} alt={card.title} className="aspect-[468/321] w-full object-cover" />
                  <div className="px-5 pb-5 pt-6">
                    <h3 className="font-display text-[24px] font-semibold text-ink dark:text-foreground">
                      {card.title}
                    </h3>
                    <div className="mt-4 h-px w-full bg-line dark:bg-border" />
                    <p className="mt-5 text-[14px] leading-[1.7] text-ink-soft/70 dark:text-foreground/70">
                      {card.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Closing quote */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center px-4 text-center sm:px-6 lg:px-10">
            <img src="/savera/quote.png" alt="" aria-hidden className="h-12 w-12 object-contain" />

            <p className="mt-10 max-w-4xl font-display text-[24px] font-medium leading-[1.3] text-ink sm:text-[32px] lg:text-[40px] dark:text-foreground">
              Good food doesn't need to be complicated — it needs to be honest. That's all we've ever tried to do at
              {proseStoreName ? ` ${proseStoreName}` : " this kitchen"}.
            </p>

            <p className="mt-9 text-xs font-medium uppercase tracking-[0.12em] text-brand sm:text-sm">
              — The {displayStoreName || "kitchen"} family
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA band */}
        <section className="bg-background pb-16 lg:pb-28 2xl:pb-32">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden bg-ink">
              <img
                src="/savera/story-band.jpg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

              <div className="relative max-w-2xl px-6 py-16 sm:px-12 lg:px-16 lg:py-28 2xl:py-32">
                <span className="eyebrow eyebrow-light normal-case">Come taste the story</span>

                <h2 className="mt-5 font-display text-[28px] font-medium leading-[1.15] text-white sm:text-[40px] lg:text-[48px]">
                  Bring the taste of authentic Indian cooking home
                </h2>

                <p className="mt-6 max-w-lg text-[15px] lg:text-[17px] 2xl:text-[20px] leading-[1.7] text-white/85">
                  From authentic Indian classics to generous family favorites, enjoy freshly prepared dishes made with
                  bold flavors.
                </p>

                <Link
                  href="/categories"
                  className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-9 py-4 2xl:px-12 2xl:py-5 2xl:leading-[1.2] text-[15px] lg:text-[17px] 2xl:text-[23px] text-ink-soft transition-colors hover:bg-brand hover:text-white"
                >
                  Order Now
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
