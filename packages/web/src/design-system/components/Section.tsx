import * as React from 'react';
import { cn } from '@/lib/utils';
import { Container, ContainerProps } from './Container';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Padding variant
   * @default 'default'
   */
  padding?: 'none' | 'sm' | 'default' | 'lg' | 'xl';
  
  /**
   * Background variant
   */
  background?: 'default' | 'muted' | 'accent' | 'transparent';
  
  /**
   * Whether to use Container wrapper
   * @default true
   */
  container?: boolean;
  
  /**
   * Container props (only used if container is true)
   */
  containerProps?: ContainerProps;
  
  /**
   * Semantic HTML element
   * @default 'section'
   */
  as?: 'section' | 'div' | 'article' | 'aside' | 'header' | 'footer' | 'main';
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      padding = 'default',
      background = 'default',
      container = true,
      containerProps,
      as: Component = 'section',
      children,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'py-8 sm:py-12',
      default: 'py-12 sm:py-16 lg:py-20',
      lg: 'py-16 sm:py-20 lg:py-24',
      xl: 'py-20 sm:py-24 lg:py-32',
    };

    const backgroundClasses = {
      default: '',
      muted: 'bg-muted',
      accent: 'bg-accent',
      transparent: 'bg-transparent',
    };

    const content = container ? (
      <Container {...containerProps}>{children}</Container>
    ) : (
      children
    );

    return (
      <Component
        ref={ref as any}
        className={cn(
          paddingClasses[padding],
          backgroundClasses[background],
          className
        )}
        {...props}
      >
        {content}
      </Component>
    );
  }
);
Section.displayName = 'Section';

export { Section };
