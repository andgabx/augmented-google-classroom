import { getTranslations } from "next-intl/server";
import { saveGoogleCredentialsAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";

function externalLink(href: string) {
  return function ExternalLinkChunk(chunks: React.ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline"
      >
        {chunks}
      </a>
    );
  };
}

const richComponents = {
  b: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("setup");

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
      <main className="flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-card p-6 shadow-lg sm:gap-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("step1Title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.rich("step1Body", {
              link: externalLink("https://console.cloud.google.com/projectcreate"),
            })}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("step2Title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.rich("step2Body", {
              link: externalLink("https://console.cloud.google.com/apis/library"),
              ...richComponents,
            })}
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>{t("step2Classroom")}</li>
            <li>{t("step2Drive")}</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("step3Title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.rich("step3Body", {
              link: externalLink("https://console.cloud.google.com/auth/overview"),
            })}
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>{t.rich("step3UserType", richComponents)}</li>
            <li>{t("step3FillApp")}</li>
            <li>
              {t.rich("step3ScopesIntro", richComponents)}
              <ul className="mt-1 ml-4 flex flex-col gap-0.5 font-mono text-xs">
                <li>.../auth/classroom.courses.readonly</li>
                <li>.../auth/classroom.coursework.me.readonly</li>
                <li>.../auth/classroom.announcements.readonly</li>
                <li>.../auth/drive.readonly</li>
              </ul>
            </li>
            <li>{t.rich("step3TestUsers", richComponents)}</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("step4Title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.rich("step4Body", {
              link: externalLink("https://console.cloud.google.com/apis/credentials"),
              ...richComponents,
            })}
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>{t.rich("step4AppType", richComponents)}</li>
            <li>
              {t.rich("step4RedirectUri", richComponents)}{" "}
              <code className="rounded bg-muted px-1">
                http://localhost:3000/api/auth/callback
              </code>
            </li>
            <li>{t.rich("step4ClientCreate", richComponents)}</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground">
            {t("step5Title")}
          </h2>

          {error && (
            <p className="text-sm text-destructive">
              {error === "missing_fields" ? t("errorMissingFields") : t("errorGeneric")}
            </p>
          )}

          <form
            action={saveGoogleCredentialsAction}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="clientId"
                className="text-sm font-medium text-foreground"
              >
                {t("clientIdLabel")}
              </label>
              <input
                id="clientId"
                name="clientId"
                type="text"
                required
                placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
                className="rounded-lg bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-shadow focus:shadow-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="clientSecret"
                className="text-sm font-medium text-foreground"
              >
                {t("clientSecretLabel")}
              </label>
              <input
                id="clientSecret"
                name="clientSecret"
                type="password"
                required
                className="rounded-lg bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-shadow focus:shadow-md"
              />
            </div>

            <Button type="submit" className="mt-2 self-start">
              {t("saveButton")}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
