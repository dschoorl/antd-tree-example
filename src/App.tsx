import React, { useRef } from "react";

import { Tree, type TreeDataNode } from "antd";
import "./index.css";
import { useImmer } from "use-immer";
import { canContainerContainType, findNodeByKey, searchParent } from "./TreeUtils";

/// Define the business rules: what type of node can contain which other types of nodes
// eslint-disable-next-line react-refresh/only-export-components
export const StructureTypeDefinitions = new Map<StructuralTypeName, StructureType>([
  [
    "CONTAINER",
    {
      id: "CONTAINER",
      isContainer: true,
      containableTypes: ["CONTAINER", "SCENE"]
    }
  ],
  ["SCENE", { id: "SCENE", isContainer: false }],
  ["FRONT_BACK_MATTER", { id: "FRONT_BACK_MATTER", isContainer: false }]
]);
export type StructuralTypeName = "CONTAINER" | "SCENE" | "FRONT_BACK_MATTER";
type StructureType = {
  id: StructuralTypeName;
  isContainer: boolean;
  containableTypes?: StructuralTypeName[];
};
export type BookNode = TreeDataNode & {
  typeName: StructuralTypeName;
  title: string;
  key: string;
  children?: BookNode[];
};

const defaultData: BookNode[] = [
  { key: "FM1", typeName: "FRONT_BACK_MATTER", title: "Copyright page" },
  { key: "FM2", typeName: "FRONT_BACK_MATTER", title: "Dedicated to" },
  {
    key: "C01",
    typeName: "CONTAINER",
    title: "Act 1",
    children: [
      { key: "C01-01", typeName: "SCENE", title: "Opening image" },
      { key: "C01-02", typeName: "SCENE", title: "Theme Stated" },
      { key: "C01-03", typeName: "SCENE", title: "Set up" },
      { key: "C01-04", typeName: "SCENE", title: "Debate" },
      { key: "C01-05", typeName: "SCENE", title: "Break into Act 2" }
    ]
  },
  {
    key: "C02",
    typeName: "CONTAINER",
    title: "Act 2",
    children: [
      { key: "C02-01", typeName: "SCENE", title: "B Story" },
      { key: "C02-02", typeName: "SCENE", title: "Fun and Games" },
      { key: "C02-03", typeName: "SCENE", title: "Midpoint" },
      { key: "C02-04", typeName: "SCENE", title: "Bad Guys Close In" },
      { key: "C02-05", typeName: "SCENE", title: "All is Lost" },
      { key: "C02-06", typeName: "SCENE", title: "Dark Night of the Soul" }
    ]
  },
  {
    key: "C03",
    typeName: "CONTAINER",
    title: "Act 3",
    children: [
      { key: "C03-01", typeName: "SCENE", title: "Break Into Act Three" },
      { key: "C03-02", typeName: "SCENE", title: "Finale" },
      { key: "C03-03", typeName: "SCENE", title: "Final Image" }
    ]
  },
  {
    key: "C04",
    typeName: "CONTAINER",
    title: "Act 4",
    children: []
  },
  {
    key: "C05",
    typeName: "CONTAINER",
    title: "Act 5",
    children: []
  },
  { key: "BM1", typeName: "FRONT_BACK_MATTER", title: "Acknowledgments" },
  { key: "BM2", typeName: "FRONT_BACK_MATTER", title: "More from this author" }
];

