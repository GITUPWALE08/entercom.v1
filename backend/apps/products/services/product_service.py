from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.products.models import Product, ProductImage, ProductCategory, ProductStatus
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger, resolve_actor_type
from core.permissions import require_permission

class ProductService:
    """
    Acts as the sole orchestrator for product metadata, flexible JSON attributes, and media constraints.
    """
    @staticmethod
    @transaction.atomic
    def create_product(actor, correlation_id, category_id, name, unit_price, quantity_available, low_stock_threshold, sku, description=None, attributes=None, images=None):
        require_permission(actor, 'product.create')
        
        category = ProductCategory.objects.filter(id=category_id).first()
        if not category:
            raise ValidationError("Category does not exist.")

        if images and len(images) > 4:
            raise ValidationError("A product can have a maximum of 4 images.")

        product = Product.objects.create(
            category=category,
            name=name,
            sku=sku,
            description=description,
            attributes=attributes,
            unit_price=unit_price,
            quantity_available=quantity_available,
            low_stock_threshold=low_stock_threshold,
            status=ProductStatus.ACTIVE
        )

        if images:
            for idx, image_url in enumerate(images):
                ProductImage.objects.create(
                    product=product,
                    image_url=image_url,
                    order_index=idx
                )

        audit_logger.log(
            action='product.created',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id),
                'category_id': str(category.id),
                'sku': sku
            }
        )

        event_publisher.publish(
            event_name='product.created',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='ProductService',
            data={
                'product_id': str(product.id),
                'category_id': str(category.id),
                'name': product.name,
                'sku': sku,
                'quantity_available': product.quantity_available,
                'low_stock_threshold': product.low_stock_threshold,
                'is_active': product.status == ProductStatus.ACTIVE
            }
        )
        return product

    @staticmethod
    @transaction.atomic
    def update_product(actor, correlation_id, product_id, changed_fields):
        require_permission(actor, 'product.update')
        product = Product.objects.select_for_update().filter(id=product_id).first()
        if not product:
            raise ValidationError("Product not found.")

        images = changed_fields.get('images')
        if images is not None:
            if len(images) > 4:
                raise ValidationError("A product can have a maximum of 4 images.")
            product.images.all().delete()
            for idx, image_url in enumerate(images):
                ProductImage.objects.create(
                    product=product,
                    image_url=image_url,
                    order_index=idx
                )

        allowed_fields = ['name', 'description', 'attributes', 'unit_price', 'quantity_available', 'low_stock_threshold']
        for field in allowed_fields:
            if field in changed_fields:
                setattr(product, field, changed_fields[field])
        product.save()

        audit_logger.log(
            action='product.updated',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id),
                'changed_fields': list(changed_fields.keys())
            }
        )

        event_publisher.publish(
            event_name='product.updated',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='ProductService',
            data={
                'product_id': str(product.id),
                'changed_fields': list(changed_fields.keys())
            }
        )
        return product

    @staticmethod
    @transaction.atomic
    def archive_product(actor, correlation_id, product_id):
        require_permission(actor, 'product.archive')
        product = Product.objects.select_for_update().filter(id=product_id).first()
        if not product:
            raise ValidationError("Product not found.")
        
        product.status = ProductStatus.ARCHIVED
        product.save()

        audit_logger.log(
            action='product.archived',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id)
            }
        )

        event_publisher.publish(
            event_name='product.archived',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='ProductService',
            data={
                'product_id': str(product.id)
            }
        )
        return product
