export function isOwner(
  resourceCoachId: string,
  activeCoachId: string | undefined | null,
): boolean {
  return !!activeCoachId && resourceCoachId === activeCoachId;
}
