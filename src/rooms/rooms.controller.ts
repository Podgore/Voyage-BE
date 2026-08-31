import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomOwnerGuard } from '../rbac/guards/room-owner.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

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
  @Post(':roomId/transfer-ownership')
  transferOwnership(
    @Param('roomId') roomId: string,
    @Body() dto: TransferOwnershipDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomsService.transferOwnership(
      roomId,
      req.user.userId,
      dto.targetUserId,
    );
  }
}
