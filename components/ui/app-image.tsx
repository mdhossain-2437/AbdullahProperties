import NextImage, { type ImageProps } from "next/image";

type AppImageProps = Omit<ImageProps, "preload" | "priority"> & {
  preload?: boolean;
};

/**
 * Sites/vinext currently routes Next image optimization through a runtime
 * asset binding that is unavailable in the local preview. Source assets are
 * delivered directly so visual content never fails closed. The wrapper also
 * translates Next 16's `preload` API to vinext's current `priority` adapter.
 */
export function AppImage({ preload = false, ...props }: AppImageProps) {
  return <NextImage {...props} unoptimized priority={preload} />;
}
