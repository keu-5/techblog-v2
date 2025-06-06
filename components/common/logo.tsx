import Image from "next/image";

import { Link } from "@/components/ui/link";
import { siteSettingsData } from "@/lib/constants";
import logo from "@/public/logo.png";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="my-9 space-y-2">
        <div className="flex items-start gap-2">
          <Image
            alt={siteSettingsData.metaTitle}
            src={logo}
            width={20}
            height={20}
            className="my-2 rounded-sm"
          />
          <h1 className="text-3xl font-bold">{siteSettingsData.metaTitle}</h1>
        </div>
        <small className="text-gray-400">
          {siteSettingsData.metaDescription}
        </small>
      </div>
    </Link>
  );
};
