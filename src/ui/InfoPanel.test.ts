import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InfoPanel } from './InfoPanel';
import type { Service } from '../types';

// Sample test service
const testService: Service = {
  name: 'EC2',
  category: 'compute',
  description: 'Elastic Compute Cloud - Virtual servers in the cloud',
  details: 'EC2 provides resizable compute capacity.',
  keyPoints: [
    'Pay for what you use',
    'Multiple instance types',
    'Lives inside a VPC',
  ],
  x: 400,
  y: 350,
};

const testServiceNoKeyPoints: Service = {
  name: 'Simple Service',
  category: 'storage',
  description: 'A simple service',
  details: 'Simple details',
  keyPoints: [],
  x: 100,
  y: 100,
};

const testServiceWithExtended: Service = {
  name: 'Lambda',
  category: 'compute',
  description: 'Serverless compute',
  details: 'Run code without servers.',
  keyPoints: ['No server management'],
  x: 650,
  y: 350,
  extendedDescription: 'Lambda functions can be triggered by over 200 AWS services.',
  resources: [
    { title: 'Lambda Documentation', url: 'https://docs.aws.amazon.com/lambda/' },
    { title: 'Lambda Pricing', url: 'https://aws.amazon.com/lambda/pricing/' },
  ],
};

const testServiceWithOnlyDescription: Service = {
  name: 'S3',
  category: 'storage',
  description: 'Object storage',
  details: 'Store data as objects.',
  keyPoints: [],
  x: 950,
  y: 450,
  extendedDescription: 'S3 storage classes include Standard, IA, and Glacier.',
};

const testServiceWithOnlyResources: Service = {
  name: 'VPC',
  category: 'networking',
  description: 'Virtual network',
  details: 'Your private network in AWS.',
  keyPoints: [],
  x: 400,
  y: 50,
  resources: [{ title: 'VPC Documentation', url: 'https://docs.aws.amazon.com/vpc/' }],
};

