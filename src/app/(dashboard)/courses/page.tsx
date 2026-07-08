import { listCourses, syncCourses } from "@/features/courses/server/courses";
import { syncCoursesAction } from "@/features/courses/server/actions";
import { CourseCard } from "@/features/courses/components/course-card";
import { Button } from "@/components/ui/button";
import { getCallbackRedirectUri } from "@/lib/redirect-uri";
import type { CourseState } from "@/features/courses/types/course";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (listCourses().length === 0) {
    await syncCourses(await getCallbackRedirectUri());
  }

  const states: CourseState[] = ["ACTIVE", "ARCHIVED"];
  const [active, archived] = states.map((state) => listCourses({ state, query: q }));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Turmas
        </h1>
        <form action={syncCoursesAction}>
          <Button type="submit" variant="outline" size="sm">
            Sincronizar
          </Button>
        </form>
      </div>

      <form className="flex flex-col gap-1.5">
        <input
          name="q"
          type="text"
          defaultValue={q}
          placeholder="Buscar por nome"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        />
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Ativas ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma ativa.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <details className="flex flex-col gap-3">
        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
          Arquivadas ({archived.length})
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          {archived.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </details>
    </>
  );
}
