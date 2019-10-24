import { ReactNode, ReactDOM, Reducer as ReactReducer } from 'react';
import { Newtype } from 'newtype-ts';
import { Option } from 'fp-ts/lib/Option';
import { $Values } from 'utility-types';
import { DOMNode } from './dom';

/**
 * Editor unique string ID generated by nanoid.
 */
export interface NodeID
  extends Newtype<{ readonly NodeID: unique symbol }, string> {}

/**
 * Editor node.
 */
export interface Node {
  readonly id: NodeID;
}

/**
 * Editor text.
 */
export interface Text extends Node {
  readonly text: string;
}

/**
 * Editor element. The base for all other editor elements.
 */
export interface Element extends Node {
  readonly children: (ElementChild)[];
}

/**
 * Editor element child. Only editor element or text.
 */
export type ElementChild = Element | Text;

/**
 * Editor path to editor element or text or text with offset.
 */
export type Path = number[];

/**
 * Editor selection. It's like DOM Selection, but with Path for the anchor and the focus.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export interface Selection {
  readonly anchor: Path;
  readonly focus: Path;
}

/**
 * Editor value.
 */
export interface Value {
  readonly element: Element;
  readonly hasFocus: boolean;
  readonly selection: Option<Selection>;
}

/**
 * Editor action.
 */
export type Action =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: Selection }
  | { type: 'insertText'; text: string; selection: Selection }
  | { type: 'deleteText'; text: string; selection: Selection }
  | { type: 'insertReplacementText'; text: string };

/**
 * Editor reducer.
 */
export type Reducer = ReactReducer<Value, Action>;

/**
 * Editor range. It's like DOM Range, but with editor path for the start and the end.
 * Range should be an implementation detail when an operation needs the direction.
 * https://developer.mozilla.org/en-US/docs/Web/API/Range
 */
export interface Range {
  readonly start: Path;
  readonly end: Path;
}

export type DOMNodeOffset = [DOMNode, number];

export type GetDOMNodeByPath = (path: Path) => Option<DOMNode>;

export type GetPathByDOMNode = (domNode: DOMNode) => Option<Path>;

export type SetDOMNodePathRef = (node: DOMNode | null) => void;

export type SetDOMNodePath = (
  operation: 'add' | 'remove',
  node: DOMNode,
  path: Path,
) => void;

export type RenderElement = (
  element: Element,
  children: ReactNode,
  ref: SetDOMNodePathRef,
) => ReactNode;

/**
 * Editor text with offset.
 */
export type TextWithOffset = {
  readonly text: Text;
  readonly offset: number;
};

export interface MaterializedPath {
  to: Element | Text | TextWithOffset;
  parents: Element[];
}

export type AfterTyping = (callback: () => void) => void;

interface ReactElementFactory<T, P> extends Element {
  readonly tag: T;
  readonly props?: P;
  readonly children: (ReactElement | Text)[];
}

/**
 * Editor React-like element. It has tag and props.
 */
export type ReactElement = $Values<
  {
    [T in keyof ReactDOM]: ReactElementFactory<
      T,
      ReturnType<ReactDOM[T]>['props']
    >;
  }
>;

type ReactDivAtttributesUsefulForEditorClient = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | 'accessKey'
  | 'autoCorrect'
  | 'className'
  | 'id'
  | 'role'
  | 'spellCheck'
  | 'style'
  | 'tabIndex'
>;

export interface EditorClientProps
  extends ReactDivAtttributesUsefulForEditorClient {
  value: Value;
  onChange: (value: Value) => void;
  renderElement?: RenderElement;
  reducer?: Reducer;
}
