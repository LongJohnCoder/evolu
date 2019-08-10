import React, {
  CSSProperties,
  useRef,
  useEffect,
  RefObject,
  useCallback,
  useMemo,
} from 'react';
import invariant from 'tiny-invariant';
import Debug from 'debug';
import produce, { Immutable } from 'immer';
import {
  SladPath,
  SladEditorSetNodePath,
  SladEditorSetNodePathContext,
} from './SladEditorSetNodePathContext';
import { SladEditorElement } from './SladEditorElement';
import {
  SladEditorRenderElementContext,
  SladElement,
  RenderElement,
} from './SladEditorRenderElementContext';

export type SladSelection = Readonly<{
  anchor: SladPath;
  focus: SladPath;
}>;

export interface SladDivElement extends SladElement {
  props: React.HTMLAttributes<HTMLDivElement>;
  children?: (SladDivElement | string)[] | null;
}

/**
 * SladValue is immutable value describing editor state.
 */
export interface SladValue<T extends SladElement = SladDivElement> {
  readonly element: Immutable<T>;
  readonly selection?: Immutable<SladSelection | null>;
}

const isGoodEnoughSladDivElement = (
  element: SladElement,
): element is SladDivElement => {
  // https://overreacted.io/how-does-the-development-mode-work/
  if (process.env.NODE_ENV !== 'production') {
    const div = element as SladDivElement;
    return (
      typeof div.props === 'object' &&
      (div.props.style || div.props.className) != null
    );
  }
  return true;
};

const renderDivElement: RenderElement = (element, children, ref) => {
  if (!isGoodEnoughSladDivElement(element)) {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        false,
        'SladEditor: SladDivElement props has to have at least className or style prop. Or pass custom renderElement to SladEditor.',
      );
    }
    return null;
  }
  return (
    <div {...element.props} ref={ref}>
      {children}
    </div>
  );
};

type NodesPathsMap = Map<Node, SladPath>;

const useNodesPathsMap = (): NodesPathsMap => {
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  const nodesPathsMapRef = useRef<NodesPathsMap | null>(null);
  if (nodesPathsMapRef.current == null) nodesPathsMapRef.current = new Map();
  return nodesPathsMapRef.current;
};

const debug = Debug('slad:editor');

const useDevDebug = (
  nodesPathsMap: NodesPathsMap,
  value: SladValue<SladElement>,
) => {
  useEffect(() => {
    // https://overreacted.io/how-does-the-development-mode-work/
    if (process.env.NODE_ENV !== 'production') {
      const nodes: [string, Node][] = [];
      nodesPathsMap.forEach((path, node) => {
        nodes.push([path.join(), node]);
      });
      debug('nodesPathsMap after render', nodes);

      const countNodes = (node: SladElement | string, count = 0) => {
        if (typeof node === 'string') return count + 1;
        let childrenCount = 0;
        if (node.children)
          node.children.forEach(child => {
            childrenCount += countNodes(child, count);
          });
        return count + 1 + childrenCount;
      };
      const nodesLength = countNodes(value.element);
      invariant(
        nodesLength === nodesPathsMap.size,
        'SladEditor: It looks like you forgot to use ref in custom renderElement',
      );
    }
  }, [nodesPathsMap, value.element]);
};

const useDocumentSelectionChange = (
  ref: RefObject<Element>,
  callback: (selection: Selection | null) => void,
) => {
  // useEffect is called on every SladValue change because of the callback.
  // That's ok. It's cheap and right. Do not try to optimize it via useRef,
  // because it would duplicate a state.
  // Note we can not naively use useLayoutEffect because of SSR.
  // https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
  useEffect(() => {
    const doc = ref.current && ref.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      callback(doc.defaultView && doc.defaultView.getSelection());
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
};

export interface SladEditorProps<T extends SladElement> {
  value: SladValue<T>;
  onChange: (value: SladValue<T>) => void;
  disabled?: boolean;
  renderElement?: RenderElement;
  // Some React HTMLAttributes.
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  className?: string;
  role?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
  tabIndex?: number;
}

// No React.memo because we prefer granularity.
export function SladEditor<T extends SladElement>({
  value,
  onChange,
  disabled,
  renderElement = renderDivElement,
  ...rest
}: SladEditorProps<T>) {
  const nodesPathsMap = useNodesPathsMap();

  useDevDebug(nodesPathsMap, value);

  const mapSelectionToSladSelection = useCallback(
    (selection: Selection | null): SladSelection | null => {
      if (selection == null) return null;
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      if (anchorNode == null || focusNode == null) return null;
      const anchorPath = nodesPathsMap.get(anchorNode);
      const focusPath = nodesPathsMap.get(focusNode);
      if (anchorPath == null || focusPath == null) return null;
      return {
        anchor: [...anchorPath, anchorOffset],
        focus: [...focusPath, focusOffset],
      };
    },
    [nodesPathsMap],
  );

  const handleDocumentSelectionChange = useCallback(
    (selection: Selection | null) => {
      const sladSelection = mapSelectionToSladSelection(selection);
      const nextValue = produce(value, draft => {
        if (!sladSelection) {
          draft.selection = null;
          return;
        }
        // For some reason, we can't assign reaonly array into mutable draft:
        // "The type 'readonly number[]' is 'readonly' and cannot be assigned to
        // the mutable type 'number[]'"
        // Fortunately, we can use slice which returns mutable array.
        // Not great, not terrible.
        draft.selection = {
          anchor: sladSelection.anchor.slice(),
          focus: sladSelection.focus.slice(),
        };
      });
      onChange(nextValue);
    },
    [mapSelectionToSladSelection, onChange, value],
  );

  const divRef = useRef<HTMLDivElement>(null);
  useDocumentSelectionChange(divRef, handleDocumentSelectionChange);

  const setNodePath = useCallback<SladEditorSetNodePath>(
    (node, path) => {
      if (path != null) {
        nodesPathsMap.set(node, path);
      } else {
        nodesPathsMap.delete(node);
      }
    },
    [nodesPathsMap],
  );

  // That's how we do nothing when only value.selection has been changed.
  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        suppressContentEditableWarning={!disabled}
        ref={divRef}
        {...rest}
      >
        <SladEditorSetNodePathContext.Provider value={setNodePath}>
          <SladEditorRenderElementContext.Provider value={renderElement}>
            <SladEditorElement element={value.element} path={[]} />
          </SladEditorRenderElementContext.Provider>
        </SladEditorSetNodePathContext.Provider>
      </div>
    );
  }, [disabled, renderElement, rest, setNodePath, value.element]);
}
