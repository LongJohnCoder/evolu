/* eslint-env browser */
import { useRef, MutableRefObject, useCallback } from 'react';
import { AfterTyping } from '../types';

/**
 * Run the last callback on the requestAnimationFrame to get DOM changes
 * after typing. Everything else it's too soon or too late.
 */
export const useAfterTyping = (): {
  afterTyping: AfterTyping;
  isTypingRef: MutableRefObject<boolean>;
} => {
  const isTypingRef = useRef(false);
  const lastCallback = useRef(() => {});
  const afterTyping = useCallback<AfterTyping>(callback => {
    isTypingRef.current = true;
    // Maybe call current before overriding.
    lastCallback.current = callback;
    requestAnimationFrame(() => {
      isTypingRef.current = false;
      lastCallback.current();
    });
  }, []);

  return { afterTyping, isTypingRef };
};
