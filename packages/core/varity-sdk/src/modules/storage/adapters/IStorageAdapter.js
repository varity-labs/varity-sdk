/**
 * Varity SDK - Storage Adapter Interface
 *
 * Base interface that ALL storage backends must implement to ensure
 * consistent behavior across Filecoin, S3, GCS, and multi-tier storage.
 *
 * This interface provides a unified API for storage operations regardless
 * of the underlying backend, enabling seamless migration and multi-backend support.
 *
 * @packageDocumentation
 */
/**
 * Error thrown when an operation is not supported by the backend
 */
export class UnsupportedOperationError extends Error {
    constructor(operation, backend) {
        super(`Operation '${operation}' is not supported by backend '${backend}'`);
        this.name = 'UnsupportedOperationError';
    }
}
/**
 * Base abstract class implementing common adapter functionality
 *
 * Adapters can extend this class to inherit common behavior
 * and only implement backend-specific methods.
 */
export class BaseStorageAdapter {
    backend;
    constructor(backend) {
        this.backend = backend;
    }
    getBackendType() {
        return this.backend;
    }
    /**
     * Default copy implementation (download + upload)
     */
    async copy(source, destination) {
        throw new UnsupportedOperationError('copy', this.backend);
    }
    /**
     * Default move implementation (copy + delete)
     */
    async move(source, destination) {
        throw new UnsupportedOperationError('move', this.backend);
    }
    /**
     * Default getAccessUrl implementation
     */
    async getAccessUrl(identifier, expiresIn) {
        throw new UnsupportedOperationError('getAccessUrl', this.backend);
    }
    /**
     * Default updateMetadata implementation
     */
    async updateMetadata(identifier, metadata) {
        throw new UnsupportedOperationError('updateMetadata', this.backend);
    }
    /**
     * Default healthCheck implementation
     */
    async healthCheck() {
        const start = Date.now();
        try {
            // Try to list a single item to check connectivity
            await this.list({ maxResults: 1 });
            return {
                healthy: true,
                latencyMs: Date.now() - start
            };
        }
        catch (error) {
            return {
                healthy: false,
                latencyMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
// All exports already declared above (IStorageAdapter interface on line 40,
// UnsupportedOperationError and BaseStorageAdapter classes on lines 266 and 279)
//# sourceMappingURL=IStorageAdapter.js.map