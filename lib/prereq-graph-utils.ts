import type { DawgpathCourseDetail } from "@/convex/dawgpath";
import { type Node, type Edge, MarkerType } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { ConvexCourseOverview } from "@/types/convex-courses";

// Constants for layout (following guide: SCREAMING_SNAKE_CASE)
export const NODE_WIDTH = 240; // Fixed width for prereq nodes in pixels
export const NODE_HEIGHT = 100;
export const NODE_VERTICAL_SPACING = 15;
export const NODE_HORIZONTAL_SPACING = 120;

export type PrereqGraphCourseNodeData = {
  courseCode: string;
  courseTitle: string;
  departmentAbbrev: string;
  courseNumber: number;
  courseLevel: number;
  styleVariant?: "default" | "current";
  groupId?: string; // ID of the group node this course belongs to (if grouped)
  isOfferedNow?: boolean;
}

export type SubjectAreaGroupNodeData = {
  subjectArea: string;
  courses: string[];
  isExpanded?: boolean;
  onExpandToggle?: (groupId: string) => void;
  styleVariant?: "default" | "current";
}

export type PrereqGraphNodeUnion = Node<PrereqGraphCourseNodeData> | Node<SubjectAreaGroupNodeData>;

type PrereqGraphNode = Node<PrereqGraphCourseNodeData>;

export const createDirectedEdge = (params: { id?: string; source: string; target: string }): Edge => {
  const { id, source, target } = params;
  return {
    id: id ?? `edge-${source}-${target}`,
    source: source,
    target: target,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      // color: "var(--color-primary)",
    },
  };
};

/**
 * Type for prereq map stored in ConvexCourseOverview
 */
type PrereqMap = Pick<DawgpathCourseDetail["prereq_graph"]["x"], "edges" | "nodes">;

/**
 * Merges multiple prereq graphs into a single combined graph
 * Following guide: pure function, handles edge cases gracefully
 */
