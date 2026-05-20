import { api } from "@services/api";

export type ReportTargetType = "USER" | "DISHLIST" | "RECIPE";
export type ReportReason = "INAPPROPRIATE" | "HARASSMENT" | "SPAM" | "OTHER";

interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason?: ReportReason;
  details?: string;
}

export async function submitReport({
  targetType,
  targetId,
  reason = "INAPPROPRIATE",
  details,
}: SubmitReportInput) {
  const response = await api.post<{ reportId: string; status: string }>(
    "/reports",
    {
      targetType,
      targetId,
      reason,
      details,
    }
  );

  return response.data;
}
