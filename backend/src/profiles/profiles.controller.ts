import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import {  } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
    constructor(private readonly profileService: ProfilesService) {}

    @Post()
    create(@Body() createProfileDto: CreateProfileDto) {
        return this.profileService.createProfile(createProfileDto);
    }

    @Get()
    findAll() {
        return this.profileService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.profileService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.profileService.remove(id);
    }
}
