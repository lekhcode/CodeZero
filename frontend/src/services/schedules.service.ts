import type {
  CreateUserScheduleInput,
  ScheduleTemplate,
  UserSchedule,
} from "@/types/api.types";
import { api, unwrap } from "./api";

/** Backend wraps list payloads — unwrap to typed arrays/objects for React Query. */
export const schedulesService = {
  async listTemplates(): Promise<ScheduleTemplate[]> {
    const payload = await unwrap<{ templates: ScheduleTemplate[] }>(
      api.get("/api/v1/schedule-templates"),
    );
    return payload.templates;
  },

  async listUserSchedules(): Promise<UserSchedule[]> {
    const payload = await unwrap<{ schedules: UserSchedule[] }>(api.get("/api/v1/user-schedules"));
    return payload.schedules;
  },

  async createUserSchedule(body: CreateUserScheduleInput): Promise<UserSchedule> {
    const payload = await unwrap<{ schedule: UserSchedule }>(
      api.post("/api/v1/user-schedules", body),
    );
    return payload.schedule;
  },

  async toggleUserSchedule(id: string): Promise<Pick<UserSchedule, "id" | "active">> {
    return unwrap<Pick<UserSchedule, "id" | "active">>(
      api.patch(`/api/v1/user-schedules/${id}/toggle`),
    );
  },

  async deleteUserSchedule(id: string): Promise<{ deleted: boolean }> {
    return unwrap<{ deleted: boolean }>(api.delete(`/api/v1/user-schedules/${id}`));
  },
};
