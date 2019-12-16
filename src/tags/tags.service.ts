import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tags.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>
  ) {}

  async createMany(tagNames: string[], projectId: number): Promise<Tag[]> {
    const newTags = tagNames.map((name) => {

      return this.tagRepository.create({
        name,
        project: { id: projectId }
      });

    });

    return this.tagRepository.save(newTags);
  }
}
