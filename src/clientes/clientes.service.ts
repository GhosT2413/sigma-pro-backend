import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
    ) { }
    async crearCliente(dto: CreateClienteDto): Promise<Cliente> {
        if (dto.rut) {
            const existeRut = await this.clientesRepository.findOne({ where: { rut: dto.rut } });
            if (existeRut) throw new BadRequestException('El RUT ingresado ya existe.');
        }

        const nuevoCliente = this.clientesRepository.create(dto);
        return await this.clientesRepository.save(nuevoCliente);
    }
}
