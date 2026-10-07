import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from './notes.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('NotesService', () => {
  let service: NotesService;
  const prisma = {
    roomMember: { findFirst: jest.fn() },
    widget: { findFirst: jest.fn(), create: jest.fn() },
    note: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<NotesService>(NotesService);
  });

  it('creates a note for an active room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });
    prisma.widget.findFirst.mockResolvedValue({ id: 'notes-widget-1' });
    const note = {
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Remember to confirm the venue',
      createdAt: new Date('2026-10-04T10:00:00.000Z'),
    };
    prisma.note.create.mockResolvedValue(note);

    await expect(
      service.createNote('room-1', 'user-1', {
        text: 'Remember to confirm the venue',
      }),
    ).resolves.toEqual({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Remember to confirm the venue',
      createdAt: '2026-10-04T10:00:00.000Z',
      author: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });

    expect(prisma.note.create).toHaveBeenCalledWith({
      data: {
        widgetId: 'notes-widget-1',
        roomMemberId: 'member-1',
        text: 'Remember to confirm the venue',
      },
    });
  });

  it('creates a notes widget if the room does not have one', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });
    prisma.widget.findFirst.mockResolvedValue(null);
    prisma.widget.create.mockResolvedValue({ id: 'notes-widget-1' });
    prisma.note.create.mockResolvedValue({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Pack the passports',
      createdAt: new Date('2026-10-04T10:05:00.000Z'),
    });

    await service.createNote('room-1', 'user-1', {
      text: 'Pack the passports',
    });

    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: { roomId: 'room-1', type: WidgetType.NOTES, name: 'Notes' },
    });
  });

  it('rejects an inactive or missing room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.createNote('room-1', 'user-1', { text: 'Bring the laptop' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists room notes chronologically with their authors, including former members', async () => {
    const createdAt = new Date('2026-10-04T10:00:00.000Z');
    prisma.note.findMany.mockResolvedValue([
      {
        id: 'note-1',
        roomMemberId: 'member-1',
        text: 'Confirm the venue',
        createdAt,
        roomMember: {
          leftAt: new Date('2026-10-03T10:00:00.000Z'),
          user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        },
      },
    ]);

    await expect(service.findNotes('room-1')).resolves.toEqual([
      {
        id: 'note-1',
        roomMemberId: 'member-1',
        text: 'Confirm the venue',
        createdAt: '2026-10-04T10:00:00.000Z',
        author: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      },
    ]);

    expect(prisma.note.findMany).toHaveBeenCalledWith({
      where: { widget: { roomId: 'room-1', type: WidgetType.NOTES } },
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
  });

  it('updates a note only when the authenticated user is the author', async () => {
    prisma.note.findUnique.mockResolvedValue({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Old text',
      createdAt: new Date('2026-10-04T10:00:00.000Z'),
      roomMember: {
        userId: 'user-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      },
      widget: { roomId: 'room-1' },
    });
    prisma.note.update.mockResolvedValue({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Updated text',
      createdAt: new Date('2026-10-04T10:00:00.000Z'),
      roomMember: {
        userId: 'user-1',
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      },
    });

    await expect(
      service.updateNote('room-1', 'note-1', 'user-1', {
        text: 'Updated text',
      }),
    ).resolves.toEqual({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Updated text',
      createdAt: '2026-10-04T10:00:00.000Z',
      author: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });

    expect(prisma.note.update).toHaveBeenCalledWith({
      where: { id: 'note-1' },
      data: { text: 'Updated text' },
    });
  });

  it("forbids editing someone else's note even if the user is the room owner", async () => {
    prisma.note.findUnique.mockResolvedValue({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Other author text',
      createdAt: new Date('2026-10-04T10:00:00.000Z'),
      roomMember: {
        userId: 'user-2',
        user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      },
      widget: { roomId: 'room-1' },
    });

    await expect(
      service.updateNote('room-1', 'note-1', 'user-1', {
        text: "I am editing someone else's note",
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
