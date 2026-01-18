import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Legend Toggle', () => {
  let legendElement: HTMLElement;
  let toggleButton: HTMLButtonElement;

  beforeEach(() => {
    // Create DOM structure
    legendElement = document.createElement('div');
    legendElement.id = 'legend';
    legendElement.className = 'legend';
    document.body.appendChild(legendElement);

    toggleButton = document.createElement('button');
    toggleButton.id = 'toggleLegendBtn';
    document.body.appendChild(toggleButton);

    // Set up the toggle listener (mimicking main.ts behavior)
    toggleButton.addEventListener('click', () => {
      legendElement.classList.toggle('hidden');
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('legend should be visible by default (no hidden class)', () => {
      expect(legendElement.classList.contains('hidden')).toBe(false);
    });

    it('legend should have the legend class', () => {
      expect(legendElement.classList.contains('legend')).toBe(true);
    });
  });

  describe('Toggle functionality', () => {
    it('should add hidden class when clicked once', () => {
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(true);
    });

    it('should remove hidden class when clicked twice', () => {
      toggleButton.click();
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(false);
    });

    it('should toggle visibility multiple times', () => {
      // Click 1: hide
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(true);

      // Click 2: show
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(false);

      // Click 3: hide
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(true);

      // Click 4: show
      toggleButton.click();
      expect(legendElement.classList.contains('hidden')).toBe(false);
    });

    it('should preserve other classes on the legend element', () => {
      legendElement.classList.add('custom-class');

      toggleButton.click();
      expect(legendElement.classList.contains('legend')).toBe(true);
      expect(legendElement.classList.contains('custom-class')).toBe(true);
      expect(legendElement.classList.contains('hidden')).toBe(true);

      toggleButton.click();
      expect(legendElement.classList.contains('legend')).toBe(true);
      expect(legendElement.classList.contains('custom-class')).toBe(true);
      expect(legendElement.classList.contains('hidden')).toBe(false);
    });
  });
});
