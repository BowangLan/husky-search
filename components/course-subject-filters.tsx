import { FacetedFilter } from "./ui/faceted-filter"

export function CourseSubjectFilters({
  selectedValues,
  onChange,
  facets,
  options,
}: {
  selectedValues: Set<string>
  onChange: (values: Set<string>) => void
  facets: Record<string, number>
  options: {
    label: string
    value: string
  }[]
}) {
  return (
    <FacetedFilter
      title="Subjects"
      selectedValues={selectedValues}
      facets={facets}
      options={options}
      onChange={onChange}
    />
  )
}
