import { useState } from "react";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { CampusPost } from "./shared";

/**
 * Small square thumbnail for list rows. Falls back to the institution logo
 * on a mist tile instead of a cropped oversized monogram.
 */
export function Thumb({ post, alt }: { post: CampusPost; alt: string }) {
  const [failed, setFailed] = useState(false);
  const usePhoto = Boolean(post.featured_image_url) && !failed;

  return (
    <div className="aspect-square w-full overflow-hidden rounded-lg bg-akboy-mist">
      {usePhoto ? (
        <img
          src={post.featured_image_url as string}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center p-2">
          <InstitutionLogo
            school={post.school}
            title={alt}
            tags={post.tags}
            institution_type={post.institution_type}
            size={44}
            rounded="rounded-full"
          />
        </div>
      )}
    </div>
  );
}
