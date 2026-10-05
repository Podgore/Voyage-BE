import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('NotesController', () => {
  let controller: NotesController;
  const notesService = { findNotes: jest.fn(), createNote: jest.fn() };

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

  it('lists notes for the requested room', async () => {
    const notes = [{ id: 'note-1', text: 'Confirm the venue' }];
    notesService.findNotes.mockResolvedValue(notes);

    await expect(controller.findNotes('room-1')).resolves.toBe(notes);

    expect(notesService.findNotes).toHaveBeenCalledWith('room-1');
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
});
