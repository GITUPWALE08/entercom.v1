from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.products.models import ProductCategory, CategoryStatus
from apps.products.services.product_service import ProductService
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger, resolve_actor_type
from core.permissions import require_permission

class CategoryService:
    """
    Manages the product classification hierarchy.
    """
    @staticmethod
    @transaction.atomic
    def create_category(actor, correlation_id, name, slug, description=None):
        require_permission(actor, 'category.create')
        if ProductCategory.objects.filter(slug=slug).exists():
            raise ValidationError("Category slug must be unique.")
            
        category = ProductCategory.objects.create(
            name=name,
            slug=slug,
            description=description,
            status=CategoryStatus.ACTIVE
        )

        audit_logger.log(
            action='category.created',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'category_id': str(category.id),
                'slug': category.slug
            }
        )

        event_publisher.publish(
            event_name='category.created',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='CategoryService',
            data={
                'category_id': str(category.id),
                'name': category.name,
                'slug': category.slug
            }
        )
        return category

    @staticmethod
    @transaction.atomic
    def update_category(actor, correlation_id, category_id, changed_fields):
        require_permission(actor, 'category.update')
        category = ProductCategory.objects.select_for_update().filter(id=category_id).first()
        if not category:
            raise ValidationError("Category not found.")

        if 'slug' in changed_fields and ProductCategory.objects.exclude(id=category_id).filter(slug=changed_fields['slug']).exists():
            raise ValidationError("Category slug must be unique.")

        for field in ['name', 'slug', 'description']:
            if field in changed_fields:
                setattr(category, field, changed_fields[field])
        category.save()

        audit_logger.log(
            action='category.updated',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'category_id': str(category.id),
                'changed_fields': list(changed_fields.keys())
            }
        )

        event_publisher.publish(
            event_name='category.updated',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='CategoryService',
            data={
                'category_id': str(category.id),
                'changed_fields': list(changed_fields.keys())
            }
        )
        return category

    @staticmethod
    @transaction.atomic
    def archive_category(actor, correlation_id, category_id):
        require_permission(actor, 'category.archive')
        category = ProductCategory.objects.select_for_update().filter(id=category_id).first()
        if not category:
            raise ValidationError("Category not found.")
            
        if category.status == CategoryStatus.ARCHIVED:
            return category

        category.status = CategoryStatus.ARCHIVED
        category.save()
        
        for product in category.products.all():
            ProductService.archive_product(actor, correlation_id, product.id)

        audit_logger.log(
            action='category.archived',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'category_id': str(category.id)
            }
        )

        event_publisher.publish(
            event_name='category.archived',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='CategoryService',
            data={
                'category_id': str(category.id)
            }
        )
        return category
