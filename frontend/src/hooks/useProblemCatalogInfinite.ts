import { useInfiniteQuery } from "@tanstack/react-query";
import { problemsService } from "@/services/problems.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { ProblemCatalogFilters, ProblemCatalogItem } from "@/types/api.types";

export type CatalogFilterState = Omit<ProblemCatalogFilters, "page" | "limit">;

export function useProblemCatalogInfinite(
  filters: CatalogFilterState,
  pageSize: number,
) {
  const shuffled = filters.shuffle === true;

  const query = useInfiniteQuery({
    queryKey: queryKeys.problemCatalog({ ...filters, infinite: true, pageSize }),
    queryFn: ({ pageParam }) =>
      problemsService.list({
        ...filters,
        page: pageParam,
        limit: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      shuffled ? undefined : last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: shuffled ? 0 : 60_000,
    gcTime: shuffled ? 0 : 5 * 60_000,
    refetchOnMount: shuffled ? "always" : true,
  });

  const items: ProblemCatalogItem[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  const total = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    items,
    total,
  };
}
