import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
  CommentsPaginationOptions,
} from '../comment-schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentsModel: Model<CommentDocument>,
  ) {}

  async deleteAllComments() {
    return this.commentsModel.deleteMany({});
  }

  async deleteCommentById(commentId: string) {
    await this.commentsModel.findByIdAndDelete(commentId);
  }

  async createComment(
    content: string,
    postId: string,
    commentatorId: string,
    commentatorLogin: string,
  ): Promise<CommentDocument['id']> {
    const newComment = new this.commentsModel({
      content,
      postId: new Types.ObjectId(postId),
      commentatorInfo: {
        userId: new Types.ObjectId(commentatorId),
        userLogin: commentatorLogin,
      },
    });
    return this.saveComment(newComment);
  }

  async findCommentsForPost(
    userId: string,
    postId: string,
    paginator: CommentsPaginationOptions,
  ) {
    const result = await this.commentsModel
      .find()
      .and([
        { postId: new Types.ObjectId(postId) },
        { 'commentatorInfo.isBanned': false },
      ])
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]]);

    const totalCount = result.length;
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

  async findCommentById(commentId: string, userId: string) {
    const comment = await this.commentsModel.findById(commentId);
    if (!comment) return null;

    return comment;
  }

  async countAllCommentsForPost(postId: string) {
    return this.commentsModel.count({ postId: new Types.ObjectId(postId) });
  }

  async updateCommentsForBannedUser(userId: string, isBanned: boolean) {
    //TODO refactor this into swparate methods with meaningful names
    await this.commentsModel.updateMany(
      { 'commentatorInfo.userId': new Types.ObjectId(userId) },
      { 'commentatorInfo.isBanned': isBanned },
    );

    await this.commentsModel.updateMany(
      { 'likesInfo.userLikes.userId': new Types.ObjectId(userId) },
      { 'likesInfo.userLikes.$[element].isBanned': isBanned },
      { arrayFilters: [{ 'element.userId': new Types.ObjectId(userId) }] },
    );
  }

  async saveComment(
    newComment: CommentDocument,
  ): Promise<CommentDocument['id']> {
    const result = await newComment.save();
    return result.id as string;
  }

  private toCommentDtoWithMyLikeStatus(
    commentDoc: CommentDocument,
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
        likesCount: commentDoc.countLikes(),
        dislikesCount: commentDoc.countDislikes(),
        myStatus: commentDoc.getMyLikeStatus(userId),
      },
    };
  }
}
