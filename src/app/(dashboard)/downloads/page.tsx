import { listAllDownloads } from "@/features/downloads/server/downloads";
import { DownloadsList } from "@/features/downloads/components/downloads-list";

export default async function DownloadsPage() {
  const downloads = listAllDownloads();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Downloads</h1>
      <DownloadsList initialDownloads={downloads} />
    </>
  );
}
