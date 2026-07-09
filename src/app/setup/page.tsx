import { saveGoogleCredentialsAction } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  missing_fields: "Preencha os dois campos para continuar.",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
      <main className="flex w-full max-w-2xl flex-col gap-8 rounded-3xl border border-border bg-card p-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Conectar sua conta Google
          </h1>
          <p className="text-sm text-muted-foreground">
            O Augmented Classroom não tem servidor central — cada instalação usa
            suas próprias credenciais do Google Cloud. Isso é feito uma única
            vez, leva uns 5 minutos, e fica salvo localmente.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Passo 1 — Criar/abrir um projeto
          </h2>
          <p className="text-sm text-muted-foreground">
            Acesse o{" "}
            <a
              href="https://console.cloud.google.com/projectcreate"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              Google Cloud Console
            </a>{" "}
            e crie um projeto novo (pode chamar de &quot;Augmented
            Classroom&quot;), ou selecione um projeto existente no seletor no
            topo da página.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Passo 2 — Ativar as APIs
          </h2>
          <p className="text-sm text-muted-foreground">
            Na{" "}
            <a
              href="https://console.cloud.google.com/apis/library"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              Library de APIs
            </a>
            , busque e clique em <strong>Enable</strong> para:
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Google Classroom API</li>
            <li>Google Drive API (necessária pra baixar anexos dos materiais)</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Passo 3 — Configurar a tela de consentimento
          </h2>
          <p className="text-sm text-muted-foreground">
            Na{" "}
            <a
              href="https://console.cloud.google.com/auth/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              OAuth consent screen
            </a>
            :
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>
              <strong>User type:</strong> External (a menos que você tenha
              Google Workspace).
            </li>
            <li>Preencha nome do app, e-mail de suporte e de contato.</li>
            <li>
              Em <strong>Scopes</strong>, adicione manualmente:
              <ul className="mt-1 ml-4 flex flex-col gap-0.5 font-mono text-xs">
                <li>.../auth/classroom.courses.readonly</li>
                <li>.../auth/classroom.coursework.me.readonly</li>
                <li>.../auth/classroom.announcements.readonly</li>
                <li>.../auth/drive.readonly</li>
              </ul>
            </li>
            <li>
              Em <strong>Test users</strong>, adicione o seu próprio e-mail
              Google. Sem isso, o Google bloqueia o login com o erro
              &quot;access blocked: app has not completed verification&quot;
              — não é preciso publicar o app nem passar pela verificação
              formal, só cadastrar os e-mails que vão usá-lo aqui.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Passo 4 — Criar a credencial OAuth
          </h2>
          <p className="text-sm text-muted-foreground">
            Na{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline"
            >
              tela de Credenciais
            </a>
            , clique <strong>Create Credentials → OAuth client ID</strong>:
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc list-inside">
            <li>
              <strong>Application type:</strong> Web application.
            </li>
            <li>
              Em <strong>Authorized redirect URIs</strong>, adicione
              exatamente:{" "}
              <code className="rounded bg-muted px-1">
                http://localhost:3000/api/auth/callback
              </code>
            </li>
            <li>
              Clique <strong>Create</strong> — um modal vai mostrar o{" "}
              <strong>Client ID</strong> e o <strong>Client Secret</strong>.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground">
            Passo 5 — Colar as credenciais
          </h2>

          {error && (
            <p className="text-sm text-destructive">
              {errorMessages[error] ?? "Algo deu errado, tente novamente."}
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
                Client ID
              </label>
              <input
                id="clientId"
                name="clientId"
                type="text"
                required
                placeholder="000000000000-xxxxxxxx.apps.googleusercontent.com"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="clientSecret"
                className="text-sm font-medium text-foreground"
              >
                Client Secret
              </label>
              <input
                id="clientSecret"
                name="clientSecret"
                type="password"
                required
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>

            <Button type="submit" className="mt-2 self-start">
              Salvar e conectar com Google
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
