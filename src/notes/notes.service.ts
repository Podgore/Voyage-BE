import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WidgetType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { createWidgetConnection } from '../widgets/utils/widget-factory.util';
import { CreateNoteDto } from './dto/create-note.dto';
import { FindNotesQueryDto } from './dto/find-notes-query.dto';
import { NoteAttachmentDownloadUrlResponseDto } from './dto/note-attachment-download-url-response.dto';
import { NoteAttachmentResponseDto } from './dto/note-attachment-response.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import type { UploadedNoteFile } from './types/uploaded-note-file.type';

const NOTE_WIDGET_TYPE = WidgetType.NOTES;

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

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
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    return this.prisma.$transaction(async (transaction) => {
      const widget = await transaction.widget.upsert({
        where: { roomId_type: { roomId, type: NOTE_WIDGET_TYPE } },
        create: createWidgetConnection(roomId, NOTE_WIDGET_TYPE),
        update: {},
      });

      const note = await transaction.note.create({
        data: {
          widgetId: widget.id,
          roomMemberId: creator.id,
          text: dto.text ?? '',
        },
      });

      return NoteResponseDto.fromValues(note, creator.user);
    });
  }

  async uploadNoteAttachment(
    roomId: string,
    userId: string,
    noteId: string,
    file: UploadedNoteFile,
  ): Promise<NoteAttachmentResponseDto> {
    const note = await this.findNoteForAuthor(roomId, noteId, userId);

    const uploaded = await this.storageService.uploadFile(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      `notes/${noteId}`,
    );

    try {
      const attachment = await this.prisma.noteAttachment.create({
        data: {
          noteId: note.id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey: uploaded.key,
        },
      });

      return NoteAttachmentResponseDto.fromEntity(attachment);
    } catch (error: unknown) {
      await this.cleanupStorageFile(uploaded.key, noteId, 'uploaded');
      throw error;
    }
  }

  async replaceNoteAttachment(
    roomId: string,
    userId: string,
    noteId: string,
    attachmentId: string,
    file: UploadedNoteFile,
  ): Promise<NoteAttachmentResponseDto> {
    const note = await this.findNoteForAuthor(roomId, noteId, userId);
    const attachment = await this.prisma.noteAttachment.findFirst({
      where: {
        id: attachmentId,
        noteId: note.id,
        note: { widget: { roomId } },
      },
      select: { id: true, storageKey: true, createdAt: true },
    });

    if (!attachment) {
      throw new NotFoundException('Note attachment not found in this room');
    }

    const uploaded = await this.storageService.uploadFile(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      `notes/${note.id}`,
    );

    try {
      const updateResult = await this.prisma.noteAttachment.updateMany({
        where: {
          id: attachment.id,
          noteId: note.id,
          storageKey: attachment.storageKey,
        },
        data: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey: uploaded.key,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException('Note attachment changed concurrently');
      }
    } catch (error: unknown) {
      await this.cleanupStorageFile(uploaded.key, note.id, 'replacement');
      throw error;
    }

    await this.cleanupStorageFile(attachment.storageKey, note.id, 'replaced');
    return NoteAttachmentResponseDto.fromEntity({
      id: attachment.id,
      noteId: note.id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: attachment.createdAt,
    });
  }

  async deleteNoteAttachment(
    roomId: string,
    userId: string,
    noteId: string,
    attachmentId: string,
  ): Promise<void> {
    const note = await this.findNoteForAuthor(roomId, noteId, userId);
    const attachment = await this.prisma.noteAttachment.findFirst({
      where: {
        id: attachmentId,
        noteId: note.id,
        note: { widget: { roomId } },
      },
      select: { id: true, storageKey: true },
    });

    if (!attachment) {
      throw new NotFoundException('Note attachment not found in this room');
    }

    const deleteResult = await this.prisma.noteAttachment.deleteMany({
      where: {
        id: attachment.id,
        noteId: note.id,
        storageKey: attachment.storageKey,
      },
    });

    if (deleteResult.count !== 1) {
      throw new ConflictException('Note attachment changed concurrently');
    }

    await this.cleanupStorageFile(attachment.storageKey, note.id, 'deleted');
  }

  async getAttachmentDownloadUrl(
    roomId: string,
    userId: string,
    noteId: string,
    attachmentId: string,
  ): Promise<NoteAttachmentDownloadUrlResponseDto> {
    const member = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    const attachment = await this.prisma.noteAttachment.findFirst({
      where: {
        id: attachmentId,
        noteId,
        note: { widget: { roomId } },
      },
      select: { storageKey: true, fileName: true, mimeType: true },
    });

    if (!attachment) {
      throw new NotFoundException('Note attachment not found in this room');
    }

    return this.storageService.createDownloadUrl(
      attachment.storageKey,
      attachment.fileName,
      attachment.mimeType,
    );
  }

  async findNotes(
    roomId: string,
    query: FindNotesQueryDto = {},
  ): Promise<NoteResponseDto[]> {
    if (
      query.createdAfter &&
      query.createdBefore &&
      new Date(query.createdAfter) > new Date(query.createdBefore)
    ) {
      throw new BadRequestException(
        'createdAfter must be earlier than or equal to createdBefore',
      );
    }

    const notes = await this.prisma.note.findMany({
      where: {
        widget: { roomId, type: NOTE_WIDGET_TYPE },
        ...(query.roomMemberId && { roomMemberId: query.roomMemberId }),
        ...(query.search && {
          text: { contains: query.search, mode: 'insensitive' },
        }),
        ...((query.createdAfter || query.createdBefore) && {
          createdAt: {
            ...(query.createdAfter && {
              gte: new Date(query.createdAfter),
            }),
            ...(query.createdBefore && {
              lte: new Date(query.createdBefore),
            }),
          },
        }),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        roomMemberId: true,
        text: true,
        createdAt: true,
        roomMember: {
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        attachments: {
          select: {
            id: true,
            noteId: true,
            fileName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    return notes.map((note) =>
      NoteResponseDto.fromValues(
        note,
        note.roomMember.user,
        note.attachments.map((attachment) =>
          NoteAttachmentResponseDto.fromEntity(attachment),
        ),
      ),
    );
  }

  async updateNote(
    roomId: string,
    noteId: string,
    userId: string,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        roomMemberId: true,
        text: true,
        createdAt: true,
        roomMember: {
          select: {
            userId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        widget: { select: { roomId: true } },
        attachments: {
          select: {
            id: true,
            noteId: true,
            fileName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!note || note.widget.roomId !== roomId) {
      throw new NotFoundException(ERROR_MESSAGES.NOTE_NOT_FOUND);
    }

    if (note.roomMember.userId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.NOTE_EDIT_FORBIDDEN);
    }

    const updatedNote = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        text: dto.text ?? note.text,
      },
    });

    return NoteResponseDto.fromValues(
      updatedNote,
      note.roomMember.user,
      note.attachments.map((attachment) =>
        NoteAttachmentResponseDto.fromEntity(attachment),
      ),
    );
  }

  private async findNoteForAuthor(
    roomId: string,
    noteId: string,
    userId: string,
  ): Promise<{ id: string }> {
    const member = await this.prisma.roomMember.findFirst({
      where: { roomId, userId, leftAt: null },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    const note = await this.prisma.note.findFirst({
      where: { id: noteId, widget: { roomId } },
      select: {
        id: true,
        roomMember: { select: { userId: true } },
      },
    });

    if (!note) {
      throw new NotFoundException(ERROR_MESSAGES.NOTE_NOT_FOUND);
    }

    if (note.roomMember.userId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.NOTE_EDIT_FORBIDDEN);
    }

    return { id: note.id };
  }

  private async cleanupStorageFile(
    storageKey: string,
    noteId: string,
    action: string,
  ): Promise<void> {
    try {
      await this.storageService.deleteFile(storageKey);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to clean up ${action} file for note ${noteId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