describe('InfoPanel', () => {
  let element: HTMLElement;
  let infoPanel: InfoPanel;

  beforeEach(() => {
    element = document.createElement('div');
    element.className = 'info-panel';
    document.body.appendChild(element);
    infoPanel = new InfoPanel(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  describe('initialization', () => {
    it('should create an info panel instance', () => {
      expect(infoPanel).toBeInstanceOf(InfoPanel);
    });

    it('should start hidden', () => {
      expect(infoPanel.isVisible()).toBe(false);
    });

    it('should have no current service key initially', () => {
      expect(infoPanel.getCurrentServiceKey()).toBeNull();
    });
  });

  describe('show', () => {
    it('should make the panel visible', () => {
      infoPanel.show('ec2', testService);
      expect(infoPanel.isVisible()).toBe(true);
      expect(element.classList.contains('visible')).toBe(true);
    });

    it('should set the current service key', () => {
      infoPanel.show('ec2', testService);
      expect(infoPanel.getCurrentServiceKey()).toBe('ec2');
    });

    it('should render the service name', () => {
      infoPanel.show('ec2', testService);
      const h2 = element.querySelector('h2');
      expect(h2?.textContent).toBe('EC2');
    });

    it('should render the category badge', () => {
      infoPanel.show('ec2', testService);
      const category = element.querySelector('.category');
      expect(category?.textContent).toBe('COMPUTE');
      expect(category?.classList.contains('compute')).toBe(true);
    });

    it('should render the description', () => {
      infoPanel.show('ec2', testService);
      const description = element.querySelector('.description');
      expect(description?.textContent).toContain('Elastic Compute Cloud');
    });

    it('should render the details', () => {
      infoPanel.show('ec2', testService);
      const details = element.querySelector('.details');
      expect(details?.textContent).toContain('resizable compute capacity');
    });

    it('should render key points when available', () => {
      infoPanel.show('ec2', testService);
      const keyPoints = element.querySelector('.key-points');
      expect(keyPoints).not.toBeNull();
      const listItems = element.querySelectorAll('.key-points li');
      expect(listItems.length).toBe(3);
      expect(listItems[0].textContent).toBe('Pay for what you use');
    });

    it('should not render key points section when empty', () => {
      infoPanel.show('simple', testServiceNoKeyPoints);
      const keyPoints = element.querySelector('.key-points');
      expect(keyPoints).toBeNull();
    });

    it('should render a close button', () => {
      infoPanel.show('ec2', testService);
      const closeBtn = element.querySelector('.close-btn');
      expect(closeBtn).not.toBeNull();
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close panel');
    });
  });

  describe('hide', () => {
    it('should hide the panel', () => {
      infoPanel.show('ec2', testService);
      infoPanel.hide();
      expect(infoPanel.isVisible()).toBe(false);
      expect(element.classList.contains('visible')).toBe(false);
    });

    it('should clear the current service key', () => {
      infoPanel.show('ec2', testService);
      infoPanel.hide();
      expect(infoPanel.getCurrentServiceKey()).toBeNull();
    });
  });

  describe('close button', () => {
    it('should hide panel when close button is clicked', () => {
      infoPanel.show('ec2', testService);
      const closeBtn = element.querySelector('.close-btn') as HTMLButtonElement;
      closeBtn.click();
      expect(infoPanel.isVisible()).toBe(false);
    });

    it('should call onClose callback when close button is clicked', () => {
      const onClose = vi.fn();
      const panelWithCallback = new InfoPanel(element, { onClose });
      panelWithCallback.show('ec2', testService);

      const closeBtn = element.querySelector('.close-btn') as HTMLButtonElement;
      closeBtn.click();

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('XSS protection', () => {
    it('should escape HTML in service name', () => {
      const maliciousService: Service = {
        ...testService,
        name: '<script>alert("xss")</script>',
      };
      infoPanel.show('malicious', maliciousService);
      const h2 = element.querySelector('h2');
      // The angle brackets should be escaped to &lt; and &gt;
      expect(h2?.innerHTML).toContain('&lt;script&gt;');
      expect(h2?.innerHTML).not.toContain('<script>');
      // But textContent should show the original text
      expect(h2?.textContent).toContain('<script>');
    });

    it('should escape HTML in description', () => {
      const maliciousService: Service = {
        ...testService,
        description: '<img src="x" onerror="alert(1)">',
      };
      infoPanel.show('malicious', maliciousService);
      const description = element.querySelector('.description strong');
      // The angle brackets should be escaped - no actual img element created
      expect(description?.innerHTML).toContain('&lt;img');
      expect(description?.innerHTML).not.toContain('<img');
      expect(element.querySelector('img')).toBeNull();
    });

    it('should escape HTML in key points', () => {
      const maliciousService: Service = {
        ...testService,
        keyPoints: ['<a href="javascript:alert(1)">Click me</a>'],
      };
      infoPanel.show('malicious', maliciousService);
      const li = element.querySelector('.key-points li');
      // The angle brackets should be escaped - no actual anchor element created
      expect(li?.innerHTML).toContain('&lt;a');
      expect(li?.innerHTML).not.toContain('<a');
      expect(element.querySelector('.key-points a')).toBeNull();
    });

    it('should escape HTML in extended description', () => {
      const maliciousService: Service = {
        ...testServiceWithExtended,
        extendedDescription: '<script>alert("xss")</script>',
      };
      infoPanel.show('malicious', maliciousService);
      infoPanel.toggleExpanded();
      const extendedDesc = element.querySelector('.extended-description p');
      expect(extendedDesc?.innerHTML).toContain('&lt;script&gt;');
      expect(extendedDesc?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in resource titles', () => {
      const maliciousService: Service = {
        ...testServiceWithExtended,
        resources: [
          {
            title: '<script>alert("xss")</script>',
            url: 'https://example.com?q=<script>',
          },
        ],
      };
      infoPanel.show('malicious', maliciousService);
      infoPanel.toggleExpanded();
      const link = element.querySelector('.resources a');
      // Title should be escaped
      expect(link?.innerHTML).toContain('&lt;script&gt;');
      expect(link?.innerHTML).not.toContain('<script>');
      // URL with HTML special characters should also be escaped
      expect(link?.getAttribute('href')).toContain('&lt;script&gt;');
    });
  });

  describe('service switching', () => {
    it('should update content when showing different service', () => {
      infoPanel.show('ec2', testService);
      expect(element.querySelector('h2')?.textContent).toBe('EC2');

      infoPanel.show('simple', testServiceNoKeyPoints);
      expect(element.querySelector('h2')?.textContent).toBe('Simple Service');
      expect(infoPanel.getCurrentServiceKey()).toBe('simple');
    });
  });

  describe('Learn More functionality', () => {
    it('should not show Learn More button when no extended content', () => {
      infoPanel.show('ec2', testService);
      const learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn).toBeNull();
    });

    it('should show Learn More button when service has extended description', () => {
      infoPanel.show('s3', testServiceWithOnlyDescription);
      const learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn).not.toBeNull();
      expect(learnMoreBtn?.textContent).toBe('Learn more');
    });

    it('should show Learn More button when service has resources', () => {
      infoPanel.show('vpc', testServiceWithOnlyResources);
      const learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn).not.toBeNull();
    });

    it('should show Learn More button when service has both', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      const learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn).not.toBeNull();
    });

    it('should start with extended content hidden', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      expect(infoPanel.isExtendedContentVisible()).toBe(false);
      const extendedContent = element.querySelector('.extended-content');
      expect(extendedContent).toBeNull();
    });

    it('should show extended content when Learn More is clicked', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      const learnMoreBtn = element.querySelector('.learn-more-btn') as HTMLButtonElement;
      learnMoreBtn.click();

      expect(infoPanel.isExtendedContentVisible()).toBe(true);
      const extendedContent = element.querySelector('.extended-content');
      expect(extendedContent).not.toBeNull();
    });

    it('should change button text to "Show less" when expanded', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      const learnMoreBtn = element.querySelector('.learn-more-btn') as HTMLButtonElement;
      learnMoreBtn.click();

      const updatedBtn = element.querySelector('.learn-more-btn');
      expect(updatedBtn?.textContent).toBe('Show less');
    });

    it('should set aria-expanded correctly', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      let learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn?.getAttribute('aria-expanded')).toBe('false');

      (learnMoreBtn as HTMLButtonElement).click();

      learnMoreBtn = element.querySelector('.learn-more-btn');
      expect(learnMoreBtn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should hide extended content when Show less is clicked', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      infoPanel.toggleExpanded(); // expand

      const showLessBtn = element.querySelector('.learn-more-btn') as HTMLButtonElement;
      showLessBtn.click(); // collapse

      expect(infoPanel.isExtendedContentVisible()).toBe(false);
      const extendedContent = element.querySelector('.extended-content');
      expect(extendedContent).toBeNull();
    });

    it('should render extended description when expanded', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      infoPanel.toggleExpanded();

      const extendedDesc = element.querySelector('.extended-description');
      expect(extendedDesc).not.toBeNull();
      expect(extendedDesc?.querySelector('h3')?.textContent).toBe('In-Depth Details:');
      expect(extendedDesc?.querySelector('p')?.textContent).toContain('200 AWS services');
    });

    it('should render resources as links when expanded', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      infoPanel.toggleExpanded();

      const resources = element.querySelector('.resources');
      expect(resources).not.toBeNull();
      expect(resources?.querySelector('h3')?.textContent).toBe('Learn More:');

      const links = element.querySelectorAll('.resources a');
      expect(links.length).toBe(2);

      const firstLink = links[0];
      expect(firstLink.textContent).toBe('Lambda Documentation');
      expect(firstLink.getAttribute('href')).toBe('https://docs.aws.amazon.com/lambda/');
      expect(firstLink.getAttribute('target')).toBe('_blank');
      expect(firstLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('should only show extended description when resources are not provided', () => {
      infoPanel.show('s3', testServiceWithOnlyDescription);
      infoPanel.toggleExpanded();

      const extendedDesc = element.querySelector('.extended-description');
      const resources = element.querySelector('.resources');

      expect(extendedDesc).not.toBeNull();
      expect(resources).toBeNull();
    });

    it('should only show resources when extended description is not provided', () => {
      infoPanel.show('vpc', testServiceWithOnlyResources);
      infoPanel.toggleExpanded();

      const extendedDesc = element.querySelector('.extended-description');
      const resources = element.querySelector('.resources');

      expect(extendedDesc).toBeNull();
      expect(resources).not.toBeNull();
    });

    it('should reset expanded state when showing a different service', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      infoPanel.toggleExpanded();
      expect(infoPanel.isExtendedContentVisible()).toBe(true);

      infoPanel.show('s3', testServiceWithOnlyDescription);
      expect(infoPanel.isExtendedContentVisible()).toBe(false);
    });

    it('should reset expanded state when hiding', () => {
      infoPanel.show('lambda', testServiceWithExtended);
      infoPanel.toggleExpanded();
      expect(infoPanel.isExtendedContentVisible()).toBe(true);

      infoPanel.hide();
      infoPanel.show('lambda', testServiceWithExtended);
      expect(infoPanel.isExtendedContentVisible()).toBe(false);
    });
  });
});
