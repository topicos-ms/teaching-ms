import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SchedulesService } from '../services/schedules.service';
import {
  CreateScheduleDto,
  ListSchedulesDto,
  UpdateScheduleDto,
} from '../dto';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @MessagePattern('teaching.schedules.create')
  create(@Payload() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @MessagePattern('teaching.schedules.list')
  findAll(@Payload() listSchedulesDto: ListSchedulesDto) {
    return this.schedulesService.findAll(listSchedulesDto);
  }

  @MessagePattern('teaching.schedules.findOne')
  findOne(@Payload() id: string) {
    return this.schedulesService.findOne(id);
  }

  @MessagePattern('teaching.schedules.update')
  update(
    @Payload()
    payload: {
      id: string;
      updateScheduleDto: UpdateScheduleDto;
    },
  ) {
    return this.schedulesService.update(payload.id, payload.updateScheduleDto);
  }

  @MessagePattern('teaching.schedules.remove')
  remove(@Payload() id: string) {
    return this.schedulesService.remove(id);
  }
}
