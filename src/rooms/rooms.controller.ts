import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { RoomOwnerGuard } from '../rbac/guards/room-owner.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.roomsService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @Delete(':roomId/remove-member')
  removeMember(
    @Param('roomId') roomId: string,
    @Body() dto: RemoveMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomsService.removeMember(
      roomId,
      req.user.userId,
      dto.targetUserId,
    );
  }

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Post(':roomId/leave')
  leaveRoom(@Param('roomId') roomId: string, @Req() req: AuthenticatedRequest) {
    return this.roomsService.leaveRoom(roomId, req.user.userId);
  }
}
