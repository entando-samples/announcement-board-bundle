import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { parseConfig } from '../config';
// Inlined as a string: page styles cannot reach into the shadow root, and a
// global stylesheet would not reach the widget either.
import styles from '../board.css?inline';

export const ELEMENT_NAME = 'announcement-board';

/**
 * Renders the board inside an open shadow root so that portal CSS does not
 * leak into the widget and the widget's CSS does not leak into the portal.
 */
export class AnnouncementBoardElement extends HTMLElement {
  private root?: Root;

  static get observedAttributes(): string[] {
    return ['config'];
  }

  connectedCallback(): void {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    const mountPoint = document.createElement('div');
    shadow.replaceChildren(style, mountPoint);
    this.root = createRoot(mountPoint);
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
    this.shadowRoot?.replaceChildren();
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
  customElements.define(ELEMENT_NAME, AnnouncementBoardElement);
}
