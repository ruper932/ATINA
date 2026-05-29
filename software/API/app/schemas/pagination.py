# app/schemas/pagination.py
from math import ceil
from typing import Generic, List, TypeVar
from pydantic.generics import GenericModel

T = TypeVar("T")


class PaginatedResponse(GenericModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int

    @classmethod
    def create(cls, *, items: list[T], total: int, skip: int, limit: int):
        page = (skip // limit) + 1 if limit > 0 else 1
        total_pages = max(1, ceil(total / limit)) if limit > 0 else 1
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )