import {
  childrenLens,
  createValue,
  Editor,
  Value,
  elementLens,
  hasSelection,
  jsx,
  move,
  select,
  setText,
  useLogValue,
} from 'evolu';
import { foldLeft, reverse } from 'fp-ts/lib/Array';
import { fold, none, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const initialValue = createValue({
  element: jsx(
    <div className="root">
      <div className="heading">heading</div>
      <div className="paragraph">paragraph</div>
    </div>,
  ),
  hasFocus: true,
});

function TestSetValue() {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  const operationsRef = useRef([
    setText('foo'),
    select({ anchor: [0, 0, 0], focus: [0, 0, 2] }),
    move(1),
    elementLens.composeLens(childrenLens).modify(reverse),
    elementLens
      .composeLens(childrenLens)
      .modify(childred => childred.slice(0, 1)),
  ]);

  useEffect(() => {
    if (!hasSelection(value)) return;
    pipe(
      operationsRef.current,
      foldLeft(
        () => none,
        (operation, remaining) => {
          operationsRef.current = remaining;
          return some(operation);
        },
      ),
      fold(
        () => {
          // TODO: Here, we should call Puppeter somehow.
        },
        operation => {
          const nextValue = operation(value);
          handleEditorChange(nextValue);
        },
      ),
    );
  });

  return (
    <>
      <Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
    </>
  );
}

export default TestSetValue;
