import type { DawgpathCourseDetail } from "@/convex/dawgpath";
import { type Node, type Edge, MarkerType } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { ConvexCourseOverview } from "@/types/convex-courses";
import { NODE_HEIGHT, NODE_HORIZONTAL_SPACING, NODE_VERTICAL_SPACING, NODE_WIDTH, PrereqGraphNodeUnion, SubjectAreaGroupNodeData } from "./prereq-graph-utils";
/**
 * Layout using dagre: automatic graph layout with left-to-right direction
 * Following guide: pure function, no side effects, testable
 * Uses measured node dimensions when available, falls back to calculated dimensions
 * When a selectedCourseCode is provided, prioritizes layout with vertical lists on left and right
 * Ensures no overlap while maintaining left-to-right edge flow
 */
export function applyDagreLayout(
  nodes: PrereqGraphNodeUnion[],
  edges: Edge[],
  currentCourseCode: string,
  selectedCourseCode?: string
): PrereqGraphNodeUnion[] {
  // Helper function to get node dimensions
  const getNodeDimensions = (
    node: PrereqGraphNodeUnion
  ): { width: number; height: number } => {
    if (node.measured?.width && node.measured?.height) {
      return {
        width: node.measured.width,
        height: node.measured.height,
      };
    }

    let height = NODE_HEIGHT;
    let width = NODE_WIDTH;

    if (node.type === "subjectAreaGroupNode") {
      const groupData = node.data as SubjectAreaGroupNodeData;
      if (groupData.isExpanded) {
        height = Math.max(NODE_HEIGHT, 60 + groupData.courses.length * 20);
      } else {
        height = NODE_HEIGHT;
      }
    }

    return { width, height };
  };

  // Helper to check if two nodes overlap
  const checkOverlap = (
    node1: { x: number; y: number; width: number; height: number },
    node2: { x: number; y: number; width: number; height: number },
    padding: number = 30
  ): boolean => {
    return !(
      node1.x + node1.width + padding < node2.x ||
      node2.x + node2.width + padding < node1.x ||
      node1.y + node1.height + padding < node2.y ||
      node2.y + node2.height + padding < node1.y
    );
  };

  // Helper to get node rank (horizontal layer) from dagre
  const getNodeRank = (
    nodeId: string,
    graph: dagre.graphlib.Graph
  ): number => {
    const node = graph.node(nodeId);
    return node?.rank ?? 0;
  };

  // Calculate bounds for a group of nodes
  const getGroupBounds = (
    nodeIds: string[],
    positionedNodes: PrereqGraphNodeUnion[]
  ): { minX: number; maxX: number; minY: number; maxY: number } | null => {
    const relevantNodes = positionedNodes.filter(
      (n) => nodeIds.includes(n.id) && !n.hidden && n.position
    );

    if (relevantNodes.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    relevantNodes.forEach((node) => {
      const dims = getNodeDimensions(node);
      const x = node.position!.x;
      const y = node.position!.y;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + dims.width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + dims.height);
    });

    return { minX, maxX, minY, maxY };
  };

  // Resolve overlaps while respecting graph structure
  const resolveOverlapsRespectingStructure = (
    positionedNodes: PrereqGraphNodeUnion[],
    fixedNodeIds: Set<string>,
    associatedNodeIds: Set<string>,
    graph: dagre.graphlib.Graph
  ): PrereqGraphNodeUnion[] => {
    const maxIterations = 100;
    let iteration = 0;

    let result = [...positionedNodes];

    // Get rank information for all nodes
    const nodeRanks = new Map<string, number>();
    result.forEach((node) => {
      if (!node.hidden) {
        nodeRanks.set(node.id, getNodeRank(node.id, graph));
      }
    });

    // First pass: move unassociated nodes away from associated group
    // but only vertically to preserve rank structure
    const associatedBounds = getGroupBounds(
      Array.from(associatedNodeIds),
      result
    );

    if (associatedBounds) {
      const verticalBuffer = 80;

      result = result.map((node) => {
        if (
          node.hidden ||
          !node.position ||
          associatedNodeIds.has(node.id)
        ) {
          return node;
        }

        const dims = getNodeDimensions(node);
        const nodeBox = {
          x: node.position.x,
          y: node.position.y,
          width: dims.width,
          height: dims.height,
        };

        // Check vertical overlap with associated group
        const verticalOverlap = !(
          nodeBox.y + nodeBox.height + verticalBuffer < associatedBounds.minY ||
          nodeBox.y > associatedBounds.maxY + verticalBuffer
        );

        // Check horizontal overlap with associated group
        const horizontalOverlap = !(
          nodeBox.x + nodeBox.width + verticalBuffer < associatedBounds.minX ||
          nodeBox.x > associatedBounds.maxX + verticalBuffer
        );

        if (verticalOverlap && horizontalOverlap) {
          // Prefer vertical movement to preserve horizontal rank structure
          const centerY = nodeBox.y + nodeBox.height / 2;
          const groupCenterY =
            (associatedBounds.minY + associatedBounds.maxY) / 2;

          let newY = node.position.y;

          if (centerY < groupCenterY) {
            // Move up
            newY = associatedBounds.minY - dims.height - verticalBuffer;
          } else {
            // Move down
            newY = associatedBounds.maxY + verticalBuffer;
          }

          return {
            ...node,
            position: { x: node.position.x, y: newY },
          };
        }

        return node;
      });
    }

    // Second pass: resolve individual overlaps, prioritizing vertical movement
    while (iteration < maxIterations) {
      let hasOverlap = false;
      iteration++;

      for (let i = 0; i < result.length; i++) {
        const node1 = result[i];
        if (node1.hidden || !node1.position) continue;

        const dims1 = getNodeDimensions(node1);
        const box1 = {
          x: node1.position.x,
          y: node1.position.y,
          width: dims1.width,
          height: dims1.height,
        };

        for (let j = i + 1; j < result.length; j++) {
          const node2 = result[j];
          if (node2.hidden || !node2.position) continue;

          const dims2 = getNodeDimensions(node2);
          const box2 = {
            x: node2.position.x,
            y: node2.position.y,
            width: dims2.width,
            height: dims2.height,
          };

          if (checkOverlap(box1, box2)) {
            hasOverlap = true;

            const node1Fixed = fixedNodeIds.has(node1.id);
            const node2Fixed = fixedNodeIds.has(node2.id);
            const node1Rank = nodeRanks.get(node1.id) ?? 0;
            const node2Rank = nodeRanks.get(node2.id) ?? 0;

            // Calculate overlap amounts
            const overlapX = Math.min(
              box1.x + box1.width - box2.x,
              box2.x + box2.width - box1.x
            );
            const overlapY = Math.min(
              box1.y + box1.height - box2.y,
              box2.y + box2.height - box1.y
            );

            const centerY1 = box1.y + box1.height / 2;
            const centerY2 = box2.y + box2.height / 2;

            if (node1Fixed && node2Fixed) {
              // Both fixed - only move vertically
              const shiftAmount = overlapY + 40;

              result = result.map((n) => {
                if (n.id === node2.id) {
                  const moveDown = centerY2 > centerY1;
                  return {
                    ...n,
                    position: {
                      x: n.position!.x,
                      y: n.position!.y + (moveDown ? shiftAmount : -shiftAmount),
                    },
                  };
                }
                return n;
              });
            } else if (node1Fixed) {
              // Only move node2 vertically to preserve structure
              const shiftAmount = overlapY + 40;

              result = result.map((n) => {
                if (n.id === node2.id) {
                  const moveDown = centerY2 > centerY1;
                  return {
                    ...n,
                    position: {
                      x: n.position!.x,
                      y: n.position!.y + (moveDown ? shiftAmount : -shiftAmount),
                    },
                  };
                }
                return n;
              });
            } else if (node2Fixed) {
              // Only move node1 vertically to preserve structure
              const shiftAmount = overlapY + 40;

              result = result.map((n) => {
                if (n.id === node1.id) {
                  const moveDown = centerY1 > centerY2;
                  return {
                    ...n,
                    position: {
                      x: n.position!.x,
                      y: n.position!.y + (moveDown ? shiftAmount : -shiftAmount),
                    },
                  };
                }
                return n;
              });
            } else {
              // Neither fixed - check if they're in same rank
              if (node1Rank === node2Rank) {
                // Same rank - move vertically to keep them in same column
                const pushAmount = overlapY / 2 + 30;

                result = result.map((n) => {
                  if (n.id === node1.id) {
                    const moveUp = centerY1 < centerY2;
                    return {
                      ...n,
                      position: {
                        x: n.position!.x,
                        y: n.position!.y + (moveUp ? -pushAmount : pushAmount),
                      },
                    };
                  }
                  if (n.id === node2.id) {
                    const moveDown = centerY2 > centerY1;
                    return {
                      ...n,
                      position: {
                        x: n.position!.x,
                        y: n.position!.y + (moveDown ? pushAmount : -pushAmount),
                      },
                    };
                  }
                  return n;
                });
              } else {
                // Different ranks - ensure correct horizontal ordering
                const lowerRankNode = node1Rank < node2Rank ? node1 : node2;
                const higherRankNode = node1Rank < node2Rank ? node2 : node1;
                const lowerBox = node1Rank < node2Rank ? box1 : box2;
                const higherBox = node1Rank < node2Rank ? box2 : box1;

                // Lower rank should be to the left
                if (lowerBox.x >= higherBox.x) {
                  // Wrong order - need to adjust
                  const horizontalGap = 50;
                  result = result.map((n) => {
                    if (n.id === higherRankNode.id) {
                      return {
                        ...n,
                        position: {
                          x: lowerBox.x + lowerBox.width + horizontalGap,
                          y: n.position!.y,
                        },
                      };
                    }
                    return n;
                  });
                } else {
                  // Correct order - just move vertically
                  const pushAmount = overlapY / 2 + 30;
                  result = result.map((n) => {
                    if (n.id === node1.id) {
                      const moveUp = centerY1 < centerY2;
                      return {
                        ...n,
                        position: {
                          x: n.position!.x,
                          y: n.position!.y + (moveUp ? -pushAmount : pushAmount),
                        },
                      };
                    }
                    if (n.id === node2.id) {
                      const moveDown = centerY2 > centerY1;
                      return {
                        ...n,
                        position: {
                          x: n.position!.x,
                          y: n.position!.y + (moveDown ? pushAmount : -pushAmount),
                        },
                      };
                    }
                    return n;
                  });
                }
              }
            }

            break;
          }
        }
        if (hasOverlap) break;
      }

      if (!hasOverlap) break;
    }

    return result;
  };

  // If a course is selected, use prioritized layout
  if (selectedCourseCode) {
    const selectedNode = nodes.find(
      (n) =>
        n.id === selectedCourseCode && n.type === "courseNode" && !n.hidden
    );

    if (selectedNode) {
      // Find neighbors
      const leftNeighbors = new Set<string>();
      const rightNeighbors = new Set<string>();

      edges.forEach((edge) => {
        if (
          edge.target === selectedCourseCode &&
          !edge.source.includes("group-")
        ) {
          leftNeighbors.add(edge.source);
        } else if (
          edge.source === selectedCourseCode &&
          !edge.target.includes("group-")
        ) {
          rightNeighbors.add(edge.target);
        }
      });

      const leftGroupNodes = new Set<string>();
      const rightGroupNodes = new Set<string>();
      edges.forEach((edge) => {
        if (
          edge.target === selectedCourseCode &&
          edge.source.includes("group-")
        ) {
          leftGroupNodes.add(edge.source);
        } else if (
          edge.source === selectedCourseCode &&
          edge.target.includes("group-")
        ) {
          rightGroupNodes.add(edge.target);
        }
      });

      // Create dagre graph for initial layout
      const graph = new dagre.graphlib.Graph();
      graph.setDefaultEdgeLabel(() => ({}));
      graph.setGraph({
        rankdir: "LR",
        nodesep: NODE_VERTICAL_SPACING,
        ranksep: NODE_HORIZONTAL_SPACING,
        marginx: 50,
        marginy: 50,
      });

      const visibleNodes = nodes.filter((node) => !node.hidden);
      visibleNodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node);
        graph.setNode(node.id, { width, height });
      });

      edges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
      });

      dagre.layout(graph);

      const leftNeighborArray = Array.from(leftNeighbors);
      const rightNeighborArray = Array.from(rightNeighbors);

      // Get selected node position from dagre
      const selectedDagreNode = graph.node(selectedCourseCode);
      const selectedDims = getNodeDimensions(selectedNode);
      const selectedCenterX = selectedDagreNode.x;
      const selectedCenterY = selectedDagreNode.y;

      // Build lists with actual nodes
      const leftList = [
        ...leftNeighborArray.map((id) => nodes.find((n) => n.id === id)),
        ...Array.from(leftGroupNodes).map((id) =>
          nodes.find((n) => n.id === id)
        ),
      ].filter((n): n is PrereqGraphNodeUnion => n !== undefined && !n.hidden);

      const rightList = [
        ...rightNeighborArray.map((id) => nodes.find((n) => n.id === id)),
        ...Array.from(rightGroupNodes).map((id) =>
          nodes.find((n) => n.id === id)
        ),
      ].filter((n): n is PrereqGraphNodeUnion => n !== undefined && !n.hidden);

      // Sort for stable order
      leftList.sort((a, b) => a.id.localeCompare(b.id));
      rightList.sort((a, b) => a.id.localeCompare(b.id));

      // Calculate total heights
      const leftTotalHeight = leftList.reduce((sum, n, idx) => {
        return (
          sum +
          getNodeDimensions(n).height +
          (idx < leftList.length - 1 ? NODE_VERTICAL_SPACING : 0)
        );
      }, 0);

      const rightTotalHeight = rightList.reduce((sum, n, idx) => {
        return (
          sum +
          getNodeDimensions(n).height +
          (idx < rightList.length - 1 ? NODE_VERTICAL_SPACING : 0)
        );
      }, 0);

      // Track which nodes are associated with selected course
      const associatedNodeIds = new Set<string>([
        selectedCourseCode,
        ...leftList.map((n) => n.id),
        ...rightList.map((n) => n.id),
      ]);

      // Track which nodes have fixed positions
      const fixedNodeIds = new Set<string>(associatedNodeIds);

      // Position all nodes
      const positionedNodes = nodes.map((node) => {
        if (node.hidden) {
          return node;
        }

        const dims = getNodeDimensions(node);
        const dagreNode = graph.node(node.id);

        // Position selected node
        if (node.id === selectedCourseCode) {
          return {
            ...node,
            position: {
              x: selectedCenterX - dims.width / 2,
              y: selectedCenterY - dims.height / 2,
            },
          };
        }

        // Position left neighbors - vertically aligned, centered on selected
        const leftIndex = leftList.findIndex((n) => n.id === node.id);
        if (leftIndex !== -1) {
          let currentY = selectedCenterY - leftTotalHeight / 2;

          // Add heights of previous nodes
          for (let i = 0; i < leftIndex; i++) {
            currentY +=
              getNodeDimensions(leftList[i]).height + NODE_VERTICAL_SPACING;
          }

          const x =
            selectedCenterX -
            selectedDims.width / 2 -
            NODE_HORIZONTAL_SPACING -
            dims.width;

          return {
            ...node,
            position: {
              x,
              y: currentY,
            },
          };
        }

        // Position right neighbors - vertically aligned, centered on selected
        const rightIndex = rightList.findIndex((n) => n.id === node.id);
        if (rightIndex !== -1) {
          let currentY = selectedCenterY - rightTotalHeight / 2;

          // Add heights of previous nodes
          for (let i = 0; i < rightIndex; i++) {
            currentY +=
              getNodeDimensions(rightList[i]).height + NODE_VERTICAL_SPACING;
          }

          const x =
            selectedCenterX + selectedDims.width / 2 + NODE_HORIZONTAL_SPACING;

          return {
            ...node,
            position: {
              x,
              y: currentY,
            },
          };
        }

        // Other nodes use dagre layout
        if (!dagreNode) {
          return node;
        }

        return {
          ...node,
          position: {
            x: dagreNode.x - dims.width / 2,
            y: dagreNode.y - dims.height / 2,
          },
        };
      });

      // Resolve overlaps while respecting graph structure
      return resolveOverlapsRespectingStructure(
        positionedNodes,
        fixedNodeIds,
        associatedNodeIds,
        graph
      );
    }
  }

  // Default layout when no course is selected
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: NODE_VERTICAL_SPACING,
    ranksep: NODE_HORIZONTAL_SPACING,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    if (node.hidden) return;
    const { width, height } = getNodeDimensions(node);
    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const positionedNodes = nodes.map((node) => {
    if (node.hidden) return node;

    const dagreNode = graph.node(node.id);
    if (!dagreNode) return node;

    const { width, height } = getNodeDimensions(node);

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });

  return positionedNodes;
}
