import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { TeachingModule } from './teaching/teaching.module';
import { envs } from './config/envs';
import { EventPublisherInterceptor, EVENT_EMITTER } from './common/events/event-publisher.interceptor';
import { SeedingController } from './seeding.controller';
import { CourseSection } from './teaching/course-sections/entities/course-section.entity';
import { Schedule } from './teaching/schedules/entities/schedule.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([CourseSection, Schedule]),
    ClientsModule.register([
      {
        name: EVENT_EMITTER,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
    TeachingModule,
  ],
  controllers: [SeedingController],
  providers: [EventPublisherInterceptor],
  exports: [EventPublisherInterceptor],
})
export class AppModule {}
