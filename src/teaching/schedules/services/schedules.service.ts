import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import {
  CreateScheduleDto,
  ListSchedulesDto,
  UpdateScheduleDto,
} from '../dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';
import { CourseSection } from '../../course-sections/entities/course-section.entity';

@Injectable()
export class SchedulesService {
  private readonly sortableFields = new Map<string, string>([
    ['weekday', 'schedule.weekday'],
    ['time_start', 'schedule.time_start'],
    ['time_end', 'schedule.time_end'],
    ['created_at', 'schedule.created_at'],
    ['updated_at', 'schedule.updated_at'],
  ]);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
  ) {}

  private ensureValidTimes(start: string, end: string) {
    if (start >= end) {
      throw new BadRequestException('time_start must be earlier than time_end');
    }
  }

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    await this.ensureCourseSectionExists(createScheduleDto.course_section_id);
    this.ensureValidTimes(createScheduleDto.time_start, createScheduleDto.time_end);

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      classroom_id: createScheduleDto.classroom_id ?? null,
      date_start: createScheduleDto.date_start ?? null,
      date_end: createScheduleDto.date_end ?? null,
    });

    return await this.scheduleRepository.save(schedule);
  }

  async findAll(query: ListSchedulesDto): Promise<PaginatedResultDto<Schedule>> {
    const {
      page = 1,
      limit = 10,
      course_section_id,
      classroom_id,
      weekday,
      search,
      sortBy,
      sortOrder = 'ASC',
    } = query;

    const take = Math.max(limit, 1);
    const skip = (page - 1) * take;

    const qb = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.courseSection', 'courseSection')
      .skip(skip)
      .take(take);

    const normalizedSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    const orderColumn = this.sortableFields.get(sortBy ?? '') ?? 'schedule.weekday';
    qb.orderBy(orderColumn, normalizedSortOrder).addOrderBy('schedule.time_start', 'ASC');

    if (course_section_id) {
      qb.andWhere('schedule.course_section_id = :course_section_id', {
        course_section_id,
      });
    }

    if (classroom_id) {
      qb.andWhere('schedule.classroom_id = :classroom_id', { classroom_id });
    }

    if (weekday) {
      qb.andWhere('schedule.weekday = :weekday', { weekday });
    }

    if (search) {
      qb.andWhere(
        'schedule.weekday ILIKE :search OR schedule.time_start::text ILIKE :search OR schedule.time_end::text ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / take), 1);

    return {
      data,
      pagination: {
        page,
        limit: take,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.courseSection', 'courseSection')
      .where('schedule.id = :id', { id })
      .getOne();

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const existing = await this.findOne(id);

    if (updateScheduleDto.course_section_id && updateScheduleDto.course_section_id !== existing.course_section_id) {
      await this.ensureCourseSectionExists(updateScheduleDto.course_section_id);
    }

    const startTime = updateScheduleDto.time_start ?? existing.time_start;
    const endTime = updateScheduleDto.time_end ?? existing.time_end;
    this.ensureValidTimes(startTime, endTime);

    const {
      id: _,
      ...rest
    } = updateScheduleDto;

    const schedule = await this.scheduleRepository.preload({
      id,
      ...rest,
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }

  private async ensureCourseSectionExists(course_section_id: string): Promise<void> {
    const exists = await this.courseSectionRepository.exist({ where: { id: course_section_id } });
    if (!exists) {
      throw new NotFoundException(`Course section with ID ${course_section_id} not found`);
    }
  }
}
