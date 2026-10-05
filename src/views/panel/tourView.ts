import type { AppContext } from '../../state/context';
import type { Tour } from '../../types';
import { esc } from '../../utils/dom';
import { topbar } from './fragments';

const stepItem = (tour: Tour, index: number, current: number, ctx: AppContext): string => {
  const { service, text } = tour.steps[index];
  const name = esc(ctx.services[service]?.name ?? service);
  const state = index === current ? 'is-current' : index < current ? 'is-done' : '';
  const details =
    index === current
      ? `<button type="button" class="text-btn" data-service="${esc(service)}">All about ${name} →</button>`
      : '';
  return `
    <li class="step ${state}" ${index === current ? 'aria-current="step"' : ''}>
      <button type="button" class="step-head" data-step="${index}">
        <span class="step-num">${index + 1}</span>
        <span class="step-name">${name}</span>
      </button>
      <p class="step-text">${esc(text)}</p>
      ${details}
    </li>`;
};

export const tourView = (tour: Tour, current: number, ctx: AppContext): string => {
  const total = tour.steps.length;
  const isLast = current === total - 1;
  const progress = ((current + 1) / total) * 100;

  return `
    <div class="panel-body panel-body--tour">
      ${topbar(`Guided tour · ${current + 1} of ${total}`, 'Exit tour')}
      <h2 class="panel-title">${esc(tour.title)}</h2>
      <p class="lead">${esc(tour.summary)}</p>
      <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${current + 1}">
        <span style="width:${progress}%"></span>
      </div>
      <ol class="steps">${tour.steps.map((_, i) => stepItem(tour, i, current, ctx)).join('')}</ol>
    </div>
    <div class="tour-nav">
      <button type="button" class="btn" data-action="prev" ${current === 0 ? 'disabled' : ''}>← Back</button>
      <button type="button" class="btn btn--primary" data-action="${isLast ? 'close' : 'next'}">${isLast ? 'Finish' : 'Next →'}</button>
    </div>`;
};
