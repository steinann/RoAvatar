import { useEffect } from 'react';

export function useHighlight(targetRef: React.RefObject<HTMLElement>, startOffset: number, endOffset: number, highlightName = 'highlight') {
  useEffect(() => {
    const targetElement = targetRef?.current
    if (!targetElement) return;

    const range = document.createRange()
    range.setStart(targetElement, startOffset)
    range.setEnd(targetElement, endOffset)

    const highlight = new Highlight(range)
    CSS.highlights.set(highlightName, highlight)

    return () => {
      CSS.highlights.delete(highlightName)
    }
  }, [targetRef, startOffset, endOffset, highlightName])
}
