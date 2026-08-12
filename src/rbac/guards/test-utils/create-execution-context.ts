import { ExecutionContext } from '@nestjs/common';

export function createExecutionContext(
  user?: { userId: string },
  roomId?: string,
): ExecutionContext {
  const request = {
    user,
    params: { roomId },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
