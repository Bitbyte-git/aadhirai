from decimal import Decimal

from django.db import transaction
from django.core.cache import cache
from django.db.models import F
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import CustomerProfile, DigiGoldInvestment, DigiGoldLedgerRollup, MetalOrder, User, JewelryProduct, JewelryOrder


@receiver(post_save, sender=JewelryProduct)
@receiver(post_delete, sender=JewelryProduct)
@receiver(post_save, sender=JewelryOrder)
@receiver(post_delete, sender=JewelryOrder)
def invalidate_storefront_sales_ranking(sender, **kwargs):
    transaction.on_commit(lambda: cache.delete('storefront:fast-moving:ranked-ids:v2'))


def _category_for_user(user_id, role):
    if role == 'admin':
        return 'super_stockist'
    if role == 'dealer':
        return 'distributor'
    if role == 'sub_dealer':
        return 'wholesale_dealer'
    if role == 'promotor':
        return 'retailer'
    if role == 'customer':
        created_by_id = CustomerProfile.objects.filter(user_id=user_id).values_list('created_by_id', flat=True).first()
        return 'customer' if created_by_id else 'general_customer'
    return 'general_customer'


def _rollup_values(instance, source):
    local_time = timezone.localtime(instance.created_at)
    role = instance.user.role
    if source == 'investment':
        is_silver = 'silver' in (instance.notes or '').lower()
        metal = 'silver' if is_silver else 'gold'
        transaction_type = instance.transaction_type
        amount = Decimal(instance.recharge_amount or 0)
        weight = Decimal(instance.hold_gold_gm or 0)
        if not weight and instance.hold_gold_mg:
            weight = Decimal(instance.hold_gold_mg) / Decimal('1000')
        status = instance.status
    else:
        metal = 'silver' if 'silver' in (instance.metal_type or '').lower() else 'gold'
        transaction_type = 'buy'
        amount = Decimal(instance.total_amount or 0)
        weight = Decimal(instance.weight_grams or 0)
        status = instance.status

    return {
        'day': local_time.date(),
        'hour': local_time.hour,
        'source': source,
        'status': status,
        'transaction_type': transaction_type,
        'metal': metal,
        'user_category': _category_for_user(instance.user_id, role),
        'amount_inr': amount,
        'weight_grams': weight,
    }


def _adjust_rollup(values, direction):
    key = {field: values[field] for field in (
        'day', 'hour', 'source', 'status', 'transaction_type', 'metal', 'user_category'
    )}
    amount_delta = values['amount_inr'] * direction
    weight_delta = values['weight_grams'] * direction
    with transaction.atomic():
        if direction < 0:
            updated = DigiGoldLedgerRollup.objects.filter(**key).update(
                transaction_count=F('transaction_count') + direction,
                amount_inr=F('amount_inr') + amount_delta,
                weight_grams=F('weight_grams') + weight_delta,
                updated_at=timezone.now(),
            )
            if updated:
                DigiGoldLedgerRollup.objects.filter(**key, transaction_count__lte=0).delete()
            return
        row, created = DigiGoldLedgerRollup.objects.get_or_create(
            **key,
            defaults={
                'transaction_count': direction,
                'amount_inr': amount_delta,
                'weight_grams': weight_delta,
            },
        )
        if not created:
            DigiGoldLedgerRollup.objects.filter(pk=row.pk).update(
                transaction_count=F('transaction_count') + direction,
                amount_inr=F('amount_inr') + amount_delta,
                weight_grams=F('weight_grams') + weight_delta,
                updated_at=timezone.now(),
            )
            DigiGoldLedgerRollup.objects.filter(pk=row.pk, transaction_count__lte=0).delete()


def _capture_previous(sender, instance, source):
    if not instance.pk:
        instance._digi_rollup_previous = None
        return
    previous = sender.objects.filter(pk=instance.pk).select_related('user').first()
    instance._digi_rollup_previous = _rollup_values(previous, source) if previous else None


@receiver(pre_save, sender=DigiGoldInvestment)
def capture_investment_rollup(sender, instance, **kwargs):
    _capture_previous(sender, instance, 'investment')


