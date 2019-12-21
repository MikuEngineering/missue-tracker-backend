import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { OperationResult } from '../common/types/operation-result.type';

@Controller('labels')
export class LabelsController {
  constructor(
    private readonly labelsService: LabelsService,
  ) { }

  @Get(':id')
  async readLabelById(
    @Param('id', IdValidationPipe) labelId: number,
  ) {
    const [result, label] = await this.labelsService.readOneById(labelId);
    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The label does not exist.',
      });
    }

    return label;
  }
}