export function mergePrereqGraphs(
  prereqMaps: Array<PrereqMap | null | undefined>
): DawgpathCourseDetail["prereq_graph"] | null {
  const validMaps = prereqMaps.filter((map): map is PrereqMap => {
    if (!map || !map.edges || !map.nodes) {
      return false;
    }
    return true;
  });

  if (validMaps.length === 0) {
    return null;
  }

  // Build a map of course codes to node IDs to handle node deduplication
  const courseCodeToNodeId = new Map<string, string>();
  const mergedNodes: DawgpathCourseDetail["prereq_graph"]["x"]["nodes"] = {
    "course.level": {},
    course_branch: {},
    course_cat_omit: {},
    course_college: {},
    course_number: {},
    course_title: {},
    department_abbrev: {},
    diversity_crs: {},
    english_comp: {},
    indiv_society: {},
    natural_world: {},
    qsr: {},
    vis_lit_perf_arts: {},
    writing_crs: {},
  };

  // Merge all nodes first, deduplicating by course code
  for (const map of validMaps) {
    Object.keys(map.nodes.course_number || {}).forEach((nodeId) => {
      const courseDept = map.nodes.department_abbrev?.[nodeId];
      const courseNum = map.nodes.course_number?.[nodeId];

      // Skip if essential data is missing
      if (!courseDept || courseNum === undefined) {
        return;
      }

      const courseCode = `${courseDept} ${courseNum}`;

      // If course code already exists, skip (use first occurrence)
      if (!courseCodeToNodeId.has(courseCode)) {
        courseCodeToNodeId.set(courseCode, nodeId);

        // Safely copy node properties, handling null/undefined values
        if (map.nodes["course.level"]?.[nodeId] !== undefined) {
          mergedNodes["course.level"][nodeId] = map.nodes["course.level"][nodeId]!;
        }
        if (map.nodes.course_branch && map.nodes.course_branch[nodeId] !== undefined && map.nodes.course_branch[nodeId] !== null) {
          mergedNodes.course_branch[nodeId] = map.nodes.course_branch[nodeId];
        }
        if (map.nodes.course_cat_omit?.[nodeId] !== undefined) {
          mergedNodes.course_cat_omit[nodeId] = map.nodes.course_cat_omit[nodeId]!;
        }
        if (map.nodes.course_college?.[nodeId] !== undefined) {
          mergedNodes.course_college[nodeId] = map.nodes.course_college[nodeId]!;
        }
        if (map.nodes.course_number?.[nodeId] !== undefined) {
          mergedNodes.course_number[nodeId] = map.nodes.course_number[nodeId]!;
        }
        if (map.nodes.course_title?.[nodeId] !== undefined) {
          mergedNodes.course_title[nodeId] = map.nodes.course_title[nodeId]!;
        }
        if (map.nodes.department_abbrev?.[nodeId] !== undefined) {
          mergedNodes.department_abbrev[nodeId] = map.nodes.department_abbrev[nodeId]!;
        }
        if (map.nodes.diversity_crs && map.nodes.diversity_crs[nodeId] !== undefined && map.nodes.diversity_crs[nodeId] !== null) {
          mergedNodes.diversity_crs[nodeId] = map.nodes.diversity_crs[nodeId];
        }
        if (map.nodes.english_comp && map.nodes.english_comp[nodeId] !== undefined && map.nodes.english_comp[nodeId] !== null) {
          mergedNodes.english_comp[nodeId] = map.nodes.english_comp[nodeId];
        }
        if (map.nodes.indiv_society && map.nodes.indiv_society[nodeId] !== undefined && map.nodes.indiv_society[nodeId] !== null) {
          mergedNodes.indiv_society[nodeId] = map.nodes.indiv_society[nodeId];
        }
        if (map.nodes.natural_world && map.nodes.natural_world[nodeId] !== undefined && map.nodes.natural_world[nodeId] !== null) {
          mergedNodes.natural_world[nodeId] = map.nodes.natural_world[nodeId];
        }
        if (map.nodes.qsr && map.nodes.qsr[nodeId] !== undefined && map.nodes.qsr[nodeId] !== null) {
          mergedNodes.qsr[nodeId] = map.nodes.qsr[nodeId];
        }
        if (map.nodes.vis_lit_perf_arts && map.nodes.vis_lit_perf_arts[nodeId] !== undefined && map.nodes.vis_lit_perf_arts[nodeId] !== null) {
          mergedNodes.vis_lit_perf_arts[nodeId] = map.nodes.vis_lit_perf_arts[nodeId];
        }
        if (map.nodes.writing_crs && map.nodes.writing_crs[nodeId] !== undefined && map.nodes.writing_crs[nodeId] !== null) {
          mergedNodes.writing_crs[nodeId] = map.nodes.writing_crs[nodeId];
        }
      }
    });
  }

  // Now merge edges, deduplicating by (from, to) course code pair
  const edgeKeySet = new Set<string>();
  const mergedEdges: DawgpathCourseDetail["prereq_graph"]["x"]["edges"] = {
    from: {},
    to: {},
    pr_and_or: {},
    pr_concurrency: {},
    pr_cr_s: {},
    pr_grade_min: {},
    pr_group_no: {},
    pr_seq_no: {},
  };

  let edgeCounter = 0;
  for (const map of validMaps) {
    Object.keys(map.edges.from || {}).forEach((edgeId) => {
      const fromCourseCode = map.edges.from?.[edgeId];
      const toCourseCode = map.edges.to?.[edgeId];

      // Skip if essential edge data is missing
      if (!fromCourseCode || !toCourseCode) {
        return;
      }

      const edgeKey = `${fromCourseCode}->${toCourseCode}`;

      // Only add edge if it doesn't already exist
      if (!edgeKeySet.has(edgeKey)) {
        edgeKeySet.add(edgeKey);
        const newEdgeId = String(edgeCounter++);

        mergedEdges.from[newEdgeId] = fromCourseCode;
        mergedEdges.to[newEdgeId] = toCourseCode;

        if (map.edges.pr_and_or?.[edgeId]) {
          mergedEdges.pr_and_or[newEdgeId] = map.edges.pr_and_or[edgeId]!;
        }
        if (map.edges.pr_concurrency?.[edgeId]) {
          mergedEdges.pr_concurrency[newEdgeId] = map.edges.pr_concurrency[edgeId]!;
        }
        if (map.edges.pr_cr_s?.[edgeId]) {
          mergedEdges.pr_cr_s[newEdgeId] = map.edges.pr_cr_s[edgeId]!;
        }
        if (map.edges.pr_grade_min?.[edgeId]) {
          mergedEdges.pr_grade_min[newEdgeId] = map.edges.pr_grade_min[edgeId]!;
        }
        if (map.edges.pr_group_no?.[edgeId] !== undefined) {
          mergedEdges.pr_group_no[newEdgeId] = map.edges.pr_group_no[edgeId]!;
        }
        if (map.edges.pr_seq_no?.[edgeId] !== undefined) {
          mergedEdges.pr_seq_no[newEdgeId] = map.edges.pr_seq_no[edgeId]!;
        }
      }
    });
  }

  return {
    x: {
      edges: mergedEdges,
      nodes: mergedNodes,
      options: {
        autoResize: true,
        edges: {
          arrows: "to",
          color: "#000000",
          smooth: {
            forceDirection: "none",
            roundness: 0.5,
            type: "continuous",
          },
        },
        height: "400px",
        interaction: {
          dragNodes: true,
        },
        layout: {
          hierarchical: {
            blockShifting: true,
            direction: "LR",
            edgeMinimization: true,
            nodeSpacing: 100,
            sortMethod: "directed",
          },
        },
        nodes: {
          borderWidth: 1,
          borderWidthSelected: 2,
          color: {
            background: "#ffffff",
            border: "#000000",
            highlight: {
              background: "#ffff00",
              border: "#000000",
            },
          },
          shape: "box",
        },
        physics: false,
      },
    },
  };
}

