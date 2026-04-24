import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/size-guide")({
  component: SizeGuidePage,
  head: () => ({
    meta: [
      { title: "Size Guide — JR Lifestyle" },
      { name: "description", content: "Find the right JR Lifestyle fit with our quick size guide." },
    ],
  }),
});

function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-5 py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blood">Fit Guide</p>
        <h1 className="mt-3 font-display text-6xl uppercase tracking-[0.08em]">Size Guide</h1>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          JR Lifestyle tees are designed with an oversized streetwear fit. If you want a truer fit, size down. If you want the intended roomy silhouette, stay true to size.
        </p>
        <div className="mt-10 overflow-hidden rounded-3xl border border-border/70">
          <table className="w-full text-left">
            <thead className="bg-card text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="px-4 py-4">Size</th>
                <th className="px-4 py-4">Chest</th>
                <th className="px-4 py-4">Length</th>
                <th className="px-4 py-4">Sleeve</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ["S", '21"', '27"', '8.5"'],
                ["M", '22"', '28"', '9"'],
                ["L", '23"', '29"', '9.5"'],
                ["XL", '24"', '30"', '10"'],
                ["XXL", '25"', '31"', '10.5"'],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-border/70">
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-4">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
