from typing import Any, Generic, TypeVar

from django.db import models

ModelT = TypeVar("ModelT", bound=models.Model)


class BaseRepository(Generic[ModelT]):
    """Thin persistence helper — no HTTP or workflow rules."""

    def __init__(self, model: type[ModelT]):
        self.model = model

    def get_by_id(self, pk: Any) -> ModelT:
        return self.model.objects.get(pk=pk)
