import { ObjectId } from 'bson';
import { T } from './types/common';
import { pipeline } from 'stream';

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
