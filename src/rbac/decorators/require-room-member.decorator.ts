import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoomMemberGuard } from '../guards/room-member.guard';

export function RequireRoomMember() {
  return applyDecorators(UseGuards(JwtAuthGuard, RoomMemberGuard));
}
