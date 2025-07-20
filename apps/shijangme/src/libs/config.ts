import { ObjectId } from 'bson';

export const availableVendorSorts = [
  'createdAt',
  'updatedAt',
  'memberLikes',
  'memberViews',
  'memberRank',
];

export const availableMemberSorts = [
  'createdAt',
  'updatedAt',
  'memberLikes',
  'memberViews',
];

export const shapeIntoMongoObjectId = (target: any) => {
  console.log('target id', target);
  console.log('target id type', typeof target);
  return typeof target === 'string' ? new ObjectId(target) : target;
};
