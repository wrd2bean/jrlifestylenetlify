import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { DecorBg } from "@/components/decor-bg";
import { Mail, Instagram, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — JR Lifestyle" },
      { name: "description", content: "Get in touch with JR Lifestyle Clothing. Questions, wholesale, press, and collaborations." },
    ],
  }),
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-20">
        <DecorBg />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Get In Touch</p>
          <h1 className="mt-3 font-display text-6xl uppercase tracking-wider text-foreground md:text-7xl">
            Contact <span className="font-script text-4xl text-bone md:text-5xl">us</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Questions about an order, wholesale, press, or collabs — we read every message.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-5 px-5 md:grid-cols-3 md:gap-10">
          {[
            { Icon: Mail, label: "Email", value: "hello@jrlifestyle.com" },
            { Icon: Instagram, label: "Instagram", value: "@jrlifestyle" },
            { Icon: MessageCircle, label: "Support", value: "support@jrlifestyle.com" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="rounded-[1.5rem] border border-border/60 bg-card p-6 text-center shadow-[0_20px_50px_-38px_rgba(0,0,0,0.9)]">
              <Icon className="mx-auto h-6 w-6 text-bone" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl px-5">
          <h2 className="font-display text-3xl uppercase tracking-wider text-foreground">Send a Message</h2>
          <form className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Name"
                className="min-h-12 rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-bone focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                className="min-h-12 rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-bone focus:outline-none"
              />
            </div>
            <input
              placeholder="Subject"
              className="min-h-12 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-bone focus:outline-none"
            />
            <textarea
              rows={6}
              placeholder="Your message…"
              className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-bone focus:outline-none"
            />
            <button
              type="button"
              className="min-h-12 rounded-2xl bg-bone px-8 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-background transition-transform duration-200 hover:scale-[1.01] hover:bg-foreground"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
