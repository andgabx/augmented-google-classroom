import { downloadMaterialFile, markDone, markDownloading, markError, markQueued } from "@/features/downloads/server/downloads";

const CONCURRENCY = 3;
const MAX_ATTEMPTS = 5;

interface Job {
  materialId: string;
  redirectUri: string;
}

const pending: Job[] = [];
let active = 0;

export function enqueueDownloads(materialIds: string[], redirectUri: string) {
  for (const materialId of materialIds) {
    markQueued(materialId);
    pending.push({ materialId, redirectUri });
  }
  pump();
}

function pump() {
  while (active < CONCURRENCY && pending.length > 0) {
    const job = pending.shift();
    if (!job) break;
    active++;
    runJob(job, 1).finally(() => {
      active--;
      pump();
    });
  }
}

async function runJob(job: Job, attempt: number): Promise<void> {
  markDownloading(job.materialId, attempt);
  try {
    const localPath = await downloadMaterialFile(job.materialId, job.redirectUri);
    markDone(job.materialId, localPath, attempt);
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 429 && attempt < MAX_ATTEMPTS) {
      const delayMs = 2 ** attempt * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return runJob(job, attempt + 1);
    }
    markError(job.materialId, error instanceof Error ? error.message : "Unknown error", attempt);
  }
}
