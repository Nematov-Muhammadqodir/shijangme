import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PresetProductSchema from '../../schemas/PresetProduct.model';
import { AuthModule } from '../auth/auth.module';
import { PresetProductResolver } from './preset-product.resolver';
import { PresetProductService } from './preset-product.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PresetProduct', schema: PresetProductSchema },
    ]),
    AuthModule,
  ],
  providers: [PresetProductResolver, PresetProductService],
  exports: [PresetProductService],
})
export class PresetProductModule {}
