import { Injectable } from '@nestjs/common';
import { CreateTeachingDto } from './dto/create-teaching.dto';
import { UpdateTeachingDto } from './dto/update-teaching.dto';

@Injectable()
export class TeachingService {
  create(createTeachingDto: CreateTeachingDto) {
    return 'This action adds a new teaching';
  }

  findAll() {
    return `This action returns all teaching`;
  }

  findOne(id: number) {
    return `This action returns a #${id} teaching`;
  }

  update(id: number, updateTeachingDto: UpdateTeachingDto) {
    return `This action updates a #${id} teaching`;
  }

  remove(id: number) {
    return `This action removes a #${id} teaching`;
  }
}
