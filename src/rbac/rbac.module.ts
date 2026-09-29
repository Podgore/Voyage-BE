import { Module } from '@nestjs/common';
import { RoomMemberGuard } from './guards/room-member.guard';
import { RoomOwnerGuard } from './guards/room-owner.guard';

@Module({
  providers: [RoomMemberGuard, RoomOwnerGuard],
  exports: [RoomMemberGuard, RoomOwnerGuard],
})
export class RbacModule {}
