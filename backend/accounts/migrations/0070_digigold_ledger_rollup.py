from django.db import migrations, models
from django.db.models import Case, CharField, Count, DecimalField, F, Sum, Value, When
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone


def backfill_ledger_rollups(apps, schema_editor):
    Investment = apps.get_model('accounts', 'DigiGoldInvestment')
    MetalOrder = apps.get_model('accounts', 'MetalOrder')
    Rollup = apps.get_model('accounts', 'DigiGoldLedgerRollup')
    database = schema_editor.connection.alias
    local_tz = timezone.get_current_timezone()

    category = Case(
        When(user__role='admin', then=Value('super_stockist')),
        When(user__role='dealer', then=Value('distributor')),
        When(user__role='sub_dealer', then=Value('wholesale_dealer')),
        When(user__role='promotor', then=Value('retailer')),
        When(user__role='customer', user__customer_profile__created_by__isnull=False, then=Value('customer')),
        default=Value('general_customer'),
        output_field=CharField(max_length=24),
    )

    def write_groups(queryset, source):
        pending = []
        for group in queryset.iterator(chunk_size=2000):
            pending.append(Rollup(
                day=group['rollup_day'],
                hour=group['rollup_hour'],
                source=source,
                status=group['status'],
                transaction_type=group['rollup_type'],
                metal=group['rollup_metal'],
                user_category=group['rollup_category'],
                transaction_count=group['transaction_count'],
                amount_inr=group['amount_total'] or 0,
                weight_grams=group['weight_total'] or 0,
            ))
            if len(pending) >= 1000:
                Rollup.objects.using(database).bulk_create(pending, batch_size=1000)
                pending = []
        if pending:
            Rollup.objects.using(database).bulk_create(pending, batch_size=1000)

    # Clear partial rows if an interrupted non-atomic migration is retried.
    Rollup.objects.using(database).all().delete()

    investment_groups = Investment.objects.using(database).annotate(
        rollup_day=TruncDate('created_at', tzinfo=local_tz),
        rollup_hour=ExtractHour('created_at', tzinfo=local_tz),
        rollup_type=models.F('transaction_type'),
        rollup_metal=Case(
            When(notes__icontains='silver', then=Value('silver')),
            default=Value('gold'), output_field=CharField(max_length=8),
        ),
        rollup_category=category,
    ).values(
        'rollup_day', 'rollup_hour', 'status', 'rollup_type', 'rollup_metal', 'rollup_category',
    ).annotate(
        transaction_count=Count('pk'),
        amount_total=Sum('recharge_amount'),
        weight_total=Sum(Case(
            When(hold_gold_gm__gt=0, then=F('hold_gold_gm')),
            default=F('hold_gold_mg') / Value(1000),
            output_field=DecimalField(max_digits=18, decimal_places=6),
        )),
    ).order_by()
    write_groups(investment_groups, 'investment')

    order_groups = MetalOrder.objects.using(database).annotate(
        rollup_day=TruncDate('created_at', tzinfo=local_tz),
        rollup_hour=ExtractHour('created_at', tzinfo=local_tz),
        rollup_type=Value('buy', output_field=CharField(max_length=20)),
        rollup_metal=Case(
            When(metal_type__icontains='silver', then=Value('silver')),
            default=Value('gold'), output_field=CharField(max_length=8),
        ),
        rollup_category=category,
    ).values(
        'rollup_day', 'rollup_hour', 'status', 'rollup_type', 'rollup_metal', 'rollup_category',
    ).annotate(
        transaction_count=Count('pk'),
        amount_total=Sum('total_amount'),
        weight_total=Sum('weight_grams'),
    ).order_by()
    write_groups(order_groups, 'metal_order')


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('accounts', '0069_digigoldinvestment_recent_index'),
    ]

    operations = [
        migrations.CreateModel(
            name='DigiGoldLedgerRollup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.DateField()),
                ('hour', models.PositiveSmallIntegerField()),
                ('source', models.CharField(choices=[('investment', 'DigiGold investment'), ('metal_order', 'Metal order')], max_length=16)),
                ('status', models.CharField(max_length=20)),
                ('transaction_type', models.CharField(max_length=20)),
                ('metal', models.CharField(choices=[('gold', 'Gold'), ('silver', 'Silver')], max_length=8)),
                ('user_category', models.CharField(max_length=24)),
                ('transaction_count', models.PositiveBigIntegerField(default=0)),
                ('amount_inr', models.DecimalField(decimal_places=2, default=0, max_digits=24)),
                ('weight_grams', models.DecimalField(decimal_places=6, default=0, max_digits=24)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddConstraint(
            model_name='digigoldledgerrollup',
            constraint=models.UniqueConstraint(
                fields=('day', 'hour', 'source', 'status', 'transaction_type', 'metal', 'user_category'),
                name='digi_gold_rollup_unique',
            ),
        ),
        migrations.AddIndex(
            model_name='digigoldledgerrollup',
            index=models.Index(fields=['day', 'metal', 'status'], name='dglr_date_metal'),
        ),
        migrations.AddIndex(
            model_name='digigoldledgerrollup',
            index=models.Index(fields=['day', 'user_category', 'status'], name='dglr_date_category'),
        ),
        migrations.RunPython(backfill_ledger_rollups, migrations.RunPython.noop),
    ]
