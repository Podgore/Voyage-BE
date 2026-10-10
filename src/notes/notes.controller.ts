import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
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
import { NoteAttachmentResponseDto } from './dto/note-attachment-response.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { NotesService } from './notes.service';

type UploadedNoteFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

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
  @UseInterceptors(FileInterceptor('file'))
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
