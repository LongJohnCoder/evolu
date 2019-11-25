import React, { useState, useCallback } from 'react';
import { Editor, Value, useLogValue, createValue, toSelection } from 'evolu';
import { testSelectionElement } from './testSelection';

const initialValue = createValue({
  element: testSelectionElement,
  hasFocus: false,
  selection: toSelection({
    anchor: [0, 0, 0],
    focus: [0, 0, 2],
  }),
});

const TestSelectionNoFocusSomeSelection = () => {
  const [value, setValue] = useState(initialValue);

  const [logValue, logValueElement] = useLogValue(value);

  const handleEditorChange = useCallback(
    (value: Value) => {
      logValue(value);
      setValue(value);
    },
    [logValue],
  );

  return (
    <>
      <Editor value={value} onChange={handleEditorChange} />
      {logValueElement}
    </>
  );
};

export default TestSelectionNoFocusSomeSelection;
