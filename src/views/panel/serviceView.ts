import { CATEGORIES } from '../../config/categories';
import { RELATION_TYPES, RELATION_TYPE_IDS } from '../../config/relations';
import { edgeId, groupByType, type Relation } from '../../data/graph';
import { toursFeaturing } from '../../data/tours';
import type { AppContext } from '../../state/context';
import type { RelationType, Service } from '../../types';
import { esc } from '../../utils/dom';
import { bulletList, section, swatch, topbar } from './fragments';

/** Full sentence with the other service emphasized; the row navigates to it. */
const relationRow = ({ connection, other, direction }: Relation, ctx: AppContext): string => {
  const name = (id: string): string => esc(ctx.services[id]?.name ?? id);
  const otherName = `<strong class="rel-other">${name(other)}</strong>`;
  const selfName = `<span class="rel-self">${name(direction === 'out' ? connection.from : connection.to)}</span>`;
  const [subject, object] = direction === 'out' ? [selfName, otherName] : [otherName, selfName];
  return `
    <li>
      <button type="button" class="rel-row" data-service="${esc(other)}" data-edge="${esc(edgeId(connection))}">
        <span class="rel-arrow" aria-hidden="true">${direction === 'out' ? '→' : '←'}</span>
        <span class="rel-text">${subject} ${esc(connection.verb)} ${object}</span>
      </button>
    </li>`;
};

const relationGroup = ([type, relations]: [RelationType, Relation[]], ctx: AppContext): string => `
  <div class="rel-group" data-type="${type}">
    <h4 class="rel-group-title">${swatch(type)}${esc(RELATION_TYPES[type].label)}</h4>
    <ul class="rel-list">${relations.map((relation) => relationRow(relation, ctx)).join('')}</ul>
  </div>`;

const relationsSection = (id: string, ctx: AppContext): string => {
  const relations = ctx.graph.relationsOf(id);
  if (relations.length === 0) return '';
  const groups = groupByType(relations, RELATION_TYPE_IDS).map((group) => relationGroup(group, ctx)).join('');
  return section('How it connects', groups, `<span class="count">${relations.length}</span>`);
};

const toursSection = (id: string, ctx: AppContext): string => {
  const featured = toursFeaturing(ctx.tours, id);
  if (featured.length === 0) return '';
  const chips = featured
    .map(
      ({ tour, step }) =>
        `<li><button type="button" class="chip" data-tour="${esc(tour.id)}" data-step="${step}">${esc(tour.title)}</button></li>`
    )
    .join('');
  return section('See it in a tour', `<ul class="chip-list">${chips}</ul>`);
};

const resourcesSection = ({ resources }: Service): string =>
  resources.length === 0
    ? ''
    : section(
        'Learn more',
        `<ul class="links">${resources
          .map(
            ({ title, url }) =>
              `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}<span aria-hidden="true">↗</span></a></li>`
          )
          .join('')}</ul>`
      );

export const serviceView = (id: string, ctx: AppContext): string => {
  const service = ctx.services[id];
  const category = CATEGORIES[service.category];
  const fullName = service.fullName !== service.name ? `<p class="full-name">${esc(service.fullName)}</p>` : '';

  return `
    <div class="panel-body" style="--cat: var(--cat-${service.category})">
      ${topbar(`<span class="zone-dot"></span>${esc(category.label)}`)}
      <h2 class="panel-title">${esc(service.name)}</h2>
      ${fullName}
      <p class="tagline">${esc(service.tagline)}</p>
      <p class="lead">${esc(service.summary)}</p>
      ${relationsSection(id, ctx)}
      ${section('Exam key points', bulletList(service.keyPoints))}
      ${service.extendedDescription ? section('Deep dive', `<p class="prose">${esc(service.extendedDescription)}</p>`) : ''}
      ${toursSection(id, ctx)}
      ${resourcesSection(service)}
    </div>`;
};
