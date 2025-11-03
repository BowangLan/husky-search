"use client";

import { useState, useMemo } from "react";
import { PrereqGraphDialog } from "@/components/prereq-graph/prereq-graph-dialog";
import { Section, SectionContent, SectionHeader, SectionTitle } from "@/components/section";
import { Button } from "@/components/ui/button";
import { mergePrereqGraphs } from "@/lib/prereq-graph-utils";
import { Network } from "lucide-react";
import type { ConvexCourseOverview } from "@/types/convex-courses";

interface ProgramPrereqGraphsProps {
  courses: ConvexCourseOverview[];
  subjectArea: string;
}

export function ProgramPrereqGraphs({
  courses,
  subjectArea,
}: ProgramPrereqGraphsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Merge all prereq graphs from all courses in the program
  const mergedPrereqGraph = useMemo(() => {
    const prereqMaps = courses
      .map((course) => course.prereqMap)
      .filter((map) => map !== null && map !== undefined);
    
    if (prereqMaps.length === 0) {
      return null;
    }

    return mergePrereqGraphs(prereqMaps);
  }, [courses]);

  // Count courses with prereq data
  const coursesWithPrereqs = courses.filter((c) => c.prereqMap).length;
  const hasPrereqData = mergedPrereqGraph !== null && coursesWithPrereqs > 0;

  return (
    <>
      <Section>
        <SectionHeader>
          <SectionTitle>Prerequisite Graph</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {hasPrereqData
              ? `Combined prerequisite relationships for all courses in this program (${coursesWithPrereqs} courses)`
              : "Prerequisite graph data is being collected for courses in this program"}
          </p>
        </SectionHeader>
        <SectionContent>
          <Button
            onClick={() => {
              if (hasPrereqData) {
                setIsDialogOpen(true);
              }
            }}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!hasPrereqData}
          >
            <Network className="mr-2 h-4 w-4" />
            View Prerequisite Graph
          </Button>
          {!hasPrereqData && (
            <p className="text-xs text-muted-foreground mt-2">
              Prerequisite graph data will appear here once it's available for courses in this program.
            </p>
          )}
        </SectionContent>
      </Section>

      {hasPrereqData && (
        <PrereqGraphDialog
          prereqGraph={mergedPrereqGraph}
          currentCourseCode="" // No single current course for merged graph
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </>
  );
}

