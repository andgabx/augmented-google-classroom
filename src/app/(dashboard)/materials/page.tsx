import { getTranslations } from "next-intl/server";
import { listDownloadedMaterials } from "@/features/downloads/server/downloads";
import { MyMaterialsView } from "@/features/materials/components/my-materials-view";

export default async function MyMaterialsPage() {
  const t = await getTranslations("myMaterials");
  const tMaterials = await getTranslations("materials");
  const materials = listDownloadedMaterials(tMaterials("untitled"));

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("title")}</h1>
      <MyMaterialsView materials={materials} />
    </>
  );
}
