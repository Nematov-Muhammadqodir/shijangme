import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { PresetProduct } from '../../libs/dto/preset-product/preset-product';
import {
  PresetProductInput,
  PresetProductUpdate,
} from '../../libs/dto/preset-product/preset-product.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class PresetProductService {
  constructor(
    @InjectModel('PresetProduct')
    private readonly presetModel: Model<PresetProduct>,
  ) {}

  public async createPreset(input: PresetProductInput): Promise<PresetProduct> {
    try {
      return await this.presetModel.create(input);
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('This product preset already exists');
      }
      console.log('Error createPreset:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getPresets(memberId: ObjectId): Promise<PresetProduct[]> {
    return await this.presetModel
      .find({ memberId })
      .sort({ sortOrder: 1, productName: 1 })
      .lean()
      .exec() as unknown as PresetProduct[];
  }

  public async updatePreset(
    memberId: ObjectId,
    input: PresetProductUpdate,
  ): Promise<PresetProduct> {
    const result = await this.presetModel.findOneAndUpdate(
      { _id: input._id, memberId },
      input,
      { new: true },
    );
    if (!result)
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }

  public async deletePreset(
    memberId: ObjectId,
    presetId: ObjectId,
  ): Promise<PresetProduct> {
    const result = await this.presetModel.findOneAndDelete({
      _id: presetId,
      memberId,
    });
    if (!result)
      throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return result;
  }
}
