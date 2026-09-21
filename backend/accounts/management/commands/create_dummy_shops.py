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
        'The total --target shop budget is split EVENLY across the --roots root shops, '
        'then each root grows its own subtree depth-first within its own budget slice — '
        'this GUARANTEES every root actually has children (no empty roots), while depth '
        'naturally varies per branch (some deep, some shallow) as each slice runs out.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--roots', type=int, default=6, help='Number of top-level shops directly under Super Admin')
        parser.add_argument('--min-children', type=int, default=2, help='Minimum children per shop')
        parser.add_argument('--max-children', type=int, default=4, help='Maximum children per shop')
        parser.add_argument('--max-depth', type=int, default=10, help='Upper safety cap on tree depth (root = level 1) — actual depth per branch depends on budget')
        parser.add_argument('--target', type=int, default=500, help='Total number of shops to create (split evenly across --roots)')
        parser.add_argument('--admin_email', type=str, default=None, help='Email of the super_admin user to own the root shops (default: first super_admin found)')

    def handle(self, *args, **options):
        roots = options['roots']
        min_c = options['min_children']
        max_c = options['max_children']
        max_depth = options['max_depth']
        target = options['target']
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

        per_root_budget = target // roots
        remainder = target - (per_root_budget * roots)
        if per_root_budget <= min_c:
            self.stdout.write(self.style.ERROR(
                f"--target={target} split across --roots={roots} gives only {per_root_budget} shops per root — "
                f"too small to guarantee every root has children (needs > {min_c}). Raise --target."
            ))
            return

        self.stdout.write(self.style.SUCCESS(
            f"Splitting {target} shops across {roots} roots (~{per_root_budget} each). "
            f"Every root is guaranteed children; depth varies naturally per branch (up to {max_depth})."
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

        # Each root gets its OWN budget slice, grown depth-first (stack, not queue) —
        # this guarantees the root's own budget is spent going deep into ITS subtree
        # rather than being starved by other roots, so every root always has children.
        empty_roots = 0
        for i in range(roots):
            root_budget = per_root_budget + (1 if i < remainder else 0)
            root_user = make_shop(super_admin_user, depth=1)
            remaining = root_budget - 1  # root itself already consumed 1

            stack = [(root_user, 1)]
            while stack and remaining > 0:
                parent_user, depth = stack.pop()  # DFS — LIFO
                if depth >= max_depth:
                    continue
                num_children = min(random.randint(min_c, max_c), remaining)
                if num_children <= 0:
                    continue
                if parent_user is root_user and num_children < min_c:
                    empty_roots += 1  # budget ran out before the root itself got any children
                for _ in range(num_children):
                    if remaining <= 0:
                        break
                    child_user = make_shop(parent_user, depth=depth + 1)
                    remaining -= 1
                    stack.append((child_user, depth + 1))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {created} dummy shops (password for all: {DUMMY_PASSWORD})."
        ))
        if empty_roots:
            self.stdout.write(self.style.WARNING(
                f"{empty_roots} root(s) ended up with fewer than {min_c} children — "
                f"raise --target for a bigger per-root budget if every root must have children."
            ))
