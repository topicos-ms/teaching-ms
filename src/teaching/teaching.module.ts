import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseSection } from './course-sections/entities/course-section.entity';
import { Schedule } from './schedules/entities/schedule.entity';
import { CourseSectionsService } from './course-sections/services/course-sections.service';
import { CourseSectionsController } from './course-sections/controllers/course-sections.controller';
import { SchedulesService } from './schedules/services/schedules.service';
import { SchedulesController } from './schedules/controllers/schedules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseSection, Schedule])],
  controllers: [CourseSectionsController, SchedulesController],
  providers: [CourseSectionsService, SchedulesService],
})
export class TeachingModule {}
