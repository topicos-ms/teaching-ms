import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseSection } from './teaching/course-sections/entities/course-section.entity';
import { Schedule } from './teaching/schedules/entities/schedule.entity';

@Controller()
export class SeedingController {
  constructor(
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  @MessagePattern('teaching.clearTestData')
  async clearTestData() {
    try {
      // Use TRUNCATE CASCADE to handle foreign keys
      await this.courseSectionRepository.query('TRUNCATE TABLE "schedule" CASCADE');
      await this.courseSectionRepository.query('TRUNCATE TABLE "course_section" CASCADE');

      return {
        success: true,
        message: 'Teaching test data cleared successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear teaching test data: ${error.message}`,
      };
    }
  }

  @MessagePattern('teaching.courseSections.clearTestData')
  async clearCourseSections() {
    // Alias for clearTestData
    return this.clearTestData();
  }
}
