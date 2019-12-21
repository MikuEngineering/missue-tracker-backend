import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Request,
  UseGuards,
  NotFoundException
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LabelsService } from './labels.service';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { OperationResult } from '../common/types/operation-result.type';
import { SessionUser } from '../common/types/session-user.type';

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

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateLabelById(
    @Param('id', IdValidationPipe) labelId: number,
    @Body(ValidationPipe) updateLabelDto: UpdateLabelDto,
    @Request() request: ExpressRequest,
  ) {
  }
}
