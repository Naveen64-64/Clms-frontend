import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Intelligent Markdown syntax repair for streaming/typing buffers.
 * Completes unclosed Markdown delimiters so that partial tokens
 * render as visual styles instead of showing raw asterisks/backticks.
 */
export function repairIncompleteMarkdown(text) {
  if (!text) return '';

  let repaired = text;

  // 1. Check for unclosed code fence (```)
  const codeFences = (repaired.match(/```/g) || []).length;
  if (codeFences % 2 !== 0) {
    repaired += '\n```';
    return repaired;
  }

  // 2. Check for unclosed inline code (`)
  const inlineCodes = (repaired.match(/(?<!`)`(?!`)/g) || []).length;
  if (inlineCodes % 2 !== 0) {
    repaired += '`';
  }

  // 3. Check for unclosed bold syntax (**)
  const boldMatches = (repaired.match(/\*\*/g) || []).length;
  if (boldMatches % 2 !== 0) {
    repaired += '**';
  } else {
    // 4. Check for unclosed italics (*) - only outside of **
    // Replace valid ** with placeholder to count solitary *
    const strippedBold = repaired.replace(/\*\*/g, '§§');
    const italicMatches = (strippedBold.match(/(?<!\*)\*(?!\*)/g) || []).length;
    // Don't count bullet items at the start of a line like "* Item"
    const isBulletAtLineStart = /(^|\n)\s*\*$/.test(repaired);
    if (italicMatches % 2 !== 0 && !isBulletAtLineStart) {
      repaired += '*';
    }
  }

  // 5. Incomplete table rows
  const lines = repaired.split('\n');
  const lastLine = lines[lines.length - 1];
  if (lastLine.startsWith('|') && !lastLine.endsWith('|')) {
    repaired += ' |';
  }

  return repaired;
}

/**
 * Hook for progressive AI typing effect.
 *
 * @param {string} fullText - The full text to type out
 * @param {boolean} shouldAnimate - Whether to animate progressively or show instantly
 * @param {function} onProgress - Optional callback invoked on each progressive step (e.g. for auto-scroll)
 * @param {function} onComplete - Optional callback invoked when typing finishes
 */
export function useTypingEffect(fullText = '', shouldAnimate = false, onProgress, onComplete) {
  const [displayedLength, setDisplayedLength] = useState(() => (shouldAnimate ? 0 : fullText.length));
  const [isTyping, setIsTyping] = useState(() => shouldAnimate && fullText.length > 0);

  const fullTextRef = useRef(fullText);
  const timerRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    fullTextRef.current = fullText;
  }, [fullText]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // If text or animate flag changes
  useEffect(() => {
    if (!shouldAnimate || !fullText) {
      setDisplayedLength(fullText ? fullText.length : 0);
      setIsTyping(false);
      return;
    }

    // Reset for new animation
    setDisplayedLength(0);
    setIsTyping(true);

    const totalLen = fullText.length;

    // Calculate dynamic step size and interval for natural typing
    // Ensure overall duration stays between ~0.6s and 2.5s
    let charsPerStep = 2;
    let stepInterval = 16;

    if (totalLen <= 120) {
      // Short response: ~0.6s to 1.0s
      charsPerStep = 2;
      stepInterval = 20;
    } else if (totalLen <= 400) {
      // Medium response: ~1.2s to 1.8s
      charsPerStep = 4;
      stepInterval = 18;
    } else if (totalLen <= 1000) {
      // Long response: ~1.8s to 2.4s
      charsPerStep = 7;
      stepInterval = 15;
    } else {
      // Extra long response: cap at ~2.8s
      charsPerStep = Math.ceil(totalLen / 120);
      stepInterval = 14;
    }

    let currentPos = 0;

    const tick = () => {
      // Advance by charsPerStep, but try to avoid breaking in the middle of a markdown delimiter (like `**`)
      let nextPos = Math.min(currentPos + charsPerStep, totalLen);

      // If next char is part of `**`, include the whole marker
      if (nextPos < totalLen && fullText[nextPos] === '*' && fullText[nextPos - 1] === '*') {
        nextPos = Math.min(nextPos + 1, totalLen);
      }

      currentPos = nextPos;
      setDisplayedLength(currentPos);

      if (onProgressRef.current) {
        onProgressRef.current();
      }

      if (currentPos < totalLen) {
        timerRef.current = setTimeout(tick, stepInterval);
      } else {
        setIsTyping(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    timerRef.current = setTimeout(tick, 60);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fullText, shouldAnimate]);

  // Immediately complete the animation (e.g. if user sends next message or skips)
  const completeImmediately = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayedLength(fullTextRef.current.length);
    setIsTyping(false);
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, []);

  const rawVisibleText = fullText.slice(0, displayedLength);
  const displayedText = isTyping ? repairIncompleteMarkdown(rawVisibleText) : rawVisibleText;

  return {
    displayedText,
    isTyping,
    completeImmediately
  };
}

export default useTypingEffect;
