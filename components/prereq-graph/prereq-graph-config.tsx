import type { EdgeTypes, NodeTypes } from "@xyflow/react"

import { CourseNode } from "./course-node"
import { SubjectAreaGroupNode } from "./subject-area-group-node"

/**
 * Centralized configuration for prereq graph node types
 */
export const nodeTypes: NodeTypes = {
  courseNode: CourseNode,
  subjectAreaGroupNode: SubjectAreaGroupNode,
}

/**
 * Centralized configuration for prereq graph edge types
 */
export const edgeTypes: EdgeTypes = {}

