import { Module } from '@nestjs/common';
import { RoomMemberGuard } from './guards/room-member.guard';
import { RoomOwnerGuard } from './guards/room-owner.guard';
import { TestThrottleController } from './test-throttle.controller';

@Module({
  providers: [RoomMemberGuard, RoomOwnerGuard],
  exports: [RoomMemberGuard, RoomOwnerGuard],
  controllers: [TestThrottleController],
})
export class RbacModule {}
