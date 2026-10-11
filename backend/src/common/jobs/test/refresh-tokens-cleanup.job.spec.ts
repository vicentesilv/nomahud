import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokensCleanupJob } from '../refresh-tokens-cleanup.job';
import { RefreshToken } from '../../../auth/entitys/refresh-token.entity';

describe('RefreshTokensCleanupJob', () => {
  let job: RefreshTokensCleanupJob;
  let repo: { delete: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensCleanupJob,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: { delete: jest.fn() },
        },
      ],
    }).compile();

    job = module.get(RefreshTokensCleanupJob);
    repo = module.get(getRepositoryToken(RefreshToken));
  });

  it('elimina refresh tokens expirados', async () => {
    repo.delete.mockResolvedValue({ affected: 12 });

    await job.handleCleanupExpiredRefreshTokens();

    expect(repo.delete).toHaveBeenCalledWith({
      expiraEn: expect.objectContaining({}) as never,
    });
  });

  it('no falla si no hay nada que eliminar', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    await expect(job.handleCleanupExpiredRefreshTokens()).resolves.toBeUndefined();
  });
});
