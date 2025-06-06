import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { siteSettingsData } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="mt-32 flex flex-col items-center justify-start">
      <div className="w-full max-w-xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p
            className={`
              mt-2 text-gray-700
              dark:text-gray-300
            `}
          >
            Either this page is private or doesn&apos;t exist.
          </p>
        </div>

        <Separator className="mb-4 mt-16 bg-gray-400" />

        <div className="my-8 flex w-full flex-col items-center gap-8 px-4">
          <Link href="/">
            <div
              className={`
                flex flex-col items-center justify-center gap-4
                lg:flex-row lg:justify-start
              `}
            >
              <h1
                className={`
                  text-xl font-bold text-gray-700
                  dark:text-gray-300
                `}
              >
                {siteSettingsData.metaTitle}
              </h1>
              <small
                className={`
                  text-gray-800
                  dark:text-gray-400
                `}
              >
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
