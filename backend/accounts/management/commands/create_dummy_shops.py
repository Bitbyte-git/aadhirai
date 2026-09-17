import random
from django.core.management.base import BaseCommand
from django.db import IntegrityError
from accounts.models import User, ShopProfile

CITIES = [
    ('Chennai', 'Chennai', 'Tamil Nadu', '600001'),
    ('Coimbatore', 'Coimbatore', 'Tamil Nadu', '641001'),
    ('Madurai', 'Madurai', 'Tamil Nadu', '625001'),
    ('Trichy', 'Tiruchirappalli', 'Tamil Nadu', '620001'),
    ('Salem', 'Salem', 'Tamil Nadu', '636001'),
    ('Erode', 'Erode', 'Tamil Nadu', '638001'),
    ('Vellore', 'Vellore', 'Tamil Nadu', '632001'),
    ('Tirunelveli', 'Tirunelveli', 'Tamil Nadu', '627001'),
    ('Namakkal', 'Namakkal', 'Tamil Nadu', '637001'),
    ('Karur', 'Karur', 'Tamil Nadu', '639001'),
]

SHOP_WORDS = [
    'Jewellers', 'Gold Palace', 'Jewellery', 'Ornaments', 'Gold House',
    'Silver Palace', 'Jewels', 'Gold Mart', 'Jewel Studio', 'Gold Point',
]

OWNER_FIRST = [
    'Senthil', 'Karthik', 'Vignesh', 'Prakash', 'Suresh', 'Ramesh', 'Vijay',
    'Mani', 'Rajesh', 'Ganesh', 'Anand', 'Bala', 'Dinesh', 'Muthu', 'Naveen',
]

DUMMY_PASSWORD = "Senthil@2026"


class Command(BaseCommand):
    help = (
        'Create a dummy recursive Shop hierarchy under Super Admin. '
        'Each node gets a random 2-4 children, repeated down to --max-depth levels. '
        'A --limit safety cap stops creation early (use --limit 0 to remove the cap '
        'and generate the full, very large tree).'
    )

    def add_arguments(self, parser):
        parser.add_argument('--roots', type=int, default=6, help='Number of top-level shops directly under Super Admin')
        parser.add_argument('--min-children', type=int, default=2, help='Minimum children per shop')
        parser.add_argument('--max-children', type=int, default=4, help='Maximum children per shop')
        parser.add_argument('--max-depth', type=int, default=10, help='Maximum depth of the tree (root = level 1)')
        parser.add_argument('--limit', type=int, default=300, help='Safety cap on total shops created. 0 = no cap (WARNING: with default branching/depth this can exceed 150,000 records)')
        parser.add_argument('--admin_email', type=str, default=None, help='Email of the super_admin user to own the root shops (default: first super_admin found)')

    def handle(self, *args, **options):
        roots = options['roots']
        min_c = options['min_children']
        max_c = options['max_children']
        max_depth = options['max_depth']
        limit = options['limit']
        admin_email = options['admin_email']

        if admin_email:
            try:
                super_admin_user = User.objects.get(email=admin_email, role='super_admin')
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"No super_admin found with email={admin_email}"))
                return
        else:
            super_admin_user = User.objects.filter(role='super_admin').first()
            if not super_admin_user:
                self.stdout.write(self.style.ERROR("No super_admin user exists! Create one first."))
                return

        if limit and limit > 0:
            self.stdout.write(self.style.WARNING(
                f"Safety cap active: will stop creating once {limit} shops exist "
                f"(pass --limit 0 to remove the cap and build the full {roots}-root, "
                f"{min_c}-{max_c} branching, {max_depth}-level tree)."
            ))

        counter = ShopProfile.objects.count()
        created = 0

        def make_shop(created_by_user, depth):
            nonlocal counter, created
            city, district, state, pincode = random.choice(CITIES)
            owner = random.choice(OWNER_FIRST)
            word = random.choice(SHOP_WORDS)
            shop_type = random.choice(['live', 'virtual'])

            user = None
            while user is None:
                counter += 1
                email = f"dummyshop{counter}@bitbyte.test"
                try:
                    user = User.objects.create_user(email=email, password=DUMMY_PASSWORD, role='shop')
                except IntegrityError:
                    continue
            profile = ShopProfile.objects.create(
                user=user,
                created_by=created_by_user,
                shop_name=f"{owner} {word} {counter:05d}",
                owner_name=owner,
                mobile_number=f"9{random.randint(100000000, 999999999)}",
                whatsapp_number=f"9{random.randint(100000000, 999999999)}",
                shop_address=f"No. {random.randint(1, 200)}, Main Road",
                pincode=pincode,
                street_name="Main Street",
                city=city,
                district=district,
                state=state,
                shop_type=shop_type,
                pan_no=f"SH{random.randint(100000, 999999)}",
            )
            created += 1
            self.stdout.write(self.style.SUCCESS(
                f"[depth {depth}] Created {profile.shop_id} '{profile.shop_name}' ({shop_type}) -> {email} / {DUMMY_PASSWORD}"
            ))
            return user

        # BFS: (created_by_user, depth)
        queue = []
        for _ in range(roots):
            if limit and limit > 0 and created >= limit:
                break
            root_user = make_shop(super_admin_user, depth=1)
            queue.append((root_user, 1))

        while queue:
            parent_user, depth = queue.pop(0)
            if depth >= max_depth:
                continue
            if limit and limit > 0 and created >= limit:
                break
            num_children = random.randint(min_c, max_c)
            for _ in range(num_children):
                if limit and limit > 0 and created >= limit:
                    break
                child_user = make_shop(parent_user, depth=depth + 1)
                queue.append((child_user, depth + 1))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {created} dummy shops (password for all: {DUMMY_PASSWORD})."
        ))
        if limit and limit > 0 and created >= limit:
            self.stdout.write(self.style.WARNING(
                f"Stopped at the --limit={limit} safety cap before reaching max-depth={max_depth} "
                f"for every branch. Re-run with a higher --limit (or --limit 0) to go deeper."
            ))
