/**
 * Platform-Specific Themes
 * 
 * Design tokens for GitHub, GitLab, and Bitbucket to match their native look and feel.
 */

import { PlatformTheme } from './types';

export const githubTheme: PlatformTheme = {
  name: 'github',
  colors: {
    primary: '#238636', // GitHub green
    secondary: '#0969da', // GitHub blue
    accent: '#f85149', // GitHub red
    background: '#ffffff',
    surface: '#f6f8fa',
    text: '#24292f',
    border: '#d0d7de',
  },
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
  },
};

export const gitlabTheme: PlatformTheme = {
  name: 'gitlab',
  colors: {
    primary: '#fc6d26', // GitLab orange
    secondary: '#292961', // GitLab dark blue
    accent: '#e24329', // GitLab red
    background: '#ffffff',
    surface: '#fafafa',
    text: '#303030',
    border: '#dbdbdb',
  },
  fonts: {
    heading: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
};

export const bitbucketTheme: PlatformTheme = {
  name: 'bitbucket',
  colors: {
    primary: '#0052cc', // Bitbucket blue
    secondary: '#0065ff',
    accent: '#de350b', // Bitbucket red
    background: '#ffffff',
    surface: '#f4f5f7',
    text: '#172b4d',
    border: '#dfe1e6',
  },
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", sans-serif',
    mono: '"SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '3px',
    md: '6px',
    lg: '8px',
  },
};

export const readylayerTheme: PlatformTheme = {
  name: 'github', // Default, but will be overridden
  colors: {
    primary: '#2563eb', // Settler blue
    secondary: '#7c3aed', // Settler purple
    accent: '#ef4444', // Settler red
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    border: '#e2e8f0',
  },
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "SF Mono", "Monaco", "Consolas", monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
  },
};

export function getThemeForProvider(provider: 'github' | 'gitlab' | 'bitbucket'): PlatformTheme {
  switch (provider) {
    case 'github':
      return githubTheme;
    case 'gitlab':
      return gitlabTheme;
    case 'bitbucket':
      return bitbucketTheme;
    default:
      return readylayerTheme;
  }
}
