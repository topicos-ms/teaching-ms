import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CourseSectionsService } from '../services/course-sections.service';
import {
  CreateCourseSectionDto,
  ListCourseSectionsDto,
  UpdateCourseSectionDto,
} from '../dto';

@Controller()
export class CourseSectionsController {
  constructor(private readonly courseSectionsService: CourseSectionsService) {}

  @MessagePattern('teaching.courseSections.create')
  create(@Payload() createCourseSectionDto: CreateCourseSectionDto) {
    return this.courseSectionsService.create(createCourseSectionDto);
  }

  @MessagePattern('teaching.courseSections.list')
  findAll(@Payload() listCourseSectionsDto: ListCourseSectionsDto) {
    return this.courseSectionsService.findAll(listCourseSectionsDto);
  }

  @MessagePattern('teaching.courseSections.findOne')
  findOne(@Payload() id: string) {
    return this.courseSectionsService.findOne(id);
  }

  @MessagePattern('teaching.courseSections.update')
  update(
    @Payload()
    payload: {
      id: string;
      updateCourseSectionDto: UpdateCourseSectionDto;
    },
  ) {
    return this.courseSectionsService.update(payload.id, payload.updateCourseSectionDto);
  }

  @MessagePattern('teaching.courseSections.remove')
  remove(@Payload() id: string) {
    return this.courseSectionsService.remove(id);
  }
}
