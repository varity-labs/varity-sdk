import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: 'chevron' | 'slash';
  showHome?: boolean;
  onHomeClick?: () => void;
  className?: string;
}

export function Breadcrumb({
  items,
  separator = 'chevron',
  showHome = true,
  onHomeClick,
  className = '',
}: BreadcrumbProps) {
  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    // Don't navigate if it's the current page (last item)
    if (index === items.length - 1) {
      return;
    }

    if (item.onClick) {
      item.onClick();
    }
  };

  const SeparatorIcon = separator === 'chevron' ? ChevronRight : null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm">
        {showHome && (
          <>
            <li>
              <button
                onClick={onHomeClick}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </button>
            </li>
            <li className="flex items-center text-gray-400 dark:text-gray-600">
              {SeparatorIcon ? (
                <SeparatorIcon className="w-4 h-4" />
              ) : (
                <span>/</span>
              )}
            </li>
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li>
                {isLast ? (
                  <span
                    className="font-medium text-gray-900 dark:text-gray-100"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={() => handleItemClick(item, index)}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors truncate max-w-[200px]"
                  >
                    {item.label}
                  </button>
                )}
              </li>

              {!isLast && (
                <li className="flex items-center text-gray-400 dark:text-gray-600">
                  {SeparatorIcon ? (
                    <SeparatorIcon className="w-4 h-4" />
                  ) : (
                    <span>/</span>
                  )}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
