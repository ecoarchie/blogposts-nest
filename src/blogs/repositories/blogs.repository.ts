import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from '../blog-schema';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async saveBlog(blog: BlogDocument): Promise<BlogDocument['id']> {
    const result = await blog.save();
    return result.id;
  }

  async findBlogById(blogId: string): Promise<BlogDocument> {
    return this.blogModel.findById(blogId);
  }

  async deleteAllBlogs() {
    return this.blogModel.deleteMany({});
  }

  async deleteBlogById(currentUserId: string, blogId: string): Promise<void> {
    if (!Types.ObjectId.isValid(blogId)) throw new NotFoundException();
    const blogToDelete = await this.blogModel.findById(blogId);
    if (!blogToDelete) throw new NotFoundException();
    if (!blogToDelete.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    await this.blogModel.deleteOne({
      _id: blogId,
    });
  }
}
