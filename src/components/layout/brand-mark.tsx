import Image from "next/image";
import { cn } from "@/lib/utils";

/** Official Legal Eagle eagle-and-scales mark (cropped from the brand logo). */
export function BrandMark({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image
        src="/brand/legal-eagle-mark.png"
        alt="Legal Eagle"
        width={240}
        height={200}
        priority
        className="h-8 w-auto shrink-0"
      />
      {!collapsed ? (
        <p className="min-w-0 truncate font-heading text-lg font-semibold tracking-tight text-white">Legal Eagle</p>
      ) : null}
    </div>
  );
}
