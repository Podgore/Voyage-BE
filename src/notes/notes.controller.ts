import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { RoomMemberGuard } from '../rbac/guards/room-member.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { FindNotesQueryDto } from './dto/find-notes-query.dto';
import { NoteAttachmentDownloadUrlResponseDto } from './dto/note-attachment-download-url-response.dto';
import { NoteAttachmentResponseDto } from './dto/note-attachment-response.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';
import type { UploadedNoteFile } from './types/uploaded-note-file.type';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('rooms/:roomId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Get()
  findNotes(
    @Param('roomId') roomId: string,
    @Query() query: FindNotesQueryDto,
  ): Promise<NoteResponseDto[]> {
    return this.notesService.findNotes(roomId, query);
  }

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
  @Put(':noteId')
  update(
    @Param('roomId') roomId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.updateNote(roomId, noteId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @Get(':noteId/attachments/:attachmentId/url')
  getAttachmentDownloadUrl(
    @Param('roomId') roomId: string,
    @Param('noteId') noteId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<NoteAttachmentDownloadUrlResponseDto> {
    return this.notesService.getAttachmentDownloadUrl(
      roomId,
      req.user.userId,
      noteId,
      attachmentId,
    );
  }

  @UseGuards(JwtAuthGuard, RoomMemberGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @Post(':noteId/attachments')
  createAttachment(
    @Param('roomId') roomId: string,
    @Param('noteId') noteId: string,
    @UploadedFile() file: UploadedNoteFile | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<NoteAttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.notesService.uploadNoteAttachment(
      roomId,
      req.user.userId,
      noteId,
      file,
    );
  }
}
