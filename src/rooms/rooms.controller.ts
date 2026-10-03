import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { RoomOwnerGuard } from '../rbac/guards/room-owner.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomResponseDto } from './dto/update-room-response.dto';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.roomsService.findAll(req.user.userId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':roomId/members')
  findMembers(
    @Param('roomId') roomId: string,
    @Query('includeDeparted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeparted: boolean,
  ) {
    return this.roomsService.findMembers(roomId, includeDeparted);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomsService.create(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  joinRoom(@Body() dto: JoinRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomsService.joinRoom(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Get(':roomId')
  getRoomHub(
    @Param('roomId') roomId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.roomsService.getRoomHub(roomId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @Put(':roomId')
  updateRoom(
    @Param('roomId') roomId: string,
    @Body() request: UpdateRoomDto,
  ): Promise<UpdateRoomResponseDto> {
    return this.roomsService.updateRoom(roomId, {
      name: request.name,
      regenerateInviteCode: request.regenerateInviteCode,
    });
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

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @Delete(':roomId')
  deleteRoom(@Param('roomId') roomId: string) {
    return this.roomsService.deleteRoom(roomId);
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