const App: React.FC = () => {
  const [bookStructure, updateBookStructure] = useImmer(defaultData);
  const draggedNode = useRef<BookNode | undefined>(undefined);

  function onDragStart({ node }: { node: BookNode }) {
    draggedNode.current = node;
  }

  function onDragEnd() {
    draggedNode.current = undefined;
  }

  function allowDrop({ dropNode, dropPosition }: { dropNode: BookNode; dropPosition: -1 | 0 | 1 }): boolean {
    if (!draggedNode.current) {
      return false;
    }

    const draggedNodeType: StructuralTypeName = draggedNode.current.typeName;
    const dropTargetType: StructuralTypeName = dropNode.typeName;

    let result = false;

    // When the parent is null, it means: the dropNode is on the root level of the data structure
    if (dropPosition !== 0) {
      // drop before (-1) or after (+1) the dropnode, makes it a sibling of the dropNode, so check if the parent of the dropNode can contain the draggedNodeType

      //valid, if same type (at least siblings, maybe child (eg. with regards to SECTION))
      // if (draggedNodeType === dropNodeType) {
      //   result = true;
      // }

      const parentContainer: BookNode | null = searchParent(dropNode, bookStructure);
      result = canContainerContainType(parentContainer, draggedNodeType);
    } else {
      //dropPosition === 0 (inside the dropNode): valid, if dropType can contain draggedType
      result =
        (StructureTypeDefinitions.has(dropTargetType) &&
          StructureTypeDefinitions.get(dropTargetType)?.isContainer &&
          StructureTypeDefinitions.get(dropTargetType)?.containableTypes?.includes(draggedNodeType)) ??
        false;
    }

    console.log(
      `AllowDrop: Can drag node ${draggedNode.current.key} with type ${draggedNodeType} be dropped ${["before", "on", "after"][dropPosition + 1]} drop node ${dropNode.key} of type ${dropTargetType}: ${result}`
    );
    return result;
  }

  function onDrop({
    node: dropNode,
    dragNode,
    dropPosition: dropIndex,
    dropToGap
  }: {
    node: BookNode;
    dragNode: BookNode;
    dropPosition: number;
    dropToGap: boolean;
  }) {
    updateBookStructure(draft => {
      let insertChildIndex = -1;
      let targetContainer: BookNode | null = null;
      const sourceContainer = searchParent(dragNode, draft);

      if (dropToGap) {
        if (dropIndex === -1) {
          //special case: drop as first child of the tree root node
          insertChildIndex = 0;
          targetContainer = null; // this means: root
        } else {
          targetContainer = searchParent(dropNode, draft);
          insertChildIndex = dropIndex;

          // must we make correction for the case where the node is moved down in the same container?
          const moveWithinContainer = targetContainer?.key === sourceContainer?.key;
          const moveWithinRoot = targetContainer === null && sourceContainer === null;
          if (moveWithinContainer || moveWithinRoot) {
            const children: BookNode[] = moveWithinRoot ? draft : (targetContainer?.children ?? []);
            for (const [index, child] of children.entries()) {
              if (child.key === dragNode.key && index < insertChildIndex) {
                insertChildIndex--;
                break;
              }
            }
          }
        }
      } else {
        targetContainer = findNodeByKey(draft, dropNode.key);
        insertChildIndex = 0;
      }

      if (!canContainerContainType(targetContainer, dragNode.typeName)) {
        const dropLocation = targetContainer
          ? `targetContainer ${targetContainer.key} of type ${targetContainer.typeName}`
          : "the root of the tree";
        throw new Error(
          `Can not move node ${dragNode.key} of type ${dragNode.typeName} to index ${insertChildIndex} of ${dropLocation}`
        );
      }

      //remove dragged node
      const sourceChildren = (sourceContainer ? sourceContainer.children : draft) ?? [];
      for (let i = 0; i < sourceChildren?.length; i++) {
        const child = sourceChildren[i];
        if (child.key === dragNode.key) {
          sourceChildren.splice(i, 1);
          break;
        }
      }

      //insert at the right index in the target container
      const targetChildren = targetContainer ? targetContainer.children! : draft;
      targetChildren.splice(insertChildIndex, 0, dragNode);
    });
  }

  return (
    <Tree
      className="draggable-tree"
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      allowDrop={allowDrop}
      onDrop={onDrop}
      titleRender={node => (
        <span className={node.typeName} title={node.typeName}>
          {node.title}
        </span>
      )}
      treeData={bookStructure}
      defaultExpandAll={true}
    />
  );
};

export default App;
