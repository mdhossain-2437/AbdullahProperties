import NextImage, { type ImageProps } from "next/image";

/**
 * Sites/vinext currently routes Next image optimization through a runtime
 * asset binding that is unavailable in the local preview. Source assets are
 * delivered directly so visual content never fails closed.
 */
export function AppImage(props: ImageProps) {
  return <NextImage {...props} unoptimized />;
}
