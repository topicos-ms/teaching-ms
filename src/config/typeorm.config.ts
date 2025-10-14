import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CourseSection } from '../teaching/course-sections/entities/course-section.entity';
import { Schedule } from '../teaching/schedules/entities/schedule.entity';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const synchronize =
    (configService.get<string>('DB_SYNCHRONIZE', 'true') ?? 'true').toLowerCase() ===
    'true';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
    username: configService.get<string>('DB_USER', 'postgres'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME', 'topicos_db'),
    entities: [CourseSection, Schedule],
    synchronize,
    logging:
      configService.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
  };
};
