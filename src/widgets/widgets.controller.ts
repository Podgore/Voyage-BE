import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { RoomOwnerGuard } from '../rbac/guards/room-owner.guard';
import { ConnectWidgetDto } from './dto/connect-widget.dto';
import { ConnectWidgetResponseDto } from './dto/connect-widget-response.dto';
import { DisconnectWidgetResponseDto } from './dto/disconnect-widget-response.dto';
import { WidgetResponseDto } from './dto/widget-response.dto';
import { WidgetsService } from './widgets.service';

@ApiTags('Widgets')
@ApiBearerAuth()
@Controller('rooms/:roomId/widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Get()
  findWidgets(@Param('roomId') roomId: string): Promise<WidgetResponseDto[]> {
    return this.widgetsService.findWidgets(roomId);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @ApiParam({ name: 'roomId', type: String, required: true })
  @Post()
  connectWidget(
    @Param('roomId') roomId: string,
    @Body() dto: ConnectWidgetDto,
  ): Promise<ConnectWidgetResponseDto> {
    return this.widgetsService.connectWidget(roomId, dto);
  }

  @UseGuards(JwtAuthGuard, RoomOwnerGuard)
  @ApiParam({ name: 'roomId', type: String, required: true })
  @ApiParam({ name: 'widgetId', type: String, required: true })
  @Delete(':widgetId')
  disconnectWidget(
    @Param('roomId') roomId: string,
    @Param('widgetId') widgetId: string,
  ): Promise<DisconnectWidgetResponseDto> {
    return this.widgetsService.disconnectWidget(roomId, widgetId);
  }
}
