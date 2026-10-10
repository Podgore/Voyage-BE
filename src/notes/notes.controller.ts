import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { CreateNoteAttachmentDto } from './dto/create-note-attachment.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteAttachmentResponseDto } from './dto/note-attachment-response.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { NotesService } from './notes.service';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('rooms/:roomId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Post()
  create(
    @Param('roomId') roomId: string,
    @Body() dto: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.createNote(roomId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Post(':noteId/attachments')
  createAttachment(
    @Param('roomId') roomId: string,
    @Param('noteId') noteId: string,
    @Body() dto: CreateNoteAttachmentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<NoteAttachmentResponseDto> {
    return this.notesService.createNoteAttachment(
      roomId,
      req.user.userId,
      noteId,
      dto,
    );
  }
}
