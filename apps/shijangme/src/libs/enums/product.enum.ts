import { registerEnumType } from '@nestjs/graphql';

export enum ProductCollection {
  FRUITS = 'FRUITS',
  MASHROOMS = 'MASHROOMS',
  GREENS = 'GREENS',
  VEGETABLES = 'VEGETABLES',
  HERBS = 'HERBS',
  NUTS = 'NUTS',
  GRAINS = 'GRAINS',
}
registerEnumType(ProductCollection, {
  name: 'ProductCollection',
});

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  DELETE = 'DELETE',
}
registerEnumType(ProductStatus, {
  name: 'ProductStatus',
});

export enum ProductVolume {
  HALF = 0.5,
  ONE = 1,
  TWO = 2,
  FOUR = 4,
  TEN = 10,
  TWENTY = 20,
}
registerEnumType(ProductVolume, {
  name: 'ProductVolume',
});
