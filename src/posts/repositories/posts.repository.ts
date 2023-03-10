import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogsRepository } from '../../blogs/repositories/blogs.repository';
import {
  BlogPost,
  CreatePostWithBlogIdDto,
  PostDocument,
} from '../post-schema';

@Injectable()
export class PostsRepository {
  constructor(
    private blogsRepository: BlogsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}
  async savePost(post: PostDocument): Promise<PostDocument['id']> {
    const result = await post.save();
    return result.id as string;
  }

  async findPostById(postId: string) {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findById(postId).exec();
  }

  async findPostByPostIdAndBlogId(postId: string, blogId: string) {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel
      .findOne()
      .and([
        { id: new Types.ObjectId(postId) },
        { blogId: new Types.ObjectId(blogId) },
      ]);
  }

  // async createPost(postDto: CreatePostWithBlogIdDto) {
  //   const blog = await this.blogsRepository.findBlogById(postDto.blogId);
  //   if (!blog) throw new BadRequestException();
  //   const newPost = new this.postModel({ ...postDto, blogName: blog.name });
  //   const postId = await this.savePost(newPost);
  //   return postId as string;
  // }

  async deleteAllPosts() {
    return this.postModel.deleteMany({});
  }

  async deletePostById(postId: string) {
    const result = await this.postModel.deleteOne({
      _id: postId,
    });
    return result.deletedCount === 1;
  }

  async updatePostsForBannedUser(userId: string, isBanned: boolean) {
    await this.postModel.updateMany(
      { 'extendedLikesInfo.userLikes.userId': new Types.ObjectId(userId) },
      { 'extendedLikesInfo.userLikes.$[element].isBanned': isBanned },
      { arrayFilters: [{ 'element.userId': new Types.ObjectId(userId) }] },
    );
  }
}
