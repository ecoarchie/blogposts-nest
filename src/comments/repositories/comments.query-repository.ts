import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { PostDocument } from '../../posts/post-schema';
import {
  Comment,
  CommentDocument,
  CommentsPaginationOptions,
} from '../comment-schema';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findCommentById(commentId: string, userId: string) {
    if (!Types.ObjectId.isValid(commentId)) return null;
    const commentDocument = await this.commentModel
      .findOne()
      .and([
        { _id: new Types.ObjectId(commentId) },
        { 'commentatorInfo.isBanned': false },
      ])
      .lean();
    if (!commentDocument) return null;
    return this.toCommentDtoWithMyLikeStatus(commentDocument, userId);
  }

  async findCommentsDtoForPost(
    userId: string,
    postId: string,
    paginator: CommentsPaginationOptions,
  ) {
    const result = await this.commentModel
      .find()
      .and([
        { postId: new Types.ObjectId(postId) },
        { 'commentatorInfo.isBanned': false },
      ])
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]])
      .lean();

    // const totalCount = result.length;
    const totalCount = await this.commentModel
      .count()
      .where('postId')
      .equals(new Types.ObjectId(postId));
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: result.map((c) => {
        return this.toCommentDtoWithMyLikeStatus(c, userId);
      }),
    };
  }

  async countAllCommentsForPost(postId: string) {
    return this.commentModel.count({ postId: new Types.ObjectId(postId) });
  }

  private toCommentDtoWithMyLikeStatus(
    commentDoc: LeanDocument<CommentDocument>,
    userId: string,
  ) {
    return {
      id: commentDoc._id,
      content: commentDoc.content,
      commentatorInfo: {
        userId: commentDoc.commentatorInfo.userId,
        userLogin: commentDoc.commentatorInfo.userLogin,
      },
      createdAt: commentDoc.createdAt,
      likesInfo: {
        likesCount: commentDoc.likesInfo.userLikes.filter(
          (l) => l.reaction === 'Like' && !l.isBanned,
        ).length,
        dislikesCount: commentDoc.likesInfo.userLikes.filter(
          (l) => l.reaction === 'Dislike' && !l.isBanned,
        ).length,
        myStatus:
          commentDoc.likesInfo.userLikes.find(
            (u) => u.userId.toString() === userId,
          )?.reaction || 'None',
      },
    };
  }

  async findAllCommentsForPosts(
    posts: LeanDocument<PostDocument[]>,
    paginator: CommentsPaginationOptions,
  ) {
    const postsIds = posts.map((p) => p._id);
    const comments = await this.commentModel
      .find()
      .where('postId')
      .in(postsIds)
      .where('commentatorInfo.isBanned')
      .equals(false)
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]])
      .lean();

    const totalCount = await this.commentModel
      .count()
      .where('postId')
      .in(postsIds);
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    const items = comments.map((c) => {
      const cPost = posts.find((p) => p._id.toString() === c.postId.toString());
      return {
        id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        commentatorInfo: {
          userId: c.commentatorInfo.userId,
          userLogin: c.commentatorInfo.userLogin,
        },
        likesInfo: {
          likesCount: c.likesInfo.userLikes.filter(
            (l) => l.reaction === 'Like' && !l.isBanned,
          ).length,
          dislikesCount: c.likesInfo.userLikes.filter(
            (l) => l.reaction === 'Dislike' && !l.isBanned,
          ).length,
          myStatus: 'None',
        },
        postInfo: {
          blogId: cPost.blogId,
          blogName: cPost.blogName,
          title: cPost.title,
          id: c.postId,
        },
      };
    });

    return {
      pagesCount,
      page: Number(paginator.pageNumber),
      pageSize: Number(paginator.pageSize),
      totalCount,
      items: items,
    };
  }
}