@receiver(post_save, sender=DigiGoldInvestment)
def update_investment_rollup(sender, instance, **kwargs):
    previous = getattr(instance, '_digi_rollup_previous', None)
    saved = sender.objects.select_related('user').get(pk=instance.pk)
    current = _rollup_values(saved, 'investment')
    if previous == current:
        return
    if previous:
        _adjust_rollup(previous, -1)
    _adjust_rollup(current, 1)


@receiver(post_delete, sender=DigiGoldInvestment)
def delete_investment_rollup(sender, instance, **kwargs):
    _adjust_rollup(_rollup_values(instance, 'investment'), -1)


@receiver(pre_save, sender=MetalOrder)
def capture_metal_order_rollup(sender, instance, **kwargs):
    _capture_previous(sender, instance, 'metal_order')


@receiver(post_save, sender=MetalOrder)
def update_metal_order_rollup(sender, instance, **kwargs):
    previous = getattr(instance, '_digi_rollup_previous', None)
    saved = sender.objects.select_related('user').get(pk=instance.pk)
    current = _rollup_values(saved, 'metal_order')
    if previous == current:
        return
    if previous:
        _adjust_rollup(previous, -1)
    _adjust_rollup(current, 1)


@receiver(post_delete, sender=MetalOrder)
def delete_metal_order_rollup(sender, instance, **kwargs):
    _adjust_rollup(_rollup_values(instance, 'metal_order'), -1)


def _move_user_category(user_id, previous_category, current_category):
    if previous_category == current_category:
        return
    # Promotions and creator changes must move existing transactions too.
    with transaction.atomic():
        for model, source in ((DigiGoldInvestment, 'investment'), (MetalOrder, 'metal_order')):
            rows = model.objects.filter(user_id=user_id).select_related('user')
            for row in rows.iterator(chunk_size=1000):
                values = _rollup_values(row, source)
                values['user_category'] = previous_category
                _adjust_rollup(values, -1)
                values['user_category'] = current_category
                _adjust_rollup(values, 1)


@receiver(pre_save, sender=User)
def capture_user_category(sender, instance, **kwargs):
    previous_role = sender.objects.filter(pk=instance.pk).values_list('role', flat=True).first()
    instance._digi_previous_category = (
        _category_for_user(instance.pk, previous_role) if previous_role else None
    )


@receiver(post_save, sender=User)
def update_user_category(sender, instance, **kwargs):
    previous = getattr(instance, '_digi_previous_category', None)
    if previous is not None:
        role = sender.objects.values_list('role', flat=True).get(pk=instance.pk)
        _move_user_category(instance.pk, previous, _category_for_user(instance.pk, role))


@receiver(pre_save, sender=CustomerProfile)
def capture_customer_category(sender, instance, **kwargs):
    role = User.objects.values_list('role', flat=True).get(pk=instance.user_id)
    instance._digi_previous_category = _category_for_user(instance.user_id, role)


@receiver(post_save, sender=CustomerProfile)
def update_customer_category(sender, instance, **kwargs):
    role = User.objects.values_list('role', flat=True).get(pk=instance.user_id)
    previous = getattr(instance, '_digi_previous_category', None)
    if previous is not None:
        _move_user_category(instance.user_id, previous, _category_for_user(instance.user_id, role))


@receiver(post_delete, sender=CustomerProfile)
def delete_customer_category(sender, instance, **kwargs):
    role = User.objects.filter(pk=instance.user_id).values_list('role', flat=True).first()
    if role == 'customer' and instance.created_by_id:
        _move_user_category(instance.user_id, 'customer', 'general_customer')


@receiver(pre_delete, sender=User)
def capture_created_customer_categories(sender, instance, **kwargs):
    # SET_NULL updates issued by Django's deletion collector do not emit save
    # signals. Retain the surviving customers before their creator is deleted.
    instance._digi_created_customer_ids = list(CustomerProfile.objects.filter(
        created_by_id=instance.pk, user__role='customer',
    ).values_list('user_id', flat=True))


@receiver(post_delete, sender=User)
def update_created_customer_categories(sender, instance, **kwargs):
    for user_id in getattr(instance, '_digi_created_customer_ids', []):
        role = User.objects.filter(pk=user_id).values_list('role', flat=True).first()
        if role:
            _move_user_category(user_id, 'customer', _category_for_user(user_id, role))
