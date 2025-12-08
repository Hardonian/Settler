'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  splitBy?: 'words' | 'chars';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export function TextReveal({
  text,
  className,
  delay = 0,
  staggerDelay = 0.05,
  splitBy = 'words',
}: TextRevealProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number], // Custom easing for smooth reveal
      },
    },
  };

  const splitText = splitBy === 'words' ? text.split(' ') : text.split('');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn('inline-block', className)}
    >
      {splitText.map((item, index) => {
        // For words, add a space after each word except the last
        const displayItem = splitBy === 'words' ? (index < splitText.length - 1 ? `${item} ` : item) : item;
        
        return (
          <motion.span
            key={index}
            variants={itemVariants}
            className="inline-block"
            style={{
              whiteSpace: splitBy === 'chars' ? 'normal' : 'pre',
            }}
          >
            {displayItem}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

// Wrapper component that renders the appropriate HTML element
export function TextRevealHeading({
  text,
  className,
  delay = 0,
  staggerDelay = 0.05,
  splitBy = 'words',
  as: Component = 'h1',
  ...props
}: TextRevealProps & { 
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id?: string;
} & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Component className={className} {...props}>
      <TextReveal
        text={text}
        delay={delay}
        staggerDelay={staggerDelay}
        splitBy={splitBy}
      />
    </Component>
  );
}
