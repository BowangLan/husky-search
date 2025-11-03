import { useNode } from "@/store/prereq-graph-node-map.store"
import { usePrereqGraphSelectedCourseStore } from "@/store/prereq-graph-selected-course.store"
import { Panel } from "@xyflow/react"

import { Section, SectionTitle } from "./panel-section"

const PANEL_WIDTH = "22rem"

export function PrereqOptionsPanel() {
  const selectedCourse = usePrereqGraphSelectedCourseStore(
    (state) => state.selectedCourse
  )
  const richNodeData = useNode(selectedCourse?.courseCode ?? "")

  if (!richNodeData || !selectedCourse) {
    return null
  }

  return (
    <Panel position="top-left">
      <div
        className="max-h-[85vh] overflow-y-auto shadow-lg border rounded-lg bg-background"
        style={{
          width: PANEL_WIDTH,
        }}
      >
        <Section>
          <SectionTitle>Prerequisites</SectionTitle>
        </Section>
        {/* <Section>
          <SectionTitle></SectionTitle>
        </Section> */}
      </div>
    </Panel>
  )
}
