import { describe, expect, it } from 'vitest';
import { closestWithData, esc, isTypingTarget } from './dom';

describe('esc', () => {
  it('neutralizes markup and attribute breakouts', () => {
    expect(esc(`<script>"x" & 'y'`)).toBe('&lt;script>&quot;x&quot; &amp; &#39;y&#39;');
  });

  it('keeps edge ids intact through an attribute', () => {
    const el = document.createElement('div');
    el.innerHTML = `<span data-x="${esc(`a->b "c" & d`)}"></span>`;
    expect(el.querySelector('span')?.getAttribute('data-x')).toBe('a->b "c" & d');
  });
});

describe('closestWithData', () => {
  it('finds the nearest ancestor with the data attribute', () => {
    const el = document.createElement('div');
    el.innerHTML = '<button data-id="s3"><span>S3</span></button>';
    expect(closestWithData(el.querySelector('span'), 'id')?.dataset.id).toBe('s3');
    expect(closestWithData(null, 'id')).toBeNull();
  });
});

describe('isTypingTarget', () => {
  const input = (type: string) => Object.assign(document.createElement('input'), { type });

  it('is true for text-like fields only', () => {
    expect(isTypingTarget(input('search'))).toBe(true);
    expect(isTypingTarget(input('checkbox'))).toBe(false);
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
  });
});
