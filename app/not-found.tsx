import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { siteSettingsData } from "@/lib/constants";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-start mt-32">
      <div className="w-full max-w-xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="dark:text-gray-300 text-gray-700 mt-2">
            Either this page is private or doesn&apos;t exist.
          </p>
        </div>

        <Separator className="mt-16 mb-4 bg-gray-400" />

        <div className="my-8 px-4 w-full flex justify-between items-center">
          <Link href="/">
            <div className="lg:flex gap-4 items-center">
              <h1 className="text-xl font-bold dark:text-gray-300 text-gray-700">
                {siteSettingsData.metaTitle}
              </h1>
              <small className="dark:text-gray-400 text-gray-800">
                {siteSettingsData.metaDescription}
              </small>
            </div>
          </Link>
          <Button asChild>
            <Link href="/" className="text-sm">
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
