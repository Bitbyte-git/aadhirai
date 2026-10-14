from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0068_digigoldinvestment_digigoldwallet'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='digigoldinvestment',
            index=models.Index(
                fields=['user', 'status', '-created_at', '-id'],
                name='dg_inv_user_status_recent',
            ),
        ),
        migrations.AddIndex(
            model_name='jewelryorder',
            index=models.Index(
                fields=['product_category', '-created_at', '-id'],
                name='jwl_bullion_recent',
            ),
        ),
        migrations.AddIndex(
            model_name='digigoldinvestment',
            index=models.Index(
                fields=['status', '-created_at', '-id'],
                name='dg_inv_status_recent',
            ),
        ),
        migrations.AddIndex(
            model_name='metalorder',
            index=models.Index(
                fields=['status', '-created_at', '-id'],
                name='metal_order_recent',
            ),
        ),
        migrations.AddIndex(
            model_name='metalorder',
            index=models.Index(
                fields=['metal_type', 'status', '-created_at', '-id'],
                name='metal_order_metal_recent',
            ),
        ),
    ]
