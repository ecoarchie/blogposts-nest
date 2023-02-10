import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogPaginatorOptions,
  BlogsPagination,
} from '../blog-schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async findBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findById(blogId);
    if (!blogDocument) return null;
    return this.toBlogDto(blogDocument);
  }

  async findAll(
    paginatorOptions: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const nameRegex = new RegExp(paginatorOptions.searchNameTerm, 'i');
    const result = await this.blogModel
      .find(
        paginatorOptions.searchNameTerm ? { name: { $regex: nameRegex } } : {},
      )
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]]);

    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toBlogDto),
    };
  }

  private toBlogDto(blog: BlogDocument) {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}