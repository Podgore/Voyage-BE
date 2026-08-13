import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoomOwnerGuard } from '../guards/room-owner.guard';

export function RequireRoomOwner() {
  return applyDecorators(UseGuards(JwtAuthGuard, RoomOwnerGuard));
}
