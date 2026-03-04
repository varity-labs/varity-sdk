/**
 * Unit tests for StorageClient
 */

import { StorageClient, StorageResult, PinResult } from './StorageClient'
import { createMockHTTPClient, MockHTTPClient } from '../../tests/mocks/httpClient.mock'

describe('StorageClient', () => {
  let mockHttp: MockHTTPClient
  let storageClient: StorageClient

  beforeEach(() => {
    mockHttp = createMockHTTPClient()
    storageClient = new StorageClient(mockHttp)
  })

  afterEach(() => {
    mockHttp.clearMocks()
  })

  describe('uploadFile', () => {
    it('should upload file to storage', async () => {
      const mockResult: StorageResult = {
        cid: 'Qm1234567890abcdef',
        gatewayUrl: 'https://ipfs.io/ipfs/Qm1234567890abcdef',
        size: 1024,
        timestamp: Date.now()
      }

      // Mock the uploadFile method
      mockHttp.uploadFile = jest.fn().mockResolvedValue(mockResult)

      const file = new Blob(['test content'], { type: 'text/plain' })
      const result = await storageClient.uploadFile(file as File, { name: 'test.txt' })

      expect(result).toEqual(mockResult)
      expect(result.cid).toBe('Qm1234567890abcdef')
      expect(result.size).toBe(1024)
    })
  })

  describe('pinCID', () => {
    it('should pin content by CID', async () => {
      const mockPinResult: PinResult = {
        cid: 'Qm1234567890abcdef',
        isPinned: true
      }

      mockHttp.mockPost('/storage/pin', mockPinResult)

      const result = await storageClient.pinCID('Qm1234567890abcdef')

      expect(result).toEqual(mockPinResult)
      expect(result.isPinned).toBe(true)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/storage/pin',
        data: { cid: 'Qm1234567890abcdef' }
      })
    })
  })

  describe('unpinCID', () => {
    it('should unpin content by CID', async () => {
      mockHttp.mockPost('/storage/unpin', undefined)

      await storageClient.unpinCID('Qm1234567890abcdef')

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'POST',
        path: '/storage/unpin',
        data: { cid: 'Qm1234567890abcdef' }
      })
    })
  })

  describe('listPins', () => {
    it('should list all pinned content', async () => {
      const mockPins = ['Qm111', 'Qm222', 'Qm333']

      mockHttp.mockGet('/storage/pins', mockPins)

      const result = await storageClient.listPins()

      expect(result).toEqual(mockPins)
      expect(result).toHaveLength(3)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        method: 'GET',
        path: '/storage/pins'
      })
    })
  })

  describe('retrieve', () => {
    it('should retrieve content by CID', async () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })

      mockHttp.mockGet('/storage/retrieve/Qm1234567890abcdef', mockBlob)

      const result = await storageClient.retrieve('Qm1234567890abcdef')

      expect(result).toEqual(mockBlob)

      const history = mockHttp.getCallHistory()
      expect(history).toHaveLength(1)
      expect(history[0].method).toBe('GET')
      expect(history[0].path).toBe('/storage/retrieve/Qm1234567890abcdef')
    })

    it('should retrieve decrypted content', async () => {
      const mockBlob = new Blob(['decrypted content'], { type: 'text/plain' })

      mockHttp.mockGet('/storage/retrieve/Qm1234567890abcdef', mockBlob)

      const result = await storageClient.retrieve('Qm1234567890abcdef', { decrypt: true })

      expect(result).toEqual(mockBlob)
    })
  })
})
