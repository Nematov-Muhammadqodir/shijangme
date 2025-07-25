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

export const availableBoardArticleSorts = [
  'createdAt',
  'updatedAt',
  'articleLikes',
  'articleViews',
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
            likeRefId: 1,
            myFavorite: '$$localMyFavorite',
          },
        },
      ],
      as: 'meLiked',
    },
  };
};

interface LookupAuthMemberFollowed {
  followerId: T;
  followingId: string;
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
  const { followerId, followingId } = input;
  return {
    $lookup: {
      from: 'follows',
      let: {
        localFollowerId: followerId,
        localFollowingId: followingId,
        localMeFollowed: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followerId', '$$localFollowerId'] },
                { $eq: ['$followingId', '$$localFollowingId'] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            followingId: 1,
            followerId: 1,
            myFollowing: '$$localMeFollowed',
          },
        },
      ],
      as: 'meFollowed',
    },
  };
};

export const lookupOrderItems = (orderId: string = '$_id') => {
  return {
    $lookup: {
      from: 'orderItems',
      let: {
        localOrderId: orderId,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [{ $eq: ['$orderId', '$$localOrderId'] }],
            },
          },
        },
        {
          $project: {
            _id: 0,
            itemQuantity: 1,
            itemPrice: 1,
            orderId: 1,
            productId: 1,
          },
        },
      ],
      as: 'orderItems',
    },
  };
};

export const lookupFollowingData = {
  $lookup: {
    from: 'members',
    localField: 'followingId',
    foreignField: '_id',
    as: 'followingData',
  },
};
export const lookupFollowerData = {
  $lookup: {
    from: 'members',
    localField: 'followerId',
    foreignField: '_id',
    as: 'followerData',
  },
};

export const lookupMember = {
  $lookup: {
    from: 'members',
    localField: 'productOwnerId',
    foreignField: '_id',
    as: 'productOwnerData',
  },
};

export const lookupFavorite = {
  $lookup: {
    from: 'members',
    localField: 'favoriteProduct.productOwnerId',
    foreignField: '_id',
    as: 'favoriteProduct.productOwnerData',
  },
};

export const lookupVisit = {
  $lookup: {
    from: 'members',
    localField: 'visitedProduct.productOwnerId',
    foreignField: '_id',
    as: 'visitedProduct.productOwnerData',
  },
};

export const lookupOrderItemProducts = {
  $lookup: {
    from: 'products',
    localField: 'orderItems.productId',
    foreignField: '_id',
    as: 'productData',
  },
};

//^ FOR IMAGES
export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const getSerialForImage = (filename: string) => {
  const ext = path.parse(filename).ext;
  return uuidv4() + ext;
};
