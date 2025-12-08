import * as React from 'react';
import { cn } from './utils';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

const createIcon = (
  name: string,
  path: string,
  viewBox = '0 0 24 24'
): React.FC<IconProps> => {
  const IconComponent: React.FC<IconProps> = ({
    className,
    size = 24,
    ...props
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide-icon', className)}
      {...props}
    >
      <path d={path} />
    </svg>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

// Play icon
export const Play = createIcon('Play', 'M5 3l14 9-14 9V3z');

// Sparkles icon
export const Sparkles = createIcon('Sparkles', 'M12 2v20M2 12h20M6.34 6.34l11.32 11.32M17.66 6.34L6.34 17.66');

// Code icon
export const Code = createIcon('Code', 'M16 18l6-6-6-6M8 6l-6 6 6 6');

// BarChart3 icon
export const BarChart3 = createIcon('BarChart3', 'M3 3v18h18M7 16l4-4 4 4 6-6');

// CheckCircle2 icon
export const CheckCircle2 = createIcon('CheckCircle2', 'M22 11.08V12a10 10 0 1 1-5.93-9.14M9 11l3 3L22 4');

// XCircle icon
export const XCircle = createIcon('XCircle', 'M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zM15 9l-6 6M9 9l6 6');

// AlertTriangle icon
export const AlertTriangle = createIcon('AlertTriangle', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01');

// AlertCircle icon
export const AlertCircle = createIcon('AlertCircle', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01');

// TrendingUp icon
export const TrendingUp = createIcon('TrendingUp', 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6');

// Filter icon
export const Filter = createIcon('Filter', 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z');

// Download icon
export const Download = createIcon('Download', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3');

// Plus icon
export const Plus = createIcon('Plus', 'M12 5v14M5 12h14');

// Minus icon
export const Minus = createIcon('Minus', 'M5 12h14');

// X icon
export const X = createIcon('X', 'M18 6L6 18M6 6l12 12');

// ChevronDown icon
export const ChevronDown = createIcon('ChevronDown', 'M6 9l6 6 6-6');

// ChevronUp icon
export const ChevronUp = createIcon('ChevronUp', 'M18 15l-6-6-6 6');

// ChevronLeft icon
export const ChevronLeft = createIcon('ChevronLeft', 'M15 18l-6-6 6-6');

// ChevronRight icon
export const ChevronRight = createIcon('ChevronRight', 'M9 18l6-6-6-6');

// Search icon
export const Search = createIcon('Search', 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z');

// Settings icon
export const Settings = createIcon('Settings', 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z');

// Eye icon
export const Eye = createIcon('Eye', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');

// EyeOff icon
export const EyeOff = createIcon('EyeOff', 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22');

// Copy icon
export const Copy = createIcon('Copy', 'M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2z');

// Check icon
export const Check = createIcon('Check', 'M20 6L9 17l-5-5');

// MoreVertical icon
export const MoreVertical = createIcon('MoreVertical', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');

// MoreHorizontal icon
export const MoreHorizontal = createIcon('MoreHorizontal', 'M12 12h.01M19 12h.01M5 12h.01');

// Edit icon
export const Edit = createIcon('Edit', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');

// Trash icon
export const Trash = createIcon('Trash', 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');

// RefreshCw icon
export const RefreshCw = createIcon('RefreshCw', 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.48L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15');

// Loader icon
export const Loader = createIcon('Loader', 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83');

// Info icon
export const Info = createIcon('Info', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01');

// ExternalLink icon
export const ExternalLink = createIcon('ExternalLink', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3');

// Calendar icon
export const Calendar = createIcon('Calendar', 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z');

// Clock icon
export const Clock = createIcon('Clock', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2');

// FileText icon
export const FileText = createIcon('FileText', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8');

// Folder icon
export const Folder = createIcon('Folder', 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z');

// Upload icon
export const Upload = createIcon('Upload', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12');

// ArrowRight icon
export const ArrowRight = createIcon('ArrowRight', 'M5 12h14M12 5l7 7-7 7');

// ArrowLeft icon
export const ArrowLeft = createIcon('ArrowLeft', 'M19 12H5M12 19l-7-7 7-7');

// ArrowUp icon
export const ArrowUp = createIcon('ArrowUp', 'M12 19V5M5 12l7-7 7 7');

// ArrowDown icon
export const ArrowDown = createIcon('ArrowDown', 'M12 5v14M19 12l-7 7-7-7');

// Zap icon
export const Zap = createIcon('Zap', 'M13 2L3 14h9l-1 8 10-12h-9l1-8z');

// Star icon
export const Star = createIcon('Star', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');

// Heart icon
export const Heart = createIcon('Heart', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');

// Bell icon
export const Bell = createIcon('Bell', 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0');

// Mail icon
export const Mail = createIcon('Mail', 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6');

// User icon
export const User = createIcon('User', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z');

// Users icon
export const Users = createIcon('Users', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z');

// Lock icon
export const Lock = createIcon('Lock', 'M18 11h-1a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM8 11V7a4 4 0 1 1 8 0v4');

// Unlock icon
export const Unlock = createIcon('Unlock', 'M11 11V7a4 4 0 1 1 8 0v4M7 11h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z');

// Key icon
export const Key = createIcon('Key', 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4');

// Shield icon
export const Shield = createIcon('Shield', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');

// Home icon
export const Home = createIcon('Home', 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10');

// Menu icon
export const Menu = createIcon('Menu', 'M3 12h18M3 6h18M3 18h18');

// Close icon (alias for X)
export const Close = X;

// CheckSquare icon
export const CheckSquare = createIcon('CheckSquare', 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11');

// Square icon
export const Square = createIcon('Square', 'M3 3h18v18H3z');

// Circle icon
export const Circle = createIcon('Circle', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z');

// Radio icon
export const Radio = Circle;
