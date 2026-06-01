import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../app.controller';
import { AppService } from '../../app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hola Mundo!'),
          },
        },
      ],
    }).compile();

    controller = module.get(AppController);
    appService = module.get(AppService);
  });

  it('getHello retorna Hola Mundo!', () => {
    expect(controller.getHello()).toBe('Hola Mundo!');
    expect(appService.getHello).toHaveBeenCalled();
  });
});
