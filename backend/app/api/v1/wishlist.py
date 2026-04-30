from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.product import ProductOut
from app.schemas.wishlist import WishlistOut
from app.services.crud import crud_wishlist

router = APIRouter()


@router.get("", response_model=list[WishlistOut])
def list_my_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WishlistOut]:
    items = crud_wishlist.list_wishlist_for_user(db, current_user.id)
    out: list[WishlistOut] = []
    for row in items:
        p = row.product
        out.append(
            WishlistOut(
                id=row.id,
                user_id=row.user_id,
                product=ProductOut.model_validate(p),
            )
        )
    return out


@router.post("/{product_id}/toggle", response_model=dict[str, str])
def toggle_wishlist_item(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    try:
        action = crud_wishlist.toggle_wishlist(db, current_user.id, product_id)
    except ValueError as exc:
        if str(exc) == "product_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            ) from exc
        raise
    return {"status": action}