/**
 * Converts DawgpathCourseDetail prereq_graph to React Flow format
 * Following guide: pure function, handles edge cases gracefully
 * Groups courses that the current course points to by subject area
 */
export function convertPrereqGraphToReactFlow(
  prereqGraph: DawgpathCourseDetail["prereq_graph"],
  currentCourseCode: string
): { nodes: PrereqGraphNodeUnion[]; edges: Edge[] } {
  if (!prereqGraph?.x) {
    return { nodes: [], edges: [] };
  }

  try {
    const edges: Edge[] = [];

    Object.entries(prereqGraph.x.edges.from).forEach(([nodeId, courseCode]) => {
      edges.push(createDirectedEdge({
        id: `raw-course-edge-${nodeId}`,
        source: prereqGraph.x.edges.from[nodeId]!,
        target: prereqGraph.x.edges.to[nodeId]!,
      }));
    });

    // Find all courses that the current course points to
    const rightCourses = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === currentCourseCode) {
        rightCourses.add(edge.target);
      }
    });
    const leftCourses = new Set<string>();
    edges.forEach((edge) => {
      if (edge.target === currentCourseCode) {
        leftCourses.add(edge.source);
      }
    });


    const courseDataMap = new Map<string, PrereqGraphCourseNodeData>();
    Object.entries(prereqGraph.x.nodes.course_number).forEach(([_nodeId, courseNumber]) => {
      const courseDepartment = prereqGraph.x.nodes.department_abbrev[_nodeId]!;
      const courseTitle = prereqGraph.x.nodes.course_title[_nodeId]!;
      const courseLevel = prereqGraph.x.nodes["course.level"][_nodeId]!;
      const courseCode = `${courseDepartment} ${courseNumber}`;
      courseDataMap.set(courseCode, {
        courseCode: courseCode,
        courseTitle: courseTitle,
        departmentAbbrev: courseDepartment,
        courseNumber: courseNumber,
        courseLevel: courseLevel,
        styleVariant: currentCourseCode === courseCode ? "current" : "default"
      });
    });

    // Group courses by subject area (department abbreviation)
    const subjectAreaGroups = new Map<string, string[]>();
    rightCourses.forEach((courseCode) => {
      const courseData = courseDataMap.get(courseCode);
      if (courseData) {
        const subjectArea = courseData.departmentAbbrev;
        if (!subjectAreaGroups.has(subjectArea)) {
          subjectAreaGroups.set(subjectArea, []);
        }
        subjectAreaGroups.get(subjectArea)!.push(courseCode);
      }
    });

    // Create initial nodes (all course nodes)
    const nodes: PrereqGraphNodeUnion[] = Array.from(courseDataMap.values()).map((data) => ({
      id: data.courseCode,
      data: data,
      position: { x: 0, y: 0 },
      type: "courseNode",
      hidden: rightCourses.has(data.courseCode),
    }));

    // Ensure current course node exists (it might not be in the prereq graph if it has no prerequisites)
    if (!courseDataMap.has(currentCourseCode)) {
      // Extract subject area and course number from current course code
      const parts = currentCourseCode.split(" ");
      if (parts.length >= 2) {
        const deptAbbrev = parts[0]!;
        const courseNum = parseInt(parts[1]!);
        if (!isNaN(courseNum)) {
          nodes.push({
            id: currentCourseCode,
            data: {
              courseCode: currentCourseCode,
              courseTitle: "", // Unknown title
              departmentAbbrev: deptAbbrev,
              courseNumber: courseNum,
              courseLevel: Math.floor(courseNum / 100), // Estimate level
              styleVariant: "current",
            },
            position: { x: 0, y: 0 },
            type: "courseNode",
          });
        }
      }
    }

    // Create group nodes and update edges
    const newEdges: Edge[] = [];
    // Use a high counter to avoid conflicts with original edge IDs
    let edgeIdCounter = 10000;

    // Process edges: replace direct edges from current course with group nodes
    edges.forEach((edge) => {
      if (edge.source === currentCourseCode && rightCourses.has(edge.target)) {
        // Skip - will be replaced with group node edges
        return;
      }
      // Keep all other edges
      newEdges.push(edge);
    });

    // Create group nodes and edges
    subjectAreaGroups.forEach((courses, subjectArea) => {
      // Only create group node if there are multiple courses or if we want to group single courses too
      // For now, let's group all courses by subject area
      const groupNodeId = `group-${subjectArea}`;

      // Create group node
      nodes.push({
        id: groupNodeId,
        data: {
          subjectArea: subjectArea,
          courses: courses.sort(),
          isExpanded: false, // Default to collapsed
          styleVariant: "default",
        },
        position: { x: 0, y: 0 },
        type: "subjectAreaGroupNode",
      });

      // Add edge from current course to group node
      newEdges.push({
        id: `edge-${edgeIdCounter++}`,
        source: currentCourseCode,
        target: groupNodeId,
      });

      // Mark course nodes as belonging to this group and add edges from group to courses
      courses.forEach((courseCode) => {
        // Update the course node data to include groupId
        const courseNode = nodes.find((n) => n.id === courseCode);
        if (courseNode && courseNode.type === "courseNode") {
          courseNode.data = {
            ...courseNode.data,
            groupId: groupNodeId,
          };
        }

        // Add edges from group node to each course in the group
        newEdges.push({
          id: `edge-${edgeIdCounter++}`,
          source: groupNodeId,
          target: courseCode,
        });
      });
    });

    // const layoutedNodes = applyDagreLayout(nodes, newEdges, currentCourseCode);

    return { nodes: nodes, edges: newEdges };
  } catch (error) {
    // Following guide: error handling - graceful fallback
    console.error("Error converting prereq graph:", error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Layout using dagre: automatic graph layout with left-to-right direction
 * Following guide: pure function, no side effects, testable
 * Uses measured node dimensions when available, falls back to calculated dimensions
 * When a selectedCourseCode is provided, prioritizes layout with vertical lists on left and right
 */
export function applyDagreLayout(
  nodes: PrereqGraphNodeUnion[],
  edges: Edge[],
  currentCourseCode: string,
  selectedCourseCode?: string
): PrereqGraphNodeUnion[] {
  // Helper function to get node dimensions
  const getNodeDimensions = (node: PrereqGraphNodeUnion): { width: number; height: number } => {
    // Prefer measured dimensions if available (most accurate)
    if (node.measured?.width && node.measured?.height) {
      return {
        width: node.measured.width,
        height: node.measured.height,
      };
    }

    // Fallback to calculated dimensions
    let height = NODE_HEIGHT;
    let width = NODE_WIDTH;

    // Group nodes height depends on expansion state
    if (node.type === "subjectAreaGroupNode") {
      const groupData = node.data as SubjectAreaGroupNodeData;
      if (groupData.isExpanded) {
        height = Math.max(NODE_HEIGHT, 60 + groupData.courses.length * 20);
      } else {
        height = NODE_HEIGHT; // Fixed height when collapsed
      }
    }

    return { width, height };
  };

  // If a course is selected, use prioritized layout
  if (selectedCourseCode) {
    const selectedNode = nodes.find(
      (n) => n.id === selectedCourseCode && n.type === "courseNode" && !n.hidden
    );

    if (selectedNode) {
      // Find all courses that point to the selected course (left side)
      const leftNeighbors = new Set<string>();
      // Find all courses that the selected course points to (right side)
      const rightNeighbors = new Set<string>();

      edges.forEach((edge) => {
        if (edge.target === selectedCourseCode && !edge.source.includes("group-")) {
          // Direct prerequisites (point to selected course)
          leftNeighbors.add(edge.source);
        } else if (edge.source === selectedCourseCode && !edge.target.includes("group-")) {
          // Direct dependents (selected course points to)
          rightNeighbors.add(edge.target);
        }
      });

      // Also include group nodes connected to selected course
      const leftGroupNodes = new Set<string>();
      const rightGroupNodes = new Set<string>();
      edges.forEach((edge) => {
        if (edge.target === selectedCourseCode && edge.source.includes("group-")) {
          leftGroupNodes.add(edge.source);
        } else if (edge.source === selectedCourseCode && edge.target.includes("group-")) {
          rightGroupNodes.add(edge.target);
        }
      });

      // Create dagre graph with rank constraints
      const graph = new dagre.graphlib.Graph();
      graph.setDefaultEdgeLabel(() => ({}));
      graph.setGraph({
        rankdir: "LR",
        nodesep: NODE_VERTICAL_SPACING,
        ranksep: NODE_HORIZONTAL_SPACING,
        marginx: 50,
        marginy: 50,
      });

      // Add nodes with dimensions
      const visibleNodes = nodes.filter((node) => !node.hidden);
      visibleNodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node);
        graph.setNode(node.id, { width, height });
      });

      // Add edges
      edges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
      });

      // Run dagre layout (we'll manually adjust positions for left/right neighbors after)
      dagre.layout(graph);

      const leftNeighborArray = Array.from(leftNeighbors);
      const rightNeighborArray = Array.from(rightNeighbors);

      // Extract positions and arrange left/right neighbors vertically with even spacing
      const positionedNodes = nodes.map((node) => {
        if (node.hidden) {
          return node;
        }

        const dagreNode = graph.node(node.id);
        if (!dagreNode) {
          return node;
        }

        const { width, height } = getNodeDimensions(node);
        let finalX = dagreNode.x - width / 2;
        let finalY = dagreNode.y - height / 2;

        // If this is the selected course, keep its position from dagre
        if (node.id === selectedCourseCode) {
          return {
            ...node,
            position: { x: finalX, y: finalY },
          };
        }

        // Arrange left neighbors vertically with even spacing
        if (leftNeighbors.has(node.id) || leftGroupNodes.has(node.id)) {
          const leftList = [
            ...leftNeighborArray.filter((id) => {
              const n = nodes.find((n) => n.id === id && !n.hidden);
              return n && (n.type === "courseNode" || n.type === "subjectAreaGroupNode");
            }),
            ...Array.from(leftGroupNodes),
          ].filter(Boolean);

          // Sort by a stable order (e.g., by id)
          leftList.sort();

          const selectedNodeData = graph.node(selectedCourseCode);
          if (selectedNodeData) {
            const selectedY = selectedNodeData.y;

            // Calculate total height needed for left neighbors
            let totalHeight = 0;
            leftList.forEach((id) => {
              const n = nodes.find((n) => n.id === id);
              if (n && !n.hidden) {
                totalHeight += getNodeDimensions(n).height + NODE_VERTICAL_SPACING;
              }
            });
            totalHeight -= NODE_VERTICAL_SPACING; // Remove last spacing

            // Start from top, centered around selected course
            let currentY = selectedY - totalHeight / 2;
            const nodeIndex = leftList.indexOf(node.id);
            if (nodeIndex !== -1) {
              // Calculate cumulative height up to this node
              for (let i = 0; i < nodeIndex; i++) {
                const prevId = leftList[i];
                if (prevId) {
                  const prevNode = nodes.find((n) => n.id === prevId);
                  if (prevNode && !prevNode.hidden) {
                    currentY += getNodeDimensions(prevNode).height + NODE_VERTICAL_SPACING;
                  }
                }
              }
              finalY = currentY - height / 2;
            }

            // Adjust x position based on selected course
            const selectedX = selectedNodeData.x; // center x of selected
            const selectedWidth = getNodeDimensions(selectedNode).width;
            // Place left neighbor fully to the left with desired gap:
            // top-left X = selectedCenterX - selectedWidth/2 - gap - neighborWidth
            finalX = selectedX - selectedWidth / 2 - NODE_HORIZONTAL_SPACING - width;
          }

          return {
            ...node,
            position: { x: finalX, y: finalY },
          };
        }

        // Arrange right neighbors vertically with even spacing
        if (rightNeighbors.has(node.id) || rightGroupNodes.has(node.id)) {
          const rightList = [
            ...rightNeighborArray.filter((id) => {
              const n = nodes.find((n) => n.id === id && !n.hidden);
              return n && (n.type === "courseNode" || n.type === "subjectAreaGroupNode");
            }),
            ...Array.from(rightGroupNodes),
          ].filter(Boolean);

          // Sort by a stable order
          rightList.sort();

          const selectedNodeData = graph.node(selectedCourseCode);
          if (selectedNodeData) {
            const selectedY = selectedNodeData.y;

            // Calculate total height needed for right neighbors
            let totalHeight = 0;
            rightList.forEach((id) => {
              const n = nodes.find((n) => n.id === id);
              if (n && !n.hidden) {
                totalHeight += getNodeDimensions(n).height + NODE_VERTICAL_SPACING;
              }
            });
            totalHeight -= NODE_VERTICAL_SPACING;

            // Start from top, centered around selected course
            let currentY = selectedY - totalHeight / 2;
            const nodeIndex = rightList.indexOf(node.id);
            if (nodeIndex !== -1) {
              // Calculate cumulative height up to this node
              for (let i = 0; i < nodeIndex; i++) {
                const prevId = rightList[i];
                if (prevId) {
                  const prevNode = nodes.find((n) => n.id === prevId);
                  if (prevNode && !prevNode.hidden) {
                    currentY += getNodeDimensions(prevNode).height + NODE_VERTICAL_SPACING;
                  }
                }
              }
              finalY = currentY - height / 2;
            }

            // Adjust x position based on selected course
            const selectedX = selectedNodeData.x; // center x of selected
            const selectedWidth = getNodeDimensions(selectedNode).width;
            // Place right neighbor directly to the right with desired gap:
            // top-left X = selectedCenterX + selectedWidth/2 + gap
            finalX = selectedX + selectedWidth / 2 + NODE_HORIZONTAL_SPACING;
          }

          return {
            ...node,
            position: { x: finalX, y: finalY },
          };
        }

        // For other nodes, use dagre's layout
        return {
          ...node,
          position: { x: finalX, y: finalY },
        };
      });

      return positionedNodes;
    }
  }

  // Default layout when no course is selected
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR", // Left to right layout
    nodesep: NODE_VERTICAL_SPACING, // Vertical spacing
    ranksep: NODE_HORIZONTAL_SPACING, // Horizontal spacing
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre graph with dimensions
  nodes.forEach((node) => {
    if (node.hidden) {
      return;
    }

    const { width, height } = getNodeDimensions(node);

    graph.setNode(node.id, {
      width,
      height,
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // Run dagre layout
  dagre.layout(graph);

  // Extract positions from dagre and update nodes
  // Following guide: immutability - create new objects, never mutate
  const positionedNodes = nodes.map((node) => {
    if (node.hidden) {
      return node;
    }

    const dagreNode = graph.node(node.id);
    if (!dagreNode) {
      return node;
    }

    const { width, height } = getNodeDimensions(node);

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2, // Center the node
        y: dagreNode.y - height / 2, // Center the node
      },
    };
  });

  return positionedNodes;
}

/**
 * Creates nodes and edges from a list of course overviews
 */
export function createNodesAndEdgesFromCourses(
  courses: Record<string, ConvexCourseOverview>,
  options?: { ignoreUnlistedNodes?: boolean; hideUnconnectedNodes?: boolean }
): { nodes: PrereqGraphNodeUnion[]; edges: Edge[] } {
  const nodeMap = new Map<string, PrereqGraphNodeUnion>();
  const edges: Edge[] = [];
  const ignoreUnlistedNodes = options?.ignoreUnlistedNodes === true;
  const hideUnconnectedNodes = options?.hideUnconnectedNodes === true;

  const parseCourseNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isNaN(value) ? 0 : value;
    }
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const permittedCourseCodes = new Set<string>();
  Object.entries(courses).forEach(([key, course]) => {
    if (key) {
      permittedCourseCodes.add(key);
    }
    if (course.courseCode) {
      permittedCourseCodes.add(course.courseCode);
    }
    const fallbackCode = `${course.subjectArea} ${course.courseNumber}`.trim();
    if (fallbackCode) {
      permittedCourseCodes.add(fallbackCode);
    }
  });

  const ensureNode = (
    courseCode: string,
    data: {
      title?: string;
      department?: string;
      courseNumber?: unknown;
      level?: unknown;
      isOfferedNow?: boolean;
    }
  ) => {
    if (!courseCode || nodeMap.has(courseCode)) {
      return;
    }

    if (ignoreUnlistedNodes && !permittedCourseCodes.has(courseCode)) {
      return;
    }

    const courseNumber = parseCourseNumber(data.courseNumber);
    const departmentAbbrev = data.department ?? courseCode.split(" ")[0] ?? "";
    const levelFromData =
      typeof data.level === "number"
        ? data.level
        : typeof data.level === "string"
          ? parseInt(data.level, 10)
          : undefined;
    const courseLevel =
      levelFromData && !Number.isNaN(levelFromData)
        ? levelFromData
        : courseNumber > 0
          ? Math.floor(courseNumber / 100)
          : 0;

    nodeMap.set(courseCode, {
      id: courseCode,
      type: "courseNode",
      position: { x: 0, y: 0 },
      data: {
        courseCode,
        courseTitle: data.title ?? "",
        departmentAbbrev,
        courseNumber,
        courseLevel,
        styleVariant: "default",
        isOfferedNow: data.isOfferedNow,
      },
    });
  };

  const courseEntries = Object.values(courses);
  courseEntries.forEach((course) => {
    // Extract isOfferedNow: true if enroll array has any entry with stateKey === "active"
    // undefined if enroll array is empty, false if no active enrollments found
    const isOfferedNow = course.enroll.length > 0
      ? course.enroll.some((enroll) => enroll.stateKey === "active")
      : undefined;

    ensureNode(course.courseCode, {
      title: course.title,
      department: course.subjectArea,
      courseNumber: course.courseNumber,
      isOfferedNow,
    });

    const prereqMap = course.prereqMap;
    if (!prereqMap) {
      return;
    }

    const { nodes: prereqNodes } = prereqMap;
    const courseNumberNodes = prereqNodes?.course_number;
    if (courseNumberNodes) {
      Object.keys(courseNumberNodes).forEach((nodeId) => {
        const department = prereqNodes?.department_abbrev?.[nodeId];
        const courseNumber = courseNumberNodes[nodeId];
        if (!department || courseNumber === undefined || courseNumber === null) {
          return;
        }

        const courseCode = `${department} ${courseNumber}`.trim();
        if (!courseCode) {
          return;
        }

        // Check if this prerequisite course exists in the courses record to get its isOfferedNow status
        const prereqCourse = courses[courseCode];
        const isOfferedNow = prereqCourse && prereqCourse.enroll.length > 0
          ? prereqCourse.enroll.some((enroll) => enroll.stateKey === "active")
          : undefined;

        ensureNode(courseCode, {
          title: prereqNodes?.course_title?.[nodeId],
          department,
          courseNumber,
          level: prereqNodes?.["course.level"]?.[nodeId],
          isOfferedNow,
        });
      });
    }
  });

  const nodeCodes = new Set(nodeMap.keys());
  const edgeKeys = new Set<string>();

  courseEntries.forEach((course) => {
    const prereqMap = course.prereqMap;
    if (!prereqMap?.edges) {
      return;
    }

    Object.keys(prereqMap.edges.from ?? {}).forEach((edgeId) => {
      const sourceCode = prereqMap.edges.from?.[edgeId];
      const targetCode = prereqMap.edges.to?.[edgeId];

      if (!sourceCode || !targetCode) {
        return;
      }

      if (!nodeCodes.has(sourceCode) || !nodeCodes.has(targetCode)) {
        return;
      }

      const edgeKey = `${sourceCode}->${targetCode}`;

      if (edgeKeys.has(edgeKey)) {
        return;
      }

      edgeKeys.add(edgeKey);

      edges.push(createDirectedEdge({ source: sourceCode, target: targetCode }));
    });
  });

  const connectedNodes = new Set<string>();
  if (hideUnconnectedNodes) {
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
  }

  const nodes = Array.from(nodeMap.values()).map((node) => {
    if (!hideUnconnectedNodes || connectedNodes.has(node.id)) {
      return node;
    }

    return {
      ...node,
      hidden: true,
    };
  });

  return { nodes, edges };
}
