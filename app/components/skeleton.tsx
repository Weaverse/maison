import clsx from "clsx";

/**
 * A shared component and Suspense call that's used in `App.server.jsx` to let your app wait for code to load while declaring a loading state
 */
export function Skeleton({
  as: Component = "div",
  width,
  height,
  className,
  ...props
}: {
  as?: React.ElementType;
  width?: string;
  height?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      {...props}
      width={width}
      height={height}
      // `--color-line-subtle`, the theme's own quiet fill, rather than a
      // Tailwind grey that no style guide names and no setting can reach.
      className={clsx("animate-pulse bg-line-subtle", className)}
    />
  );
}
