import { IO } from 'fp-ts/lib/IO';
import { IORef } from 'fp-ts/lib/IORef';
import { Option } from 'fp-ts/lib/Option';
import { Task } from 'fp-ts/lib/Task';
import { ReactDOM, ReactNode, RefObject } from 'react';
import * as t from 'io-ts';
import { DOMElement, DOMNode, DOMRange, DOMSelection, DOMText } from './dom';

// https://dev.to/gcanti/functional-design-smart-constructors-14nb
// https://github.com/gcanti/io-ts

/**
 * Editor text is a string. Like in React.
 */
export type Text = string;

interface ElementIDBrand {
  readonly ElementID: unique symbol;
}

export const tElementID = t.brand(
  t.string,
  (n): n is t.Branded<string, ElementIDBrand> => n.length >= 10,
  'ElementID',
);

/**
 * Element unique ID generated by nanoid(10).
 * ID is required for meta-data, React keys, and CRDT.
 */
export type ElementID = t.TypeOf<typeof tElementID>;

/**
 * Editor element. The base for all other editor elements.
 */
export interface Element {
  readonly id: ElementID;
  readonly children: Node[];
}

/**
 * Element or Text.
 */
export type Node = Element | Text;

interface PathIndexBrand {
  readonly PathIndex: unique symbol;
}

export const tPathIndex = t.brand(
  t.number,
  (n): n is t.Branded<number, PathIndexBrand> => Number.isInteger(n) && n >= 0,
  'PathIndex',
);

/**
 * PathIndex is non negative integer.
 */
export type PathIndex = t.TypeOf<typeof tPathIndex>;

interface PathDeltaBrand {
  readonly PathDelta: unique symbol;
}

export const tPathDelta = t.brand(
  t.number,
  (n): n is t.Branded<number, PathDeltaBrand> => Number.isInteger(n),
  'PathDelta',
);

/**
 * PathDelta is an integer.
 */
export type PathDelta = t.TypeOf<typeof tPathDelta>;

/**
 * Path to a place in Element. It can point to Element, Text, Text char, or nothing.
 */
export type Path = PathIndex[];

/**
 * Non empty Path.
 */
export interface NonEmptyPath extends Path {
  0: PathIndex;
}

/**
 * Non empty Path with offset.
 */
export interface NonEmptyPathWithOffset extends Path {
  0: PathIndex;
  1: PathIndex;
}

/**
 * Editor selection. It's like DOM Selection, but with Path for the anchor and the focus.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export interface Selection {
  readonly anchor: NonEmptyPath;
  readonly focus: NonEmptyPath;
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
 * Editor range. It's like DOM Range, but with editor path for the start and the end.
 * Range should be an implementation detail when an operation needs the direction.
 * https://developer.mozilla.org/en-US/docs/Web/API/Range
 */
export interface Range {
  readonly start: NonEmptyPath;
  readonly end: NonEmptyPath;
}

export type DOMNodeOffset = [DOMNode, PathIndex];
export type DOMTextOffset = [DOMText, PathIndex];

export interface GetDOMNodeByPath {
  (path: Path): IO<Option<DOMNode>>;
}

export interface GetPathByDOMNode {
  (node: DOMNode): IO<Option<Path>>;
}

export interface SetDOMNodePathRef {
  (node: DOMNode | null): void;
}

export interface SetDOMNodePath {
  (operation: 'add' | 'remove', node: DOMNode, path: Path): void;
}

export interface RenderElement {
  (element: Element, children: ReactNode, ref: SetDOMNodePathRef): ReactNode;
}

interface ReactElementFactory<T, P> extends Element {
  readonly tag: T;
  readonly props?: P;
  readonly children: (ReactElement | Text)[];
}

// Refactor, it should not be required.
type $Values<T extends object> = T[keyof T];

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

export type EditorElementAttrs = Pick<
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

export type EditorProps = EditorElementAttrs & {
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly renderElement?: RenderElement;
};

export type InputEventIORef = IORef<(event: InputEvent) => IO<void>>;

/**
 * Editor side effects. There are two abstractions meant for side effects:
 * IO (synchronous) and Task (asynchronous). Both of them have the -Either
 * "version" for computations that may fail.
 */
