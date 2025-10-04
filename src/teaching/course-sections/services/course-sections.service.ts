import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CourseSection } from '../entities/course-section.entity';
import {
  CreateCourseSectionDto,
  ListCourseSectionsDto,
  UpdateCourseSectionDto,
} from '../dto';
import { PaginatedResultDto } from '../../../common/dto/paginated-result.dto';

@Injectable()
export class CourseSectionsService {
  private readonly sortableFields = new Map<string, string>([
    ['group_label', 'course_section.group_label'],
    ['quota_max', 'course_section.quota_max'],
    ['quota_available', 'course_section.quota_available'],
    ['created_at', 'course_section.created_at'],
    ['updated_at', 'course_section.updated_at'],
  ]);

  constructor(
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCourseSectionDto: CreateCourseSectionDto): Promise<CourseSection> {
    if (
      createCourseSectionDto.quota_available !== undefined &&
      createCourseSectionDto.quota_available > createCourseSectionDto.quota_max
    ) {
      throw new BadRequestException('quota_available cannot be greater than quota_max');
    }

    const { course_id, term_id, teacher_id } = await this.resolveIdentifiers(createCourseSectionDto);

    const {
      degree_program_code: _degreeProgramCode,
      study_plan_version: _studyPlanVersion,
      course_code: _courseCode,
      term_name: _termName,
      teacher_email: _teacherEmail,
      ...rest
    } = createCourseSectionDto;

    const courseSection = this.courseSectionRepository.create({
      ...rest,
      course_id,
      term_id,
      teacher_id: teacher_id ?? null,
      quota_available: rest.quota_available ?? rest.quota_max,
      status: rest.status ?? 'Active',
    });

    return await this.courseSectionRepository.save(courseSection);
  }

