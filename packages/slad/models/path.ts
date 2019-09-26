import invariant from 'tiny-invariant';

export type EditorPath = readonly number[];

export type NodesEditorPathsMap = Map<Node, EditorPath>;

/**
 * Key is editorPath.join().
 */
export type EditorPathsNodesMap = Map<string, Node>;

export function editorPathsAreEqual(
  path1: EditorPath,
  path2: EditorPath,
): boolean {
  if (path1 === path2) return true;
  const { length } = path1;
  if (length !== path2.length) return false;
  for (let i = 0; i < length; i++) if (path1[i] !== path2[i]) return false;
  return true;
}

export function invariantPathIsNotEmpty(path: EditorPath) {
  invariant(path.length > 0, 'Path can not be empty.');
}

/**
 * Example: `[0, 1, 2]` to `[0, 1]`.
 */
export function parentPath(path: EditorPath): EditorPath {
  invariantPathIsNotEmpty(path);
  return path.slice(0, -1);
}

/**
 * Example: `[0, 1, 2]` to `2`.
 */

export function lastIndex(path: EditorPath): number {
  invariantPathIsNotEmpty(path);
  return path[path.length - 1];
}

/**
 * Example: `[0, 1, 2]` to `[[0, 1], 2]`.
 */
export function parentPathAndLastIndex(path: EditorPath): [EditorPath, number] {
  return [parentPath(path), lastIndex(path)];
}

export function editorPathsAreForward(
  anchorPath: EditorPath,
  focusPath: EditorPath,
): boolean {
  return !anchorPath.some((value, index) => value > focusPath[index]);
}
