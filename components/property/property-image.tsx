import Image from "next/image";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { publicImageUrl } from "@/lib/images";

type PropertyImageProps = {
  /** Storage path in the property-images bucket, or null for the placeholder. */
  path: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

// Property photo that fills its (relatively positioned) parent; grey placeholder when there is none.
export function PropertyImage({ path, alt, sizes, className, priority }: PropertyImageProps) {
  if (!path) {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center bg-mist text-muted-text", className)}>
        <Icon name="image" className="size-10" />
        <span className="sr-only">אין תמונה</span>
      </div>
    );
  }
  return (
    <Image
      src={publicImageUrl(path)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
