import { StructureTypeDefinitions, type BookNode, type StructuralTypeName } from "./App";

/**
 * Find the node in the given tree structure with the given key. This is a recursive function.
 */
export function findNodeByKey(nodes: BookNode[], key: string): BookNode | null {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Search for the parent of the given searchNode, starting at the given starting point. This is a recursive function.
 *
 * @param searchNode the node to find in the tree and then return it's parent (container) node
 * @param startingPoint the container to search or the nodes at the root of the tree
 * @returns the container node that contains the searchNode, or null if the root of the tree is the parent (or if the searchNode is not found).
 */
export function searchParent(searchNode: BookNode, startingPoint: BookNode | BookNode[]): BookNode | null {
  const isRoot = Array.isArray(startingPoint);
  const children = (isRoot ? startingPoint : (startingPoint as BookNode).children) ?? [];
  for (const child of children) {
    if (child.key === searchNode.key) {
      return isRoot ? null : startingPoint;
    }
    if (child.children) {
      // The child is a container itself -- do a depth first search (pre-order)
      const parent = searchParent(searchNode, child);
      if (parent !== null) {
        return parent;
      }
    }
  }
  return null;
}

/**
 * Check the business rules: can the given container contain the given nodeType
 */
export function canContainerContainType(parentContainer: BookNode | null, nodeType: StructuralTypeName): boolean {
  if (parentContainer === null) {
    //These types may exist in  the root of the tree
    return ["CONTAINER", "FRONT_BACK_MATTER"].includes(nodeType);
  } else {
    const parentContainerType = parentContainer.typeName;
    return StructureTypeDefinitions.get(parentContainerType)?.containableTypes?.includes(nodeType) ?? false;
  }
}
