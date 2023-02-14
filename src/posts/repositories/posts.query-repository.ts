import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { BlogPost, PostDocument, PostPaginatorOptions } from '../post-schema';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async savePost(post: PostDocument): Promise<PostDocument['id']> {
    const result = await post.save();
    return result.id;
  }

  async findPostById(postId: string) {
    if (!Types.ObjectId.isValid(postId)) return null;
    const postDocument = await this.postModel.findById(postId).lean();
    if (!postDocument) return null;
    return this.toPostDto(postDocument);
  }

  async findAllPostsForBlog(
    blogId: string,
    paginatorOptions: PostPaginatorOptions,
  ) {
    const result = await this.postModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();
    const totalCount = await this.countPostsByBlogId(blogId);
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toPostDto),
    };
  }
  private async countPostsByBlogId(blogId: string) {
    return this.postModel.count({ blogId: new Types.ObjectId(blogId) });
  }

  async findAll(paginatorOptions: PostPaginatorOptions) {
    const result = await this.postModel
      .find()
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = await this.postModel.count();
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toPostDto),
    };
  }

  async deletePostById(postId: string) {
    const result = await this.postModel.deleteOne({
      _id: postId,
    });
    return result.deletedCount === 1;
  }

  private toPostDto(post: LeanDocument<PostDocument>) {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: 'None', //TODO get users like status
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    };
  }
}
