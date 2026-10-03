import { Injectable, NotFoundException } from '@nestjs/common';
import { WidgetType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

const NOTE_WIDGET_TYPE = WidgetType.NOTES;
const NOTE_WIDGET_NAME = 'Notes';

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
    });

    if (!creator) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_ACTIVE_ROOM_MEMBER);
    }

    let widget = await this.prisma.widget.findFirst({
      where: { roomId, type: NOTE_WIDGET_TYPE },
    });

    if (!widget) {
      widget = await this.prisma.widget.create({
        data: { roomId, type: NOTE_WIDGET_TYPE, name: NOTE_WIDGET_NAME },
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
    };
  }
}
