export interface AuthenticatedRequest {
  user?: { userId: string; email: string };
  params: { roomId?: string };
}
