import { getTranslations } from "next-intl/server";
import { listAllDownloads } from "@/features/downloads/server/downloads";
import { DownloadsList } from "@/features/downloads/components/downloads-list";
import { ClearDownloadsButton } from "@/features/downloads/components/clear-downloads-button";

export default async function DownloadsPage() {
  const t = await getTranslations("downloads");
  const tMaterials = await getTranslations("materials");
  const downloads = listAllDownloads(tMaterials("untitled"));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("title")}</h1>
        {downloads.length > 0 && <ClearDownloadsButton />}
      </div>
      <DownloadsList initialDownloads={downloads} />
    </>
  );
}
