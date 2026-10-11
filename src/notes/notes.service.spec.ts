import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotesService } from './notes.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('NotesService', () => {
  let service: NotesService;
  const transaction = {
    widget: { upsert: jest.fn() },
    note: { create: jest.fn() },
  };
  const prisma = {
    roomMember: { findFirst: jest.fn() },
    $transaction: jest.fn(
      async <T>(callback: (tx: typeof transaction) => Promise<T>) =>
        callback(transaction),
    ),
    widget: { findFirst: jest.fn(), create: jest.fn() },
    note: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    noteAttachment: { create: jest.fn(), findFirst: jest.fn() },
  };
  const storageService = {
    uploadFile: jest.fn(),
    createDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();
    service = module.get<NotesService>(NotesService);
  });

  it('creates a note for an active room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });
    transaction.widget.upsert.mockResolvedValue({ id: 'notes-widget-1' });
    const note = {
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Remember to confirm the venue',
      createdAt: new Date('2026-10-04T10:00:00.000Z'),
    };
    transaction.note.create.mockResolvedValue(note);

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
      attachments: [],
    });

    expect(transaction.note.create).toHaveBeenCalledWith({
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
    transaction.widget.upsert.mockResolvedValue({ id: 'notes-widget-1' });
    transaction.note.create.mockResolvedValue({
      id: 'note-1',
      roomMemberId: 'member-1',
      text: 'Pack the passports',
      createdAt: new Date('2026-10-04T10:05:00.000Z'),
    });

    await service.createNote('room-1', 'user-1', {
      text: 'Pack the passports',
    });

    expect(transaction.widget.upsert).toHaveBeenCalledWith({
      where: { roomId_type: { roomId: 'room-1', type: WidgetType.NOTES } },
      create: { roomId: 'room-1', type: WidgetType.NOTES, name: 'Notes' },
      update: {},
    });
  });

  it('allows creating a note without text when an attachment will be added later', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-1',
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    });
    transaction.widget.upsert.mockResolvedValue({ id: 'notes-widget-1' });
    transaction.note.create.mockResolvedValue({
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
      author: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
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
      createdAt: new Date('2026-10-05T12:30:00.000Z'),
    });

    await expect(
      service.createNoteAttachment('room-1', 'user-1', 'note-2', {
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        storageKey: 'notes/note-2/invoice.pdf',
      }),
    ).resolves.toEqual({
      id: 'attachment-1',
      noteId: 'note-2',
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      createdAt: '2026-10-05T12:30:00.000Z',
    });
  });

  it('rejects an inactive or missing room member', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.createNote('room-1', 'user-1', { text: 'Bring the laptop' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a signed URL only for an attachment belonging to the room note', async () => {
    const signedUrl = {
      url: 'https://storage.local/signed-file',
      expiresAt: '2026-10-11T12:05:00.000Z',
    };
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.noteAttachment.findFirst.mockResolvedValue({
      storageKey: 'notes/note-1/file.pdf',
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
    });
    storageService.createDownloadUrl.mockResolvedValue(signedUrl);

    await expect(
      service.getAttachmentDownloadUrl(
        'room-1',
        'user-1',
        'note-1',
        'attachment-1',
      ),
    ).resolves.toEqual(signedUrl);

    expect(prisma.noteAttachment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'attachment-1',
        noteId: 'note-1',
        note: { widget: { roomId: 'room-1' } },
      },
      select: { storageKey: true, fileName: true, mimeType: true },
    });
    expect(storageService.createDownloadUrl).toHaveBeenCalledWith(
      'notes/note-1/file.pdf',
      'file.pdf',
      'application/pdf',
    );
  });

  it('does not sign a URL when the attachment is not in the requested room', async () => {
    prisma.roomMember.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.noteAttachment.findFirst.mockResolvedValue(null);

    await expect(
      service.getAttachmentDownloadUrl(
        'room-1',
        'user-1',
        'note-1',
        'attachment-1',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(storageService.createDownloadUrl).not.toHaveBeenCalled();
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
        attachments: [],
      },
    ]);

    await expect(service.findNotes('room-1')).resolves.toEqual([
      {
        id: 'note-1',
        roomMemberId: 'member-1',
        text: 'Confirm the venue',
        createdAt: '2026-10-04T10:00:00.000Z',
        author: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        attachments: [],
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
  });

  it('filters notes by text, author, and date range while retaining chronological order', async () => {
    prisma.note.findMany.mockResolvedValue([]);

    await service.findNotes('room-1', {
      search: 'venue',
      roomMemberId: 'member-1',
      createdAfter: '2026-10-01T00:00:00.000Z',
      createdBefore: '2026-10-31T23:59:59.999Z',
    });

    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          widget: { roomId: 'room-1', type: WidgetType.NOTES },
          roomMemberId: 'member-1',
          text: { contains: 'venue', mode: 'insensitive' },
          createdAt: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-31T23:59:59.999Z'),
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('rejects an inverted note creation date range', async () => {
    await expect(
      service.findNotes('room-1', {
        createdAfter: '2026-10-02T00:00:00.000Z',
        createdBefore: '2026-10-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(
      'createdAfter must be earlier than or equal to createdBefore',
    );
  });
});
