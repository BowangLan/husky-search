import Link from "next/link"
import { BookOpen } from "lucide-react"

import { Section, SectionContent, SectionHeader } from "@/components/section"

const genEdRequirements = [
  { code: "NSc", description: "Natural Sciences" },
  { code: "A&H", description: "Arts & Humanities" },
  { code: "SSc", description: "Social Sciences" },
  { code: "C", description: "English Composition" },
  { code: "W", description: "Writing" },
  { code: "DIV", description: "Diversity" },
  { code: "RSN", description: "Reasoning" },
]

export function GenEdSection() {
  return (
    <Section className="px-page mx-page">
      <SectionHeader
        title="Gen Eds"
        subtitle="Browse general education requirements"
        className="pb-0 lg:pb-0"
      />
      <SectionContent>
        <div className="sm:grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex flex-wrap items-center">
          {genEdRequirements.map((genEd) => (
            <Link
              key={genEd.code}
              href={`/gen-eds/${genEd.code}`}
              prefetch={true}
              className="group flex h-full flex-col rounded-xl border border-zinc-200/80 bg-white p-3 transition-all duration-300 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lg hover:shadow-zinc-200/60 dark:border-zinc-800/80 dark:bg-zinc-900/20 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60 dark:hover:shadow-black/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950/50 dark:group-hover:bg-indigo-900/50">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-medium text-sm sm:text-base/tight tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-950 dark:text-zinc-200 dark:group-hover:text-zinc-100">
                    {genEd.code}
                  </h3>
                  <p className="text-xs/snug sm:text-sm/snug text-zinc-500 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-400">
                    {genEd.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionContent>
    </Section>
  )
}
