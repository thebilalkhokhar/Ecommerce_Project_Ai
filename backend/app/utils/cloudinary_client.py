import cloudinary
import cloudinary.uploader

from app.core.config import settings


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUD_NAME,
        api_key=settings.CLOUD_API_KEY,
        api_secret=settings.CLOUD_API_SECRET,
    )


def upload_image(file_bytes: bytes, *, folder: str = "ecommerce/products") -> str:
    configure_cloudinary()
    result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="image",
        folder=folder,
    )
    return str(result["secure_url"])
