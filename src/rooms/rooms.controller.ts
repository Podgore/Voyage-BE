import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { RoomOwnerGuard } from '../rbac/guards/room-owner.guard';
import { ConnectWidgetDto } from './dto/connect-widget.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { DisconnectWidgetDto } from './dto/disconnect-widget.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { RoomWidgetDto } from './dto/room-widget-response.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
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
  @Get(':roomId/widgets')
  findWidgets(@Param('roomId') roomId: string): Promise<RoomWidgetDto[]> {
    return this.roomsService.findWidgets(roomId);
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
  @Patch(':roomId')
  updateRoom(@Param('roomId') roomId: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(roomId, dto);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @Post(':roomId/widgets')
  connectWidget(
    @Param('roomId') roomId: string,
    @Body() dto: ConnectWidgetDto,
  ): Promise<RoomWidgetDto> {
    return this.roomsService.connectWidget(roomId, dto);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @Delete(':roomId/widgets/:widgetId')
  disconnectWidget(
    @Param('roomId') roomId: string,
    @Param('widgetId') widgetId: string,
    @Body() dto: DisconnectWidgetDto,
  ): Promise<RoomWidgetDto> {
    return this.roomsService.disconnectWidget(roomId, widgetId, dto);
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
