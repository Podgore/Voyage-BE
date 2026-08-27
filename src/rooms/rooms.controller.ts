import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRoomDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.roomsService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(@Body() dto: JoinRoomDto, @Req() req: AuthenticatedRequest) {
    return this.roomsService.join(dto, req.user.userId);
  }
}
