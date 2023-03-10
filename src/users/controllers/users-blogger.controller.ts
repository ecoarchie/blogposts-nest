import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BearerAuthGuard } from '../../auth/guards/bearer.auth.guard';
import { BlogsQueryRepository } from '../../blogs/repositories/blogs.query-repository';
import { BlogsService } from '../../blogs/services/blogs.service';
import { CurrentUser } from '../../utils/current-user.param.decorator';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import {
  BannedUserPaginatorOptions,
  BanUserByBloggerDto,
  UsersPagination,
} from '../user-schema';
import { UsersService } from '../users.service';

@UseGuards(BearerAuthGuard)
@Controller('blogger/users')
export class BloggerUserController {
  constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    private readonly userService: UsersService,
    private readonly blogsService: BlogsService,
    private readonly blogsQueryRepo: BlogsQueryRepository,
  ) {}

  @Get('blog/:id')
  async findAllBannedUsers(
    @Param('id') blogId: string,
    @Query() userPaginatorQuery: BannedUserPaginatorOptions,
    @CurrentUser('id') currentUserId: string,
  ): Promise<UsersPagination> {
    const userPaginatorOptions = new BannedUserPaginatorOptions(
      userPaginatorQuery,
    );
    const users = await this.blogsQueryRepo.findAllBannedUsersForBlog(
      currentUserId,
      blogId,
      userPaginatorOptions,
    );
    return users;
  }

  @HttpCode(204)
  @Put(':id/ban')
  async banUnbanUserByBlogger(
    @Param('id') userId: string,
    @Body() banUserByBloggerDto: BanUserByBloggerDto,
    @CurrentUser('id') bloggerId: string,
  ) {
    await this.blogsService.banUserByBlogger(
      bloggerId,
      userId,
      banUserByBloggerDto,
    );
  }
}
