import { clsx } from 'clsx';

/**
 * Mobile-friendly skeleton loader for async content
 * Used in Suspense fallbacks
 */
const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-700 rounded-lg',
        className
      )}
      {...props}
    />
  );
};

export default Skeleton;

