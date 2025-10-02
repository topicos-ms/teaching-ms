import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TeachingService } from './teaching.service';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';

@Controller()
export class TeachingController {
  constructor(private readonly teachingService: TeachingService) {}

  @MessagePattern('createTeaching')
  create(@Payload() createTeachingDto: CreateTeachingDto) {
    return this.teachingService.create(createTeachingDto);
  }

  @MessagePattern('findAllTeaching')
  findAll() {
    return this.teachingService.findAll();
  }

  @MessagePattern('findOneTeaching')
  findOne(@Payload() id: number) {
    return this.teachingService.findOne(id);
  }

  @MessagePattern('updateTeaching')
  update(@Payload() updateTeachingDto: UpdateTeachingDto) {
    return this.teachingService.update(updateTeachingDto.id, updateTeachingDto);
  }

  @MessagePattern('removeTeaching')
  remove(@Payload() id: number) {
    return this.teachingService.remove(id);
  }
}
