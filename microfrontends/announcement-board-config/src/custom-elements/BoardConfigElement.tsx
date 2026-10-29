import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ConfigForm from '../ConfigForm';
import {
  DEFAULT_PARAMS,
  PARAM_NAMES,
  normalizeParams,
  validateParam,
  validateParams,
  type BoardParams,
  type ParamName,
} from '../params';
import '../config.css';

export const ELEMENT_NAME = 'announcement-board-config';

/**
 * widget-config contract (Entando 7.5): App Builder sets the `config` property
 * when the widget settings open and reads it when the page designer saves.
 * The element owns the state because React roots expose no component instance.
 */
export class BoardConfigElement extends HTMLElement {
  private root?: Root;
  private values: BoardParams = { ...DEFAULT_PARAMS };
  /** Valid values received from App Builder: the fallback for invalid edits. */
  private saved: BoardParams = { ...DEFAULT_PARAMS };

  /** What App Builder saves: valid edits, otherwise the previously saved value. */
  get config(): BoardParams {
    const result = { ...this.saved };
    for (const name of PARAM_NAMES) {
      if (!validateParam(name, this.values[name])) {
        result[name] = this.values[name].trim();
      }
    }
    return result;
  }

  set config(value: unknown) {
    this.values = normalizeParams(value);
    this.saved = { ...DEFAULT_PARAMS };
    for (const name of PARAM_NAMES) {
      if (!validateParam(name, this.values[name])) {
        this.saved[name] = this.values[name].trim();
      }
    }
    this.render();
  }

  connectedCallback(): void {
    const mountPoint = document.createElement('div');
    this.appendChild(mountPoint);
    this.root = createRoot(mountPoint);
    this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
    this.replaceChildren();
  }

  private readonly onChange = (name: ParamName, value: string) => {
    this.values = { ...this.values, [name]: value };
    this.render();
  };

  private render(): void {
    this.root?.render(
      <StrictMode>
        <ConfigForm values={this.values} errors={validateParams(this.values)} onChange={this.onChange} />
      </StrictMode>,
    );
  }
}

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, BoardConfigElement);
}
