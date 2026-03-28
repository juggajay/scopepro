import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[oklch(0.16_0.02_260)]">
        {/* Warm accent glow */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:pb-28 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            {/* Left: copy */}
            <div className="animate-fade-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/70">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Built in Australia for painting contractors
              </div>
              <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                Painting scopes
                <br />
                <span className="bg-gradient-to-r from-primary via-[oklch(0.78_0.10_60)] to-primary bg-clip-text text-transparent">
                  in 2 minutes flat.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-white/55 sm:text-lg">
                Take a few photos of the job, answer a couple of questions, and
                get a detailed scope of work covering prep, priming, coats, and
                cleanup. Download the branded PDF or email it to your client.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="h-12 rounded-xl px-7 text-[0.95rem] font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35"
                  render={<Link href="/create" />}
                >
                  Create Your First Scope — Free
                  <ArrowRight data-icon="inline-end" className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-sm text-white/40">
                3 free scopes. No credit card needed.
              </p>
            </div>

            {/* Right: phone mockup */}
            <div className="animate-fade-up delay-300 relative mx-auto lg:mx-0">
              <div className="animate-float relative mx-auto w-60 sm:w-[270px]">
                {/* Glow */}
                <div className="absolute -inset-12 rounded-full bg-primary/15 blur-3xl" />
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[oklch(0.13_0.01_260)] shadow-2xl shadow-black/50 ring-1 ring-white/5">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 py-2.5 text-[10px]">
                    <span className="text-white/40">9:41</span>
                    <span className="font-semibold text-white/80">ScopePro</span>
                    <span className="text-white/40">100%</span>
                  </div>
                  {/* Scope items */}
                  <div className="space-y-1.5 px-3 py-2">
                    <PhoneCategory name="Surface Preparation" />
                    <PhoneItem text="Wash all surfaces" qty="1" unit="lot" />
                    <PhoneItem text="Scrape loose paint" qty="45" unit="m²" />
                    <PhoneItem text="Sand glossy areas" qty="45" unit="m²" />
                    <PhoneItem text="Fill cracks & holes" qty="12" unit="ea" />
                    <div className="pt-0.5" />
                    <PhoneCategory name="Priming" />
                    <PhoneItem text="Spot prime bare timber" qty="8" unit="m²" />
                    <PhoneItem text="Full prime new render" qty="22" unit="m²" />
                    <div className="pt-0.5" />
                    <PhoneCategory name="Painting" />
                    <PhoneItem text="2 coats walls" qty="45" unit="m²" />
                    <PhoneItem text="2 coats ceilings" qty="30" unit="m²" />
                    <PhoneItem text="2 coats trim/doors" qty="18" unit="m" />
                    <div className="pt-0.5" />
                    <PhoneCategory name="Cleanup" />
                    <PhoneItem text="Remove masking" qty="1" unit="lot" />
                    <PhoneItem text="Final inspection" qty="1" unit="lot" />
                  </div>
                  {/* Bottom bar */}
                  <div className="flex gap-2 border-t border-white/5 px-3 py-2.5">
                    <div className="flex-1 rounded-lg bg-primary py-1.5 text-center text-[9px] font-semibold text-white">
                      Download PDF
                    </div>
                    <div className="flex-1 rounded-lg border border-white/10 py-1.5 text-center text-[9px] font-medium text-white/70">
                      Email Client
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              Three steps. No templates.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            <StepCard
              number="01"
              title="Upload Photos"
              description="Snap 1-6 photos on-site. Walls, ceilings, trim, facades. The AI reads surface conditions, substrates, and existing coatings."
            />
            <StepCard
              number="02"
              title="Add Details"
              description="Property type, interior or exterior, surface types. Special requirements like lead paint or heritage restrictions. Takes 30 seconds."
            />
            <StepCard
              number="03"
              title="Get Your Scope"
              description="AI generates a complete scope of work with quantities and units. Download the branded PDF or email it directly to your client."
            />
          </div>
        </div>
      </section>

      {/* ─── SAMPLE OUTPUT ─── */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-[oklch(0.975_0.005_55)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mb-14 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              The output
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              A real scope of work.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Not a checklist. Not a template. Quantified, categorised, ready to
              send.
            </p>
          </div>

          <div className="doc-perspective mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-lg border border-border/80 bg-white shadow-xl shadow-black/[0.06]">
              {/* Header */}
              <div className="border-b border-border/60 px-6 py-5 sm:px-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                      Scope of Work
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-tight">
                      3BR House — Interior Repaint
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Newcastle, NSW &middot; Residential &middot; Interior
                    </p>
                  </div>
                  <Badge variant="secondary" className="mt-1 font-mono text-[10px]">
                    Sample
                  </Badge>
                </div>
              </div>

              <div className="divide-y divide-border/50">
                <DocCategory
                  title="Surface Preparation"
                  items={[
                    { desc: "Pressure wash all exterior surfaces", qty: "1", unit: "lot" },
                    { desc: "Scrape and remove loose/flaking paint", qty: "45", unit: "m²" },
                    { desc: "Sand all glossy surfaces for adhesion", qty: "45", unit: "m²" },
                    { desc: "Fill cracks, holes, and imperfections", qty: "12", unit: "ea" },
                    { desc: "Caulk gaps around frames and joints", qty: "24", unit: "m" },
                  ]}
                />
                <DocCategory
                  title="Priming"
                  items={[
                    { desc: "Spot prime bare timber with oil-based primer", qty: "8", unit: "m²" },
                    { desc: "Full prime new plaster/render areas", qty: "22", unit: "m²" },
                    { desc: "Stain-block water damage marks", qty: "3", unit: "ea" },
                  ]}
                />
                <DocCategory
                  title="Painting"
                  items={[
                    { desc: "Apply 2 coats to all walls (low sheen acrylic)", qty: "120", unit: "m²" },
                    { desc: "Apply 2 coats to all ceilings (flat acrylic)", qty: "85", unit: "m²" },
                    { desc: "Apply 2 coats to trim, architraves, doors (semi-gloss)", qty: "48", unit: "m" },
                    { desc: "Apply 2 coats to window frames (semi-gloss enamel)", qty: "12", unit: "ea" },
                  ]}
                />
                <DocCategory
                  title="Cleanup & Protection"
                  items={[
                    { desc: "Mask and protect floors, fittings, and furniture", qty: "1", unit: "lot" },
                    { desc: "Remove all masking, drop sheets, and debris", qty: "1", unit: "lot" },
                    { desc: "Touch-up inspection and final walk-through", qty: "1", unit: "lot" },
                  ]}
                />
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 bg-muted/30 px-6 py-3 sm:px-8">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Generated by ScopePro</span>
                  <span className="font-mono">15 items &middot; 4 categories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              Pay per scope. That&apos;s it.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              No subscriptions. No lock-in. All prices in AUD including GST.
            </p>
          </div>

          {/* Mobile: stacked cards */}
          <div className="mt-12 grid gap-4 sm:hidden">
            <PricingCard name="Starter" credits={10} price={29} perScope="$2.90" />
            <PricingCard name="Professional" credits={25} price={59} perScope="$2.36" popular />
            <PricingCard name="Premium" credits={50} price={99} perScope="$1.98" />
          </div>

          {/* Desktop: table */}
          <div className="mt-12 hidden sm:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-foreground/10">
                  <th className="pb-4 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Pack
                  </th>
                  <th className="pb-4 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Credits
                  </th>
                  <th className="pb-4 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Price
                  </th>
                  <th className="pb-4 pr-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Per scope
                  </th>
                  <th className="pb-4" />
                </tr>
              </thead>
              <tbody>
                <PricingRow name="Starter" credits={10} price={29} perScope="$2.90" />
                <PricingRow name="Professional" credits={25} price={59} perScope="$2.36" popular />
                <PricingRow name="Premium" credits={50} price={99} perScope="$1.98" />
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              3
            </div>
            <p className="text-sm">
              <span className="font-bold">Free scopes on signup.</span>{" "}
              <span className="text-muted-foreground">
                No credit card needed. Try it on a real job before you buy.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-[oklch(0.975_0.005_55)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              From the field
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              What painters are saying.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Testimonial
              quote="I knocked out 6 scopes before lunch. Used to take me half a day to write one properly."
              name="Dave M."
              location="Sydney, NSW"
              role="Residential painter, 12 years"
            />
            <Testimonial
              quote="The AI picks up stuff I'd forget — caulking, stain-blocking, access equipment. My scopes are more thorough now."
              name="Sarah K."
              location="Melbourne, VIC"
              role="Commercial painting contractor"
            />
            <Testimonial
              quote="Clients take me more seriously when I hand over a proper scope with quantities. Won two jobs last week off the back of it."
              name="Mick R."
              location="Brisbane, QLD"
              role="Owner, MR Painting Services"
            />
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              Common questions.
            </h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            <FaqItem
              question="How accurate is the AI?"
              answer="The AI analyses your photos and job details to generate scope items with quantities. It gets the structure right every time — prep, prime, paint, clean. You should always review quantities on-site, just like you would with any estimate. That's why every item is editable."
            />
            <FaqItem
              question="Can I edit the scope after it's generated?"
              answer="Yes. Every item can be edited, added, removed, or toggled on/off. Change descriptions, adjust quantities, add items the AI missed. It's your scope — the AI just gives you a head start."
            />
            <FaqItem
              question="What if the AI gets it wrong?"
              answer="If the generation fails completely, your credit is refunded automatically. If the output needs tweaking, that's what the editor is for. The AI handles the tedious part (listing every prep step, every surface, every coat), and you handle the judgement calls."
            />
            <FaqItem
              question="Do credits expire?"
              answer="No. Credits never expire. Buy when you need them, use them whenever."
            />
            <FaqItem
              question="Can I add my logo to the PDF?"
              answer="Yes. Complete your business profile (business name, ABN, phone, address) and your details appear on every scope PDF you generate. Logo upload is coming soon."
            />
            <FaqItem
              question="Is my data safe?"
              answer="Photos and job details are processed by Google's Gemini AI and stored on Convex Cloud. We don't use your data to train AI models. You can delete your account and all data at any time."
            />
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-[oklch(0.975_0.005_55)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              About
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-tight">
              Built by a tradie, for tradies.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                ScopePro was built by the founder of a carpentry business in
                Newcastle, NSW. After years of writing scopes by hand &mdash; or
                worse, winging it on-site and missing items &mdash; he built a
                tool to do it properly in minutes instead of hours.
              </p>
              <p>
                This isn&apos;t a Silicon Valley product dressed up for tradies.
                It&apos;s built in Australia, priced in AUD, and designed around
                how painting contractors actually work. Surface prep, priming
                systems, coat specifications, cleanup &mdash; all the stuff you
                need in a real scope.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative overflow-hidden bg-[oklch(0.16_0.02_260)] py-20 sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[150px]" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop writing scopes by hand.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/50">
            Sign up, upload some photos, and have a professional scope of work
            in your hands in under 2 minutes.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="h-12 rounded-xl px-8 text-[0.95rem] font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40"
              render={<Link href="/auth/signup" />}
            >
              Start generating scopes for free
              <ArrowRight data-icon="inline-end" className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/35">
            Your first 3 scopes are free. No credit card required.
          </p>
        </div>
      </section>
    </>
  );
}

/* ─── Phone mockup ─── */

function PhoneCategory({ name }: { name: string }) {
  return (
    <div className="rounded bg-primary/15 px-2.5 py-1">
      <p className="text-[8px] font-bold tracking-wide text-primary">{name}</p>
    </div>
  );
}

function PhoneItem({ text, qty, unit }: { text: string; qty: string; unit: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-[2px] text-[7.5px]">
      <span className="truncate text-white/60">{text}</span>
      <span className="ml-2 shrink-0 font-mono text-[7px] text-white/35">
        {qty} {unit}
      </span>
    </div>
  );
}

/* ─── Steps ─── */

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex h-full flex-col rounded-xl border border-border bg-card p-7 transition-all duration-300 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/[0.04]">
      <span className="font-mono text-[2.5rem] font-bold leading-none text-primary/20 transition-colors group-hover:text-primary/35">
        {number}
      </span>
      <h3 className="mt-4 text-[1.1rem] font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ─── Document sample ─── */

function DocCategory({
  title,
  items,
}: {
  title: string;
  items: { desc: string; qty: string; unit: string }[];
}) {
  return (
    <div className="px-6 py-4 sm:px-8">
      <div className="mb-2.5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-[11px] text-muted-foreground">({items.length})</span>
      </div>
      <div className="space-y-1.5 pl-3.5">
        {items.map((item) => (
          <div key={item.desc} className="flex items-start justify-between gap-4 text-[13px]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-[3px] h-3.5 w-3.5 shrink-0 text-success/60" />
              <span className="text-foreground/80">{item.desc}</span>
            </div>
            <span className="shrink-0 rounded bg-muted/80 px-2 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {item.qty} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing ─── */

function PricingRow({
  name,
  credits,
  price,
  perScope,
  popular,
}: {
  name: string;
  credits: number;
  price: number;
  perScope: string;
  popular?: boolean;
}) {
  return (
    <tr className={`pricing-row border-b border-border/60 ${popular ? "bg-primary/[0.03]" : ""}`}>
      <td className="py-5 pr-4 text-[15px] font-semibold">
        <span className="flex items-center gap-2.5">
          {name}
          {popular && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              Most Popular
            </span>
          )}
        </span>
      </td>
      <td className="py-5 pr-4 font-mono text-sm text-foreground/70">{credits}</td>
      <td className="py-5 pr-4 text-xl font-bold">${price}</td>
      <td className="py-5 pr-4 text-sm text-muted-foreground">{perScope}</td>
      <td className="py-5">
        <Button
          variant={popular ? "default" : "outline"}
          size="sm"
          className={popular ? "shadow-sm shadow-primary/20" : ""}
          render={<Link href="/auth/signup" />}
        >
          Get started
        </Button>
      </td>
    </tr>
  );
}

/* ─── Pricing Card (mobile) ─── */

function PricingCard({
  name,
  credits,
  price,
  perScope,
  popular,
}: {
  name: string;
  credits: number;
  price: number;
  perScope: string;
  popular?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        popular
          ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/20"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-base font-bold">{name}</span>
          {popular && (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Most Popular
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">${price}</span>
          <span className="text-sm text-muted-foreground"> AUD</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>{credits} credits</span>
        <span>{perScope} per scope</span>
      </div>
      <Button
        variant={popular ? "default" : "outline"}
        className={`mt-4 h-11 w-full ${popular ? "shadow-sm shadow-primary/20" : ""}`}
        render={<Link href="/auth/signup" />}
      >
        Get started
      </Button>
    </div>
  );
}

/* ─── Testimonial ─── */

function Testimonial({
  quote,
  name,
  location,
  role,
}: {
  quote: string;
  name: string;
  location: string;
  role: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6">
      <p className="flex-1 text-sm leading-relaxed text-foreground/80">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 border-t border-border/60 pt-4">
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">
          {role} &middot; {location}
        </p>
      </div>
    </div>
  );
}

/* ─── FAQ ─── */

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-5">
      <h3 className="text-[15px] font-bold">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </p>
    </div>
  );
}