export interface EditorIO {
  readonly afterTyping: Task<void>;
  readonly createDOMRange: IO<Option<DOMRange>>;
  readonly createInfo: (selection: Selection) => Info; // TODO: IO
  readonly DOMRangeToSelection: (range: DOMRange) => IO<Option<Selection>>;
  readonly ensureDOMSelectionIsActual: IO<void>;
  readonly focus: IO<void>;
  readonly getComputedStyle: (el: DOMElement) => IO<Option<CSSStyleDeclaration>>; // prettier-ignore
  readonly getDocument: IO<Option<Document>>;
  readonly getDOMNodeByPath: GetDOMNodeByPath;
  readonly getDOMSelection: IO<Option<DOMSelection>>;
  readonly getElement: IO<Option<HTMLDivElement>>;
  readonly getPathByDOMNode: GetPathByDOMNode;
  readonly getSelectionFromDOM: IO<Option<Selection>>;
  readonly getValue: IO<Value>;
  readonly getWindow: IO<Option<Window>>;
  readonly isTyping: IO<boolean>;
  readonly modifyValue: (callback: (value: Value) => Value) => IO<void>;
  readonly pathToNodeOffset: (path: NonEmptyPath) => IO<Option<DOMNodeOffset>>;
  readonly setDOMSelection: (selection: Selection) => IO<void>;
  readonly setValue: (value: Value) => IO<void>;
  // DOM Events.
  readonly onBlur: IORef<IO<void>>;
  readonly onFocus: IORef<IO<void>>;
  readonly onSelectionChange: IORef<IO<void>>;
  // https://www.w3.org/TR/input-events-2/
  readonly onInsertText: InputEventIORef;
  readonly onInsertReplacementText: InputEventIORef;
  readonly onInsertLineBreak: InputEventIORef;
  readonly onInsertParagraph: InputEventIORef;
  readonly onInsertOrderedList: InputEventIORef;
  readonly onInsertUnorderedList: InputEventIORef;
  readonly onInsertHorizontalRule: InputEventIORef;
  readonly onInsertFromYank: InputEventIORef;
  readonly onInsertFromDrop: InputEventIORef;
  readonly onInsertFromPaste: InputEventIORef;
  readonly onInsertFromPasteAsQuotation: InputEventIORef;
  readonly onInsertTranspose: InputEventIORef;
  readonly onInsertCompositionText: InputEventIORef;
  readonly onInsertFromComposition: InputEventIORef;
  readonly onInsertLink: InputEventIORef;
  readonly onDeleteByComposition: InputEventIORef;
  readonly onDeleteCompositionText: InputEventIORef;
  readonly onDeleteWordBackward: InputEventIORef;
  readonly onDeleteWordForward: InputEventIORef;
  readonly onDeleteSoftLineBackward: InputEventIORef;
  readonly onDeleteSoftLineForward: InputEventIORef;
  readonly onDeleteEntireSoftLine: InputEventIORef;
  readonly onDeleteHardLineBackward: InputEventIORef;
  readonly onDeleteHardLineForward: InputEventIORef;
  readonly onDeleteByDrag: InputEventIORef;
  readonly onDeleteByCut: InputEventIORef;
  readonly onDeleteContent: InputEventIORef;
  readonly onDeleteContentBackward: InputEventIORef;
  readonly onDeleteContentForward: InputEventIORef;
  readonly onHistoryUndo: InputEventIORef;
  readonly onHistoryRedo: InputEventIORef;
  readonly onFormatBold: InputEventIORef;
  readonly onFormatItalic: InputEventIORef;
  readonly onFormatUnderline: InputEventIORef;
  readonly onFormatStrikeThrough: InputEventIORef;
  readonly onFormatSuperscript: InputEventIORef;
  readonly onFormatSubscript: InputEventIORef;
  readonly onFormatJustifyFull: InputEventIORef;
  readonly onFormatJustifyCenter: InputEventIORef;
  readonly onFormatJustifyRight: InputEventIORef;
  readonly onFormatJustifyLeft: InputEventIORef;
  readonly onFormatIndent: InputEventIORef;
  readonly onFormatOutdent: InputEventIORef;
  readonly onFormatRemove: InputEventIORef;
  readonly onFormatSetBlockTextDirection: InputEventIORef;
  readonly onFormatSetInlineTextDirection: InputEventIORef;
  readonly onFormatBackColor: InputEventIORef;
  readonly onFormatFontColor: InputEventIORef;
  readonly onFormatFontName: InputEventIORef;
}

export type EditorRef = RefObject<EditorIO>;

// TODO: Fragment, probably Child[].

export interface NodeInfo {
  readonly node: Node;
  readonly path: NonEmptyPath;
  // readonly text: string;
  // readonly parents: NonEmptyArray<Element>;
  // readonly parentBlocks: NonEmptyArray<Element>;
  // readonly previousSibling: Option<Child>;
  // readonly nextSibling: Option<Child>;
  // readonly textOffset: Option<number>;
  // readonly allChildrenCount: number;
}

/**
 * Info is materialized selection. It provides useful computations for
 * toolbars and operations.
 */
export interface Info {
  // selection: Selection;
  // range: Range;
  nodes: NodeInfo[];
  // text: Node;
  // range position
}
