import { absurd } from 'fp-ts/lib/function';
import { fromNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { useCallback, useEffect, useRef } from 'react';
import { isText } from '../models/text';
import { warn } from '../warn';
import { DOMNode } from '../types/dom';
import {
  Element,
  Child,
  SetDOMNodePath,
  GetDOMNodeByPath,
  GetPathByDOMNode,
  PathMaybeEmpty,
} from '../types';

const useDebugNodesPaths = (
  domNodesPathsMap: Map<DOMNode, PathMaybeEmpty>,
  element: Element,
) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // const nodes: [string, Node][] = [];
      // nodesPathsMap.forEach((path, node) => {
      //   nodes.push([path.join(), node]);
      // });
      // console.log(nodes);
      const countNodes = (child: Child, count = 0) => {
        if (isText(child)) return count + 1;
        let childrenCount = 0;
        if (child.children)
          child.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const domNodesLength = countNodes(element);
      // console.log(nodesLength, nodesPathsMap.size);
      if (domNodesLength !== domNodesPathsMap.size)
        warn(
          'It looks like the ref arg in the custom renderElement is not used.',
        );
    }, [domNodesPathsMap, element]);
  }
};

/**
 * Mapping between DOM nodes and paths. Some contentEditable editors are
 * using IDs with DOM traversal. We leverage React refs instead.
 */
export const useDOMNodesPathsMap = (
  element: Element,
): {
  setDOMNodePath: SetDOMNodePath;
  getDOMNodeByPath: GetDOMNodeByPath;
  getPathByDOMNode: GetPathByDOMNode;
} => {
  const nodesPathsMapRef = useRef<Map<DOMNode, PathMaybeEmpty>>(new Map());
  const pathsNodesMapRef = useRef<Map<string, DOMNode>>(new Map());

  useDebugNodesPaths(nodesPathsMapRef.current, element);

  const getDOMNodeByPath = useCallback<GetDOMNodeByPath>(path => {
    return pipe(
      pathsNodesMapRef.current.get(path.join()),
      fromNullable,
    );
  }, []);

  const getPathByDOMNode = useCallback<GetPathByDOMNode>(node => {
    return pipe(
      nodesPathsMapRef.current.get(node),
      fromNullable,
    );
  }, []);

  const setDOMNodePath = useCallback<SetDOMNodePath>(
    (operation, node, path) => {
      switch (operation) {
        case 'add':
          nodesPathsMapRef.current.set(node, path);
          pathsNodesMapRef.current.set(path.join(), node);
          break;
        case 'remove':
          nodesPathsMapRef.current.delete(node);
          pathsNodesMapRef.current.delete(path.join());
          break;
        default:
          absurd(operation);
      }
    },
    [pathsNodesMapRef, nodesPathsMapRef],
  );
  return {
    setDOMNodePath,
    getDOMNodeByPath,
    getPathByDOMNode,
  };
};
