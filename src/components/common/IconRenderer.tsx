/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = React.memo(({ name, className = 'w-5 h-5', size = 20 }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.CheckSquare;
  return <IconComponent className={className} size={size} />;
});

IconRenderer.displayName = 'IconRenderer';
