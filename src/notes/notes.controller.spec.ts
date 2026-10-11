import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('NotesController', () => {
  let controller: NotesController;
  const notesService = {
    findNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    getAttachmentDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        { provide: NotesService, useValue: notesService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
  });

  it('lists notes with query filters for the requested room', async () => {
    const notes = [{ id: 'note-1', text: 'Confirm the venue' }];
    const query = { search: 'venue' };
    notesService.findNotes.mockResolvedValue(notes);

    await expect(controller.findNotes('room-1', query)).resolves.toBe(notes);

    expect(notesService.findNotes).toHaveBeenCalledWith('room-1', query);
  });

  it('creates a note for the authenticated room member', async () => {
    const dto = { text: 'Confirm the venue' };
    const note = { id: 'note-1', ...dto };
    notesService.createNote.mockResolvedValue(note);

    await expect(
      controller.create('room-1', dto, {
        user: { userId: 'user-1' },
      } as never),
    ).resolves.toBe(note);

    expect(notesService.createNote).toHaveBeenCalledWith(
      'room-1',
      'user-1',
      dto,
    );
  });

  it('updates a note for the authenticated author', async () => {
    const dto = { text: 'Updated venue details' };
    const note = { id: 'note-1', ...dto };
    notesService.updateNote.mockResolvedValue(note);

    await expect(
      controller.update('room-1', 'note-1', dto, {
        user: { userId: 'user-1' },
      } as never),
    ).resolves.toBe(note);

    expect(notesService.updateNote).toHaveBeenCalledWith(
      'room-1',
      'note-1',
      'user-1',
      dto,
    );
  });

  it('returns a signed attachment URL for the authenticated room member', async () => {
    const result = {
      url: 'https://storage.local/signed-file',
      expiresAt: '2026-10-11T12:05:00.000Z',
    };
    notesService.getAttachmentDownloadUrl.mockResolvedValue(result);
    const request = { user: { userId: 'user-1' } } as never;

    await expect(
      controller.getAttachmentDownloadUrl(
        'room-1',
        'note-1',
        'attachment-1',
        request,
      ),
    ).resolves.toBe(result);

    expect(notesService.getAttachmentDownloadUrl).toHaveBeenCalledWith(
      'room-1',
      'user-1',
      'note-1',
      'attachment-1',
    );
  });
});
