import { Injectable, NotFoundException } from '@nestjs/common';
import { WidgetType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { createWidgetConnection } from '../widgets/utils/widget-factory.util';
import { CreateNoteAttachmentDto } from './dto/create-note-attachment.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteAttachmentResponseDto } from './dto/note-attachment-response.dto';
import { NoteResponseDto } from './dto/note-response.dto';

const NOTE_WIDGET_TYPE = WidgetType.NOTES;

type UploadedNoteFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createNote(
    roomId: string,
    userId: string,
    dto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    const creator = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    let widget = await this.prisma.widget.findFirst({
      where: { roomId, type: NOTE_WIDGET_TYPE },
    });

    if (!widget) {
      widget = await this.prisma.widget.create({
        data: createWidgetConnection(roomId, NOTE_WIDGET_TYPE),
      });
    }

    const note = await this.prisma.note.create({
      data: {
        widgetId: widget.id,
        roomMemberId: creator.id,
        text: dto.text ?? '',
      },
    });

    const response: NoteResponseDto = {
      id: note.id,
      roomMemberId: note.roomMemberId,
      text: note.text ?? null,
      createdAt: note.createdAt.toISOString(),
      attachments: [],
    };

    return response;
  }

  async createNoteAttachment(
    roomId: string,
    userId: string,
    noteId: string,
    dto: CreateNoteAttachmentDto,
  ): Promise<NoteAttachmentResponseDto> {
    const creator = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        widget: { roomId },
      },
      select: {
        id: true,
        roomMemberId: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found in this room');
    }

    const attachment = await this.prisma.noteAttachment.create({
      data: {
        noteId: note.id,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
        storageKey: dto.storageKey,
        url: dto.url,
      },
    });

    const response: NoteAttachmentResponseDto = {
      id: attachment.id,
      noteId: attachment.noteId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url,
      createdAt: attachment.createdAt.toISOString(),
    };

    return response;
  }

  async uploadNoteAttachment(
    roomId: string,
    userId: string,
    noteId: string,
    file: UploadedNoteFile,
  ): Promise<NoteAttachmentResponseDto> {
    const creator = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        widget: { roomId },
      },
      select: {
        id: true,
        roomMemberId: true,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found in this room');
    }

    const uploaded = await this.storageService.uploadFile(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      `notes/${noteId}`,
    );

    return this.createNoteAttachment(roomId, userId, noteId, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: uploaded.key,
      url: uploaded.url,
    });
  }
}
