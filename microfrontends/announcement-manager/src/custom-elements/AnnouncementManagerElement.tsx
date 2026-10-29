import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { parseConfig } from '../config';
import '../manager.css';

export const ELEMENT_NAME = 'announcement-manager';

export class AnnouncementManagerElement extends HTMLElement {
  private root?: Root;

  static get observedAttributes(): string[] {
    return ['config'];
  }

  connectedCallback(): void {
    const mountPoint = document.createElement('div');
    this.appendChild(mountPoint);
    this.root = createRoot(mountPoint);
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
    this.replaceChildren();
  }

  private render(): void {
    this.root?.render(
      <StrictMode>
        <App config={parseConfig(this.getAttribute('config'))} />
      </StrictMode>,
    );
  }
}

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, AnnouncementManagerElement);
}
