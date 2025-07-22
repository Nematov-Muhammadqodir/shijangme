import { ObjectId } from 'bson';
import { T } from './types/common';
import { pipeline } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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

export const availableProducts = [
  'createdAt',
  'updatedAt',
  'productLikes',
  'productViews',
  'productRank',
  'productPrice',
];

export const shapeIntoMongoObjectId = (target: any) => {
  console.log('target id', target);
  console.log('target id type', typeof target);
  return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (
  memberId: T,
  targetRefId: string = '$_id',
) => {
  return {
    $lookup: {
      from: 'likes',
      let: {
        localMemberId: memberId,
        localLikeRefId: targetRefId,
        localMyFavorite: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$likeRefId', '$$localLikeRefId'] },
                { $eq: ['$memberId', '$$localMemberId'] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            memberId: 1,
            likeRefIf: 1,
            myFavorite: '$$localMyFavorite',
          },
        },
      ],
      as: 'meLiked',
    },
  };
};

export const lookupMember = {
  $lookup: {
    from: 'members',
    localField: 'productOwnerId',
    foreignField: '_id',
    as: 'productOwnerData',
  },
};

//^ FOR IMAGES
export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const getSerialForImage = (filename: string) => {
  const ext = path.parse(filename).ext;
  return uuidv4() + ext;
};
