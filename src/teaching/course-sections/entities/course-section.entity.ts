import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('course_section')
@Index('IDX_course_section_course', ['course_id'])
@Index('IDX_course_section_term', ['term_id'])
@Index('IDX_course_section_teacher', ['teacher_id'])
@Index('IDX_course_section_quota', ['quota_available'])
@Index('IDX_course_section_course_term', ['course_id', 'term_id'])
@Index('IDX_course_section_status', ['status'])
export class CourseSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  course_id: string;

  @Column('uuid')
  term_id: string;

  @Column('uuid', { nullable: true })
  classroom_id: string | null;

  @Column('uuid', { nullable: true })
  teacher_id: string | null;

  @Column('varchar', { length: 10 })
  group_label: string;

  @Column('varchar', { length: 20 })
  modality: string;

  @Column('varchar', { length: 20 })
  shift: string;

  @Column('smallint')
  quota_max: number;

  @Column('smallint')
  quota_available: number;

  @Column('varchar', { length: 20, default: 'Active' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Schedule, (schedule) => schedule.courseSection, {
    cascade: true,
  })
  schedules: Schedule[];
}
