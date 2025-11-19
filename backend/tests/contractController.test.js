/**
 * Tests básicos para ContractController
 * Ejecutar con: npm test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ContractController } from '../controllers/contractController.js'
import { ContractModel } from '../models/ContractModel.js'

// Mock de los models
jest.mock('../models/ContractModel.js')
jest.mock('../models/AttachmentModel.js')
jest.mock('../models/InstallmentModel.js')
jest.mock('../models/ObligationModel.js')

describe('ContractController', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
        clienteId: 'cliente-123',
        email: 'test@example.com',
        rol: 'usuario'
      },
      params: {},
      query: {},
      body: {}
    }

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    }

    next = jest.fn()
  })

  describe('list', () => {
    it('debe listar contratos con paginación', async () => {
      const mockContracts = [
        { id: '1', numero_contrato: 'CT-001' },
        { id: '2', numero_contrato: 'CT-002' }
      ]

      ContractModel.findAll.mockResolvedValue({
        data: mockContracts,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      })

      req.query = { page: 1, limit: 10 }

      await ContractController.list(req, res, next)

      expect(ContractModel.findAll).toHaveBeenCalledWith({
        clienteId: 'cliente-123',
        filters: {},
        page: 1,
        limit: 10,
        orderBy: 'created_at',
        orderDir: 'desc'
      })

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockContracts,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      })
    })
  })

  describe('create', () => {
    it('debe crear un contrato válido', async () => {
      const newContract = {
        numero_contrato: 'CT-001',
        fecha_inicio: '2024-01-01',
        client_id: 'client-123',
        valor_contrato: 1000000,
        objeto_contrato: 'Servicio de desarrollo',
        tipo_contrato_id: 'tipo-1',
        estado_contrato_id: 'estado-1'
      }

      req.body = newContract

      ContractModel.checkNumeroExists.mockResolvedValue(false)
      ContractModel.create.mockResolvedValue({ id: 'contract-123', ...newContract })

      await ContractController.create(req, res, next)

      expect(ContractModel.checkNumeroExists).toHaveBeenCalled()
      expect(ContractModel.create).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Contrato creado exitosamente'
        })
      )
    })

    it('debe rechazar contrato sin número', async () => {
      req.body = {
        fecha_inicio: '2024-01-01'
      }

      await ContractController.create(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR'
          })
        })
      )
    })

    it('debe rechazar número de contrato duplicado', async () => {
      req.body = {
        numero_contrato: 'CT-001',
        fecha_inicio: '2024-01-01',
        client_id: 'client-123',
        valor_contrato: 1000000,
        objeto_contrato: 'Servicio'
      }

      ContractModel.checkNumeroExists.mockResolvedValue(true)

      await ContractController.create(req, res, next)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DUPLICATE_ENTRY'
          })
        })
      )
    })
  })

  describe('getById', () => {
    it('debe obtener un contrato existente', async () => {
      const contract = { id: 'contract-123', numero_contrato: 'CT-001' }

      req.params.id = 'contract-123'
      ContractModel.findById.mockResolvedValue(contract)

      await ContractController.getById(req, res, next)

      expect(ContractModel.findById).toHaveBeenCalledWith('contract-123', 'cliente-123')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: contract
      })
    })

    it('debe retornar 404 si no existe', async () => {
      req.params.id = 'contract-999'
      ContractModel.findById.mockResolvedValue(null)

      await ContractController.getById(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND'
          })
        })
      )
    })
  })
})

