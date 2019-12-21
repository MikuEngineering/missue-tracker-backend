import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './labels.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { OperationResult } from '../common/types/operation-result.type';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>
  ) {}

  async create(createLabelDto: CreateLabelDto) {
    const label = await this.labelRepository.findOne({
      name: createLabelDto.name,
      project: { id: createLabelDto.projectId },
    });

    if (label) {
      const { deprecated } = label;
      if (!deprecated) {
        return OperationResult.Conflict;
      }

      await this.reuseDeprecatedLabel(label, createLabelDto);
    }
    else {
      await this.createNewLabel(createLabelDto);
    }

    return OperationResult.Success;
  }

  private async reuseDeprecatedLabel(label: Label, createLabelDto: CreateLabelDto) {
    label.name = createLabelDto.name;
    label.description = createLabelDto.description;
    label.color = createLabelDto.color;
    label.deprecated = false;
    await this.labelRepository.save(label);
  }

  private async createNewLabel(createLabelDto: CreateLabelDto) {
    const label = this.labelRepository.create({
      name: createLabelDto.name,
      description: createLabelDto.description,
      color: createLabelDto.color,
      project: { id: createLabelDto.projectId },
    });
    await this.labelRepository.save(label);
  }
}
