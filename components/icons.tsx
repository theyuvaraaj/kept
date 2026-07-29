import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

interface IconProps {
  size?: number;
  color?: string;
  width?: number; // stroke width
}

const stroke = (color = colors.ink, w = 2.4) => ({
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

export function Pin({ size = 18, color = colors.ink, width = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z" {...stroke(color, width)} />
      <Circle cx={12} cy={10} r={2.8} {...stroke(color, width)} />
    </Svg>
  );
}

export function Flame({ size = 18, color = colors.flame }: IconProps) {
  return (
    <Svg width={size} height={size * 1.14} viewBox="0 0 24 24">
      <Path
        d="M13.5 1.5c.5 3.2-1.6 4.6-2.9 6.2-1 1.4-1.9 3-1.1 5 .3.7-.6 1.3-1.1.8-1.4-1.3-1.7-3.2-1.6-4.1-1.7 1.3-2.5 3.3-2.5 5.3C4.3 18.5 7.4 21 11 21s6.7-2.6 6.7-6.4c0-4.7-3.6-6.9-4.2-13.1Z"
        fill={color}
      />
    </Svg>
  );
}

export function Check({ size = 18, color = colors.ink, width = 3.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12.5l5 5L20 6" {...stroke(color, width)} />
    </Svg>
  );
}

export function ArrowRight({ size = 18, color = colors.ink, width = 3 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12h13M13 6l6 6-6 6" {...stroke(color, width)} />
    </Svg>
  );
}

export function ArrowLeft({ size = 14, color = colors.ink, width = 3 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 12H6M11 6l-6 6 6 6" {...stroke(color, width)} />
    </Svg>
  );
}

export function Search({ size = 17, color = colors.muted, width = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={7} {...stroke(color, width)} />
      <Path d="M21 21l-4.3-4.3" {...stroke(color, width)} />
    </Svg>
  );
}

export function Plus({ size = 17, color = colors.ink, width = 3 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" {...stroke(color, width)} />
    </Svg>
  );
}

export function XMark({ size = 18, color = colors.ink, width = 3.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" {...stroke(color, width)} />
    </Svg>
  );
}

export function User({ size = 18, color = colors.ink, width = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} {...stroke(color, width)} />
      <Path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" {...stroke(color, width)} />
    </Svg>
  );
}

export function Chart({ size = 18, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={12} width={4} height={8} rx={1} fill={color} />
      <Rect x={10} y={7} width={4} height={13} rx={1} fill={color} />
      <Rect x={17} y={3} width={4} height={17} rx={1} fill={color} />
    </Svg>
  );
}

export function Gear({ size = 18, color = colors.ink, width = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} {...stroke(color, width)} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        {...stroke(color, width)}
      />
    </Svg>
  );
}

export function Eye({ size = 20, color = colors.muted, width = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" {...stroke(color, width)} />
      <Circle cx={12} cy={12} r={3} {...stroke(color, width)} />
    </Svg>
  );
}

export function EyeOff({ size = 20, color = colors.muted, width = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
        {...stroke(color, width)}
      />
      <Path d="M1 1l22 22" {...stroke(color, width)} />
    </Svg>
  );
}

export function Clock({ size = 18, color = colors.ink, width = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...stroke(color, width)} />
      <Path d="M12 7v5l3 2" {...stroke(color, width)} />
    </Svg>
  );
}

export function Logout({ size = 16, color = colors.surface, width = 2.4 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...stroke(color, width)} />
      <Path d="M16 17l5-5-5-5" {...stroke(color, width)} />
      <Path d="M21 12H9" {...stroke(color, width)} />
    </Svg>
  );
}

export function Chat({ size = 18, color = colors.ink, width = 2.2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        {...stroke(color, width)}
      />
      <Path d="M8 10h8M8 13h5" {...stroke(color, width)} />
    </Svg>
  );
}
