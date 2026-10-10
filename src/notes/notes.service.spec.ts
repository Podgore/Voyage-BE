import { NotFoundException } from '@nestjs/common';
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
    note: { create: jest.fn(), findFirst: jest.fn() },
    noteAttachment: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<NotesService>(NotesService);
  });

  it('creates a note for an active room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
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
      attachments: [],
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
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
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

  it('allows creating a note without text when an attachment will be added later', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.widget.findFirst.mockResolvedValue({ id: 'notes-widget-1' });
    prisma.note.create.mockResolvedValue({
      id: 'note-2',
      roomMemberId: 'member-1',
      text: '',
      createdAt: new Date('2026-10-05T12:00:00.000Z'),
    });

    await expect(
      service.createNote('room-1', 'user-1', { text: '' }),
    ).resolves.toEqual({
      id: 'note-2',
      roomMemberId: 'member-1',
      text: '',
      createdAt: '2026-10-05T12:00:00.000Z',
      attachments: [],
    });
  });

  it('creates note attachment metadata for an existing note', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.note.findFirst.mockResolvedValue({
      id: 'note-2',
      roomMemberId: 'member-1',
      text: '',
      widget: { roomId: 'room-1' },
    });
    prisma.noteAttachment.create.mockResolvedValue({
      id: 'attachment-1',
      noteId: 'note-2',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      url: 'https://storage.local/invoice.pdf',
      createdAt: new Date('2026-10-05T12:30:00.000Z'),
    });

    await expect(
      service.createNoteAttachment('room-1', 'user-1', 'note-2', {
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        url: 'https://storage.local/invoice.pdf',
        storageKey: 'notes/note-2/invoice.pdf',
      }),
    ).resolves.toEqual({
      id: 'attachment-1',
      noteId: 'note-2',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      url: 'https://storage.local/invoice.pdf',
      createdAt: '2026-10-05T12:30:00.000Z',
    });
  });

  it('rejects an inactive or missing room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.createNote('room-1', 'user-1', { text: 'Bring the laptop' }),
    ).rejects.toThrow(NotFoundException);
  });
});
