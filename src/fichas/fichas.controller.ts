import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FichasService } from './fichas.service';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fichas')
@UseGuards(JwtAuthGuard)
export class FichasController {
    constructor(private readonly fichasService: FichasService) { }

    @Post()
    crearFicha(@Body() createFichaDto: CreateFichaDto) {
        return this.fichasService.crearFicha(createFichaDto);
    }
}
