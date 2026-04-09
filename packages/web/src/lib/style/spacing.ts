/**
 * Spacing System & Layout Utilities
 *
 * Standardized spacing scale and layout utilities for consistent vertical rhythm
 * and horizontal spacing across all components.
 */

/**
 * Spacing scale based on 4px base unit
 */
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  40: "10rem", // 160px
  48: "12rem", // 192px
  64: "16rem", // 256px
} as const;

/**
 * Vertical spacing scale for sections
 * Ensures consistent vertical rhythm
 */
export const verticalSpacing = {
  xs: "1.5rem", // 24px - tight spacing
  sm: "2rem", // 32px - compact sections
  md: "3rem", // 48px - standard sections
  lg: "4rem", // 64px - spacious sections
  xl: "5rem", // 80px - hero sections
  "2xl": "6rem", // 96px - extra spacious
} as const;

/**
 * Horizontal spacing scale for containers
 */
export const horizontalSpacing = {
  xs: "1rem", // 16px - mobile padding
  sm: "1.5rem", // 24px - tablet padding
  md: "2rem", // 32px - desktop padding
  lg: "3rem", // 48px - wide desktop
  xl: "4rem", // 64px - extra wide
} as const;

/**
 * Component spacing presets
 */
export const componentSpacing = {
  // Card padding
  card: {
    sm: "1rem", // 16px
    md: "1.5rem", // 24px
    lg: "2rem", // 32px
  },

  // Form spacing
  form: {
    fieldGap: "1.5rem", // 24px between form fields
    labelGap: "0.5rem", // 8px between label and input
    groupGap: "2rem", // 32px between form groups
  },

  // List spacing
  list: {
    itemGap: "0.75rem", // 12px between list items
    sectionGap: "1.5rem", // 24px between list sections
  },

  // Navigation spacing
  nav: {
    itemGap: "1.5rem", // 24px between nav items
    sectionGap: "2rem", // 32px between nav sections
  },
} as const;

/**
 * Layout constraints
 */
export const layoutConstraints = {
  // Max content width for readability
  maxContentWidth: "65ch", // ~65 characters for optimal reading

  // Container max widths
  container: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1400px",
  },

  // Section constraints
  section: {
    minHeight: "400px", // Minimum section height
    maxWidth: "1400px", // Maximum section width
  },
} as const;

/**
 * Tailwind CSS classes for common spacing patterns
 */
export const spacingClasses = {
  // Vertical spacing between sections
  sectionGap: "space-y-12 md:space-y-16 lg:space-y-20",

  // Card padding
  cardPadding: "p-4 md:p-6",

  // Form spacing
  formSpacing: "space-y-6",
  formFieldGap: "space-y-1.5",

  // Container padding
  containerPadding: "px-4 sm:px-6 lg:px-8",

  // Content max width for readability
  readableContent: "max-w-[65ch]",
} as const;
