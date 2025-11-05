import pydantic
from pydantic import BaseModel, validator, Field
from typing import Optional, List
from api_trt.settings import Settings

example_img = 'test_images/Stallone.jpg'
# Read runtime settings from environment variables
settings = Settings()

# Configuration constants for validation
MAX_IMAGES_PER_REQUEST = 50
MAX_IMAGE_DIMENSION = 4096
MIN_IMAGE_DIMENSION = 32


class Images(BaseModel):
    data: Optional[List[str]] = pydantic.Field(default=None, example=None, description='List of base64 encoded images')
    urls: Optional[List[str]] = pydantic.Field(default=None,
                                               example=[example_img],
                                               description='List of images urls')

    @validator('data', 'urls')
    def validate_images_list(cls, v, field):
        if v is not None:
            if len(v) == 0:
                raise ValueError(f'{field.name} list cannot be empty')
            if len(v) > MAX_IMAGES_PER_REQUEST:
                raise ValueError(f'{field.name} list cannot exceed {MAX_IMAGES_PER_REQUEST} images')
        return v

    @pydantic.root_validator
    def validate_at_least_one_source(cls, values):
        if values.get('data') is None and values.get('urls') is None:
            raise ValueError('Either data or urls must be provided')
        if values.get('data') is not None and values.get('urls') is not None:
            raise ValueError('Only one of data or urls should be provided, not both')
        return values


class BodyExtract(BaseModel):
    images: Images
    max_size: Optional[List[int]] = pydantic.Field(default=settings.models.max_size,
                                                   example=settings.models.max_size,
                                                   description='Resize all images to this proportions')

    threshold: Optional[float] = pydantic.Field(default=settings.defaults.det_thresh,
                                                example=settings.defaults.det_thresh,
                                                description='Detector threshold',
                                                ge=0.0, le=1.0)

    embed_only: Optional[bool] = pydantic.Field(default=False,
                                                example=False,
                                                description='Treat input images as face crops and omit detection step')

    return_face_data: Optional[bool] = pydantic.Field(default=settings.defaults.return_face_data,
                                                      example=settings.defaults.return_face_data,
                                                      description='Return face crops encoded in base64')

    return_landmarks: Optional[bool] = pydantic.Field(default=settings.defaults.return_landmarks,
                                                      example=settings.defaults.return_landmarks,
                                                      description='Return face landmarks')

    extract_embedding: Optional[bool] = pydantic.Field(default=settings.defaults.extract_embedding,
                                                       example=settings.defaults.extract_embedding,
                                                       description='Extract face embeddings (otherwise only detect \
                                                       faces)')

    extract_ga: Optional[bool] = pydantic.Field(default=settings.defaults.extract_ga,
                                                example=settings.defaults.extract_ga,
                                                description='Extract gender/age')

    detect_masks: Optional[bool] = pydantic.Field(default=settings.defaults.detect_masks,
                                                  example=settings.defaults.detect_masks,
                                                  description='Detect medical masks')

    limit_faces: Optional[int] = pydantic.Field(default=0,
                                                example=0,
                                                description='Maximum number of faces to be processed',
                                                ge=0, le=1000)

    min_face_size: Optional[int] = pydantic.Field(default=0,
                                                  example=0,
                                                  description='Ignore faces smaller than this size',
                                                  ge=0, le=1000)

    verbose_timings: Optional[bool] = pydantic.Field(default=False,
                                                     example=True,
                                                     description='Return all timings.')

    msgpack: Optional[bool] = pydantic.Field(default=False,
                                             example=False,
                                             description='Use MSGPACK for response serialization')

    @validator('max_size')
    def validate_max_size(cls, v):
        if v is not None and len(v) == 2:
            width, height = v
            if width < MIN_IMAGE_DIMENSION or height < MIN_IMAGE_DIMENSION:
                raise ValueError(f'Image dimensions must be at least {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}')
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                raise ValueError(f'Image dimensions cannot exceed {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}')
        return v


class BodyDraw(BaseModel):
    images: Images

    threshold: Optional[float] = pydantic.Field(default=settings.defaults.det_thresh,
                                                example=settings.defaults.det_thresh,
                                                description='Detector threshold',
                                                ge=0.0, le=1.0)

    draw_landmarks: Optional[bool] = pydantic.Field(default=True,
                                                    example=True,
                                                    description='Return face landmarks')

    draw_scores: Optional[bool] = pydantic.Field(default=True,
                                                 example=True,
                                                 description='Draw detection scores')

    draw_sizes: Optional[bool] = pydantic.Field(default=True,
                                                example=True,
                                                description='Draw face sizes')

    limit_faces: Optional[int] = pydantic.Field(default=0,
                                                example=0,
                                                description='Maximum number of faces to be processed',
                                                ge=0, le=1000)

    min_face_size: Optional[int] = pydantic.Field(default=0,
                                                  example=0,
                                                  description='Ignore faces smaller than this size',
                                                  ge=0, le=1000)

    detect_masks: Optional[bool] = pydantic.Field(default=settings.defaults.detect_masks,
                                                  example=settings.defaults.detect_masks,
                                                  description='Detect medical masks')

# Response Models

class ErrorDetail(BaseModel):
    """Error detail structure for API responses."""
    code: str = Field(..., description='Error code identifier')
    message: str = Field(..., description='Human-readable error message')
    details: dict = Field(default_factory=dict, description='Additional error details')


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: ErrorDetail


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str = Field(..., description='Service health status', example='healthy')
    version: str = Field(..., description='API version', example='0.9.0.0')


class BoundingBox(BaseModel):
    """Face bounding box coordinates."""
    x1: float
    y1: float
    x2: float
    y2: float


class InfoModels(BaseModel):
    """Model configuration information."""
    det_name: str = Field(..., description='Detection model name')
    rec_name: str = Field(..., description='Recognition model name')
    ga_name: Optional[str] = Field(None, description='Gender/age model name')
    mask_detector: Optional[str] = Field(None, description='Mask detector model name')
    inference_backend: str = Field(..., description='Inference backend (onnx/trt/triton)')
    max_size: List[int] = Field(..., description='Maximum image dimensions')
    det_batch_size: int = Field(..., description='Detection batch size')
    rec_batch_size: int = Field(..., description='Recognition batch size')
    force_fp16: bool = Field(..., description='Use FP16 precision')


class InfoDefaults(BaseModel):
    """Default configuration values."""
    return_face_data: bool
    return_landmarks: bool
    extract_embedding: bool
    extract_ga: bool
    detect_masks: bool
    det_thresh: float


class InfoResponse(BaseModel):
    """Response model for the /info endpoint."""
    version: str = Field(..., description='API version')
    tensorrt_version: Optional[str] = Field(None, description='TensorRT version if available')
    log_level: str = Field(..., description='Current log level')
    models: InfoModels = Field(..., description='Model configuration')
    defaults: InfoDefaults = Field(..., description='Default parameter values')
