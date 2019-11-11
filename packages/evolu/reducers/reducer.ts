import { absurd } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { select, deleteContent, setFocus, setText } from '../models/value';
import { EditorReducer } from '../types';

export const reducer: EditorReducer = (value, action) => {
  switch (action.type) {
    case 'focus':
      return pipe(value, setFocus(true));
    case 'blur':
      return pipe(value, setFocus(false));
    case 'selectionChange':
      return pipe(value, select(action.selection));
    case 'setText':
      return pipe(value, setText(action.arg));
    case 'deleteContent':
      return pipe(value, deleteContent(action.selection));
    default:
      return absurd(action);
  }
};
