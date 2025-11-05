"""Custom exceptions and error handlers for the InsightFace REST API."""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception class for API errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ImageProcessingError(APIError):
    """Exception raised when image processing fails."""

    def __init__(self, message: str = "Failed to process image", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="IMAGE_PROCESSING_ERROR",
            details=details
        )


class ImageDownloadError(APIError):
    """Exception raised when image download fails."""

    def __init__(self, message: str = "Failed to download image", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="IMAGE_DOWNLOAD_ERROR",
            details=details
        )


class ImageValidationError(APIError):
    """Exception raised when image validation fails."""

    def __init__(self, message: str = "Invalid image data", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="IMAGE_VALIDATION_ERROR",
            details=details
        )


class ModelInferenceError(APIError):
    """Exception raised when model inference fails."""

    def __init__(self, message: str = "Model inference failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="MODEL_INFERENCE_ERROR",
            details=details
        )


class ResourceLimitError(APIError):
    """Exception raised when resource limits are exceeded."""

    def __init__(self, message: str = "Resource limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="RESOURCE_LIMIT_ERROR",
            details=details
        )


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """Handle custom API errors with structured responses."""
    logger.error(
        f"API Error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors with structured responses."""
    logger.warning(
        f"Validation Error: {exc.errors()}",
        extra={"path": request.url.path}
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"validation_errors": exc.errors()}
            }
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions with structured responses."""
    logger.error(
        f"HTTP Exception: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": {}
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with generic error responses."""
    logger.exception(
        f"Unhandled Exception: {type(exc).__name__}",
        extra={
            "path": request.url.path,
            "exception_type": type(exc).__name__
        }
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {}
            }
        }
    )
