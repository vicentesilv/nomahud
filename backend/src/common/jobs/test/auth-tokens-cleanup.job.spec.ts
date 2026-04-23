import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthToken } from '../../../auth/entitys/auth-token.entity';
import { AuthTokensCleanupJob } from '../auth-tokens-cleanup.job';

describe('AuthTokensCleanupJob', () => {
    let job: AuthTokensCleanupJob;
    let authTokenRepository: {
        delete: jest.Mock;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthTokensCleanupJob,
                {
                    provide: getRepositoryToken(AuthToken),
                    useValue: {
                        delete: jest.fn(),
                    },
                },
            ],
        }).compile();

        job = module.get<AuthTokensCleanupJob>(AuthTokensCleanupJob);
        authTokenRepository = module.get(getRepositoryToken(AuthToken));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe estar definido', () => {
        expect(job).toBeDefined();
    });

    it('handleCleanupExpiredTokens: elimina tokens expirados', async () => {
        authTokenRepository.delete.mockResolvedValue({ affected: 5 });

        await job.handleCleanupExpiredTokens();

        expect(authTokenRepository.delete).toHaveBeenCalledWith(
            expect.objectContaining({
                expiraEn: expect.any(Object),
            }),
        );
    });
});