  async findAll(
    query: ListCourseSectionsDto,
  ): Promise<PaginatedResultDto<CourseSection>> {
    const {
      page = 1,
      limit = 10,
      course_id,
      term_id,
      teacher_id,
      status,
      search,
      sortBy,
      sortOrder = 'DESC',
    } = query;

    const take = Math.max(limit, 1);
    const skip = (page - 1) * take;

    const qb = this.courseSectionRepository
      .createQueryBuilder('course_section')
      .leftJoinAndSelect('course_section.schedules', 'schedules')
      .skip(skip)
      .take(take)
      .distinct(true);

    const normalizedSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    const orderColumn = this.sortableFields.get(sortBy ?? '') ?? 'course_section.updated_at';
    qb.orderBy(orderColumn, normalizedSortOrder);

    if (course_id) {
      qb.andWhere('course_section.course_id = :course_id', { course_id });
    }

    if (term_id) {
      qb.andWhere('course_section.term_id = :term_id', { term_id });
    }

    if (teacher_id) {
      qb.andWhere('course_section.teacher_id = :teacher_id', { teacher_id });
    }

    if (status) {
      qb.andWhere('course_section.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        'course_section.group_label ILIKE :search OR course_section.shift ILIKE :search OR course_section.modality ILIKE :search',
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

  async findOne(id: string): Promise<CourseSection> {
    const courseSection = await this.courseSectionRepository
      .createQueryBuilder('course_section')
      .leftJoinAndSelect('course_section.schedules', 'schedules')
      .where('course_section.id = :id', { id })
      .orderBy('schedules.weekday', 'ASC')
      .addOrderBy('schedules.time_start', 'ASC')
      .getOne();

    if (!courseSection) {
      throw new NotFoundException(`Course section with ID ${id} not found`);
    }

    return courseSection;
  }

  async update(id: string, updateCourseSectionDto: UpdateCourseSectionDto): Promise<CourseSection> {
    const existing = await this.findOne(id);

    if (
      updateCourseSectionDto.quota_available !== undefined &&
      updateCourseSectionDto.quota_max !== undefined &&
      updateCourseSectionDto.quota_available > updateCourseSectionDto.quota_max
    ) {
      throw new BadRequestException('quota_available cannot be greater than quota_max');
    }

    const identifiers = await this.resolveIdentifiers(updateCourseSectionDto, existing);

    const {
      id: _,
      degree_program_code: _degreeProgramCode,
      study_plan_version: _studyPlanVersion,
      course_code: _courseCode,
      term_name: _termName,
      teacher_email: _teacherEmail,
      ...rest
    } = updateCourseSectionDto;

    const courseSection = await this.courseSectionRepository.preload({
      id,
      ...rest,
      course_id: identifiers.course_id,
      term_id: identifiers.term_id,
      teacher_id: identifiers.teacher_id ?? existing.teacher_id ?? null,
    });

    if (!courseSection) {
      throw new NotFoundException(`Course section with ID ${id} not found`);
    }

    if (
      rest.quota_max !== undefined &&
      courseSection.quota_available > courseSection.quota_max
    ) {
      courseSection.quota_available = courseSection.quota_max;
    }

    if (courseSection.status === undefined) {
      courseSection.status = existing.status;
    }

    return await this.courseSectionRepository.save(courseSection);
  }

  async remove(id: string): Promise<void> {
    const courseSection = await this.findOne(id);
    await this.courseSectionRepository.remove(courseSection);
  }

  private async resolveIdentifiers(
    dto: CreateCourseSectionDto | UpdateCourseSectionDto,
    existing?: CourseSection,
  ): Promise<{ course_id: string; term_id: string; teacher_id: string | null }> {
    let course_id = dto.course_id ?? existing?.course_id ?? null;
    let term_id = dto.term_id ?? existing?.term_id ?? null;
    let teacher_id = dto.teacher_id ?? existing?.teacher_id ?? null;

    const hasCourseCodeInput =
      dto.degree_program_code !== undefined ||
      dto.study_plan_version !== undefined ||
      dto.course_code !== undefined;

    if (hasCourseCodeInput) {
      if (!dto.degree_program_code || !dto.study_plan_version || !dto.course_code) {
        throw new BadRequestException(
          'Provide degree_program_code, study_plan_version and course_code together to resolve the course.',
        );
      }
      const resolvedCourseId = await this.findCourseIdByCodes(
        dto.degree_program_code,
        dto.study_plan_version,
        dto.course_code,
      );
      if (course_id && course_id !== resolvedCourseId) {
        throw new BadRequestException(
          'Provided course_id does not match the course identified by the supplied codes',
        );
      }
      course_id = resolvedCourseId;
    }

    if (!course_id) {
      throw new BadRequestException(
        'Provide course_id or the combination (degree_program_code, study_plan_version, course_code).',
      );
    }

    if (dto.term_name) {
      const resolvedTermId = await this.findTermIdByName(dto.term_name);
      if (term_id && term_id !== resolvedTermId) {
        throw new BadRequestException(
          'Provided term_id does not match the term identified by term_name',
        );
      }
      term_id = resolvedTermId;
    }

    if (!term_id) {
      throw new BadRequestException('Provide term_id or term_name.');
    }

    if (dto.teacher_email) {
      const resolvedTeacherId = await this.findTeacherIdByEmail(dto.teacher_email);
      if (teacher_id && teacher_id !== resolvedTeacherId) {
        throw new BadRequestException(
          'Provided teacher_id does not match the teacher identified by teacher_email',
        );
      }
      teacher_id = resolvedTeacherId;
    }

    return { course_id, term_id, teacher_id };
  }

  private async findCourseIdByCodes(
    degreeProgramCode: string,
    studyPlanVersion: string,
    courseCode: string,
  ): Promise<string> {
    const [result] = await this.dataSource.query(
      `
        SELECT c.id
        FROM course c
        INNER JOIN study_plan sp ON sp.id = c.study_plan_id
        INNER JOIN degree_program dp ON dp.id = sp.degree_program_id
        WHERE LOWER(dp.code) = LOWER($1)
          AND LOWER(sp.version) = LOWER($2)
          AND LOWER(c.code) = LOWER($3)
        LIMIT 1;
      `,
      [degreeProgramCode.trim(), studyPlanVersion.trim(), courseCode.trim()],
    );

    if (!result || !result.id) {
      throw new NotFoundException(
        `Course not found for degree_program_code='${degreeProgramCode}', study_plan_version='${studyPlanVersion}', course_code='${courseCode}'`,
      );
    }

    return result.id;
  }

  private async findTermIdByName(termName: string): Promise<string> {
    const [result] = await this.dataSource.query(
      `
        SELECT id
        FROM term
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1;
      `,
      [termName.trim()],
    );

    if (!result || !result.id) {
      throw new NotFoundException(`Term with name '${termName}' not found`);
    }

    return result.id;
  }

  private async findTeacherIdByEmail(email: string): Promise<string> {
    const [result] = await this.dataSource.query(
      `
        SELECT id
        FROM "user"
        WHERE user_type = 'Teacher'
          AND LOWER(email) = LOWER($1)
        LIMIT 1;
      `,
      [email.trim()],
    );

    if (!result || !result.id) {
      throw new NotFoundException(`Teacher with email '${email}' not found`);
    }

    return result.id;
  }
}
