import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { autoRevisionService } from "@/services/autoRevision.service";
import { autoRevisionKeyPrefix } from "@/hooks/queryKeys";

/** Marks smart auto-revision complete when leaving the problem page after "Revise now". */
export function AutoRevisionReturnMarker() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const revisionIdRef = useRef(searchParams.get("autoRevisionId"));

  useEffect(() => {
    const revisionId = revisionIdRef.current;
    if (!revisionId) return;

    return () => {
      void autoRevisionService.markRevised(revisionId).then(() => {
        void queryClient.invalidateQueries({ queryKey: autoRevisionKeyPrefix });
      });
    };
  }, [queryClient]);

  return null;
}
