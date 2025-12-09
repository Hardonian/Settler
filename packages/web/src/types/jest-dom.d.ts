/**
 * Jest DOM Matcher Types
 *
 * Type declarations for @testing-library/jest-dom matchers
 * This extends Jest's expect matchers with DOM-specific assertions
 */

import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveClass(className: string | string[]): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeVisible(): R;
      toBeEmptyDOMElement(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(html: string): R;
      toHaveAccessibleDescription(description: string | RegExp): R;
      toHaveAccessibleName(name: string | RegExp): R;
      toHaveAttribute(attribute: string, value?: string | RegExp): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, unknown>): R;
      toHaveStyle(css: string | Record<string, unknown>): R;
      toHaveTextContent(
        text: string | RegExp | ((text: string, element: HTMLElement) => boolean)
      ): R;
      toHaveValue(value: string | string[] | number): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(description: string | RegExp): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeEmpty(): R;
      toHaveErrorMessage(message: string | RegExp): R;
    }
  }
}

export {};
