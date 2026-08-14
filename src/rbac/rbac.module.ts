import { Module } from '@nestjs/common';
import { RoomMemberGuard } from './guards/room-member.guard';
import { RoomOwnerGuard } from './guards/room-owner.guard';
import { RoomMembershipIntegrityService } from './services/room-membership-integrity.service';

@Module({
  providers: [RoomMemberGuard, RoomOwnerGuard, RoomMembershipIntegrityService],
  exports: [RoomMemberGuard, RoomOwnerGuard, RoomMembershipIntegrityService],
})
export class RbacModule {}
