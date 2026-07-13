import { markLyceumSessionInvalid, markLyceumSessionValid } from "@/features/lyceum/server/session";

function baseUrl(tenant: string): string {
  return `https://${tenant}.lyceum.com.br`;
}

// ponytail: o Lyceum (app Java legado) às vezes devolve bytes UTF-8 já
// decodificados como Latin-1 no servidor, gerando "Ã©"/"Ã§" em vez de "é"/"ç".
// Detecta esse padrão e reconverte antes do JSON.parse.
function repairMojibake(text: string): string {
  if (!/[ÂÃ][-¿]/.test(text)) return text;
  try {
    return Buffer.from(text, "latin1").toString("utf-8");
  } catch {
    return text;
  }
}

export class LyceumSessionExpiredError extends Error {
  constructor() {
    super("Sessão do Lyceum expirada — reconecte em Configurações.");
    this.name = "LyceumSessionExpiredError";
  }
}

export class LyceumApiClient {
  constructor(
    private readonly tenant: string,
    private readonly sessionId: string,
    private readonly userDataCookie: string,
    private readonly ra: string,
    private readonly internalId: string
  ) {}

  async get<T>(path: string, transacao: string): Promise<T> {
    const base = baseUrl(this.tenant);
    const url = `${base}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Cookie: `JSESSIONID=${this.sessionId}; user-data=${this.userDataCookie}`,
          Accept: "application/json, text/plain, */*",
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${base}/AOnline3/`,
          "x-lyceum-transacao": `${base}/AOnline3/${transacao}`,
          "x-lyceum-usuario": `aluno: ${this.ra}`,
        },
        redirect: "manual",
      });
    } catch (error) {
      throw new Error(`Falha de rede ao chamar ${url}`, { cause: error });
    }

    if (res.status === 302 || res.status === 301 || res.status === 401) {
      markLyceumSessionInvalid();
      throw new LyceumSessionExpiredError();
    }
    if (!res.ok) {
      let body = "";
      try {
        body = await res.text();
      } catch {
        // ignora
      }
      throw new Error(`HTTP ${res.status} em ${path}${body ? ` — ${body.substring(0, 200)}` : ""}`);
    }

    markLyceumSessionValid();
    const text = await res.text();
    return JSON.parse(repairMojibake(text)) as T;
  }

  getRa(): string {
    return this.ra;
  }

  getInternalId(): string {
    return this.internalId;
  }

  getDadosAluno(): Promise<unknown> {
    return this.get(`/AOnline3/apix/custom/cod_aluno/${this.ra}/obtem_dados_neoassist`, "#/home");
  }

  getCabecalhoHistorico(): Promise<unknown> {
    return this.get(`/AOnline3/apix/matricula/aluno/${this.ra}/listarCabecalhoHistorico`, "#/home/historico");
  }

  getHistorico(): Promise<unknown> {
    return this.get(`/AOnline3/apix/matricula/aluno/${this.ra}/listarHistoricoSimplificado`, "#/home/historico");
  }

  // ponytail: API do Lyceum não tem filtro por período — boletim/disciplinas são sempre do semestre atual
  getBoletim(): Promise<unknown> {
    return this.get(
      `/AOnline3/apix/pessoas/${this.internalId}/alunos/${this.ra}/boletim`,
      "#/home/boletim/notas-e-faltas"
    );
  }

  getDisciplinasBoletim(): Promise<unknown> {
    return this.get(
      `/AOnline3/apix/pessoas/${this.internalId}/alunos/${this.ra}/disciplinasBoletim`,
      "#/home/boletim/notas-e-faltas"
    );
  }

  // ponytail: só a Frequencias (GET) foi confirmada por spec real (path + resposta).
  // Existe também um POST lista_detalhes_frequencia com dias exatos de falta
  // (faltasDiarias[].dataAula), mas o corpo da requisição não foi capturado — não dá
  // pra implementar sem adivinhar. Fica pra quando esse corpo aparecer.
  getFrequencias(): Promise<unknown> {
    return this.get(
      `/AOnline3/apix/api/rest/alunos/codAluno/${this.ra}/codPessoa/${this.internalId}/Frequencias?page=0&size=1000`,
      "#/home/boletim/notas-e-faltas"
    );
  }
}
