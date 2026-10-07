import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WidgetType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { createWidgetConnection } from '../widgets/utils/widget-factory.util';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

const NOTE_WIDGET_TYPE = WidgetType.NOTES;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

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
        text: dto.text,
      },
    });

    return {
      id: note.id,
      roomMemberId: note.roomMemberId,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      author: creator.user,
    } satisfies NoteResponseDto;
  }

  async findNotes(roomId: string): Promise<NoteResponseDto[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        widget: { roomId, type: NOTE_WIDGET_TYPE },
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
      },
    });

    return notes.map((note) => ({
      id: note.id,
      roomMemberId: note.roomMemberId,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      author: note.roomMember.user,
    }));
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

    return {
      id: updatedNote.id,
      roomMemberId: updatedNote.roomMemberId,
      text: updatedNote.text,
      createdAt: updatedNote.createdAt.toISOString(),
      author: note.roomMember.user,
    } satisfies NoteResponseDto;
  }
}
