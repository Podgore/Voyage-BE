import {
  Controller,
  Post,
  Body,
  DefaultValuePipe,
  UseGuards,
  Req,
  Get,
  Param,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.roomsService.findAll(userId);
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
    const userId = req.user.userId;
    return this.roomsService.create(dto, userId);
  }
}
