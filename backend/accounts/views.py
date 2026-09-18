from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from .models import User, AdminProfile, DealerProfile, SubDealerProfile, PromotorProfile, CustomerProfile, ShopProfile, Announcement, AnnouncementReply, ProfileUpdateRequest, MetalRate, MetalOrder, JewelryProduct, JewelryProductImage, HomeBanner, CartItem, Wishlist, JewelryOrder, CoinRequest, CoinRequestItem, CoinStock, DailyLoginLog, CoinRewardLog, ReferralLink, EmailOTP, Wallet, CoinRecharge, AutoPayMandate, JewelryStock, JewelryRequest, JewelryRequestItem, OrderTrackingEvent
from django.db.models import Prefetch, Count, Q, Sum, Max
from django.core.cache import cache   # ── NEW: for month_rollup/status caching ──
from django.db.models.functions import TruncHour, TruncDate, TruncWeek, TruncMonth
from .serializers import *
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
# pyrefly: ignore [missing-import]
from django.db.models.functions import TruncMonth
import razorpay
import hmac
import hashlib
import random
import string
import threading
from django.conf import settings
from io import BytesIO
from django.http import FileResponse, HttpResponse
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Polygon, Line, Circle
# pyrefly: ignore [missing-import]
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q 

# ── NEW: Monthly target status logic ──
MONTHLY_TARGET = 10

def get_target_status(order_count):
    if order_count >= MONTHLY_TARGET:
        return 'green'
    elif order_count >= 7:
        return 'yellow'
    elif order_count >= 1:
        return 'orange'
    else:
        return 'red'

STATUS_SEVERITY = {'red': 0, 'orange': 1, 'yellow': 2, 'green': 3}

def worst_status(statuses):
    """Worst (lowest) status among children. No children => red."""
    if not statuses:
        return 'red'
    return min(statuses, key=lambda s: STATUS_SEVERITY[s])


# ── NEW: recursive customer node builder — customer kீழ customer, evלavu level venalum cover pannும் ──
def build_customer_node(c, children_by_creator, order_counts):
    own_count = order_counts.get(c.user_id, 0)
    nested = [
        build_customer_node(sc, children_by_creator, order_counts)
        for sc in children_by_creator.get(c.user_id, [])
    ]
    total_count = own_count + sum(n['order_count'] for n in nested)
    status = worst_status([get_target_status(own_count)] + [n['status'] for n in nested])
    return {
        'id': c.id,
        'user_id': c.user_id,
        'customer_id': c.customer_id,
        'first_name': c.first_name,
        'last_name': c.last_name,
        'mobile_number': c.mobile_number,
        'city_name': c.city_name,
        'order_count': total_count,
        'status': status,
        'customers': nested,   # ← same key name 'customers' — frontend-ku label maatha vendam
    }


# ── NEW: Reward coin values ──
REWARD_COINS = {
    'first_login': 5,
    'daily_login': 1,
    'bonus_10': 3,
    'bonus_20': 6,
    'bonus_30': 10,
}

def _grant_login_reward(user, reward_type, coins, date):
    """Logs the reward (CoinRewardLog — powers the admin-facing Rewards page)
    AND actually pays it out: credits the real wallet balance + writes a
    CoinRecharge ledger row (source='reward') so it shows up in the user's
    own Recharge/Wallet transaction history. Previously CoinRewardLog.create()
    was called alone — the reward was recorded but never reached the user's
    spendable balance or their visible history, a real (now-fixed) bug."""
    CoinRewardLog.objects.create(user=user, reward_type=reward_type, coins=coins, date=date)

    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.balance_coins += coins
    wallet.save(update_fields=['balance_coins'])

    CoinRecharge.objects.create(
        user=user, amount_paid=Decimal('0.00'), coins_credited=coins,
        payment_method='reward', status='success',
        entry_type='credit', source='reward',
    )


def get_login_streak(user, upto_date):
    """upto_date-la irundhu backward-a consecutive days evlo login pannirukanga nu count pannum.
    Calendar month boundary-ku ulle mattum count pannும் — month maarina streak reset aagும்.
    Single query — month start to upto_date varaikkum fetch panni Python-la loop pannurom."""
    month_start = upto_date.replace(day=1)
    logged_dates = set(
        DailyLoginLog.objects.filter(
            user=user,
            login_date__gte=month_start,
            login_date__lte=upto_date,
        ).values_list('login_date', flat=True)
    )
    streak = 0
    day = upto_date
    while day >= month_start and day in logged_dates:
        streak += 1
        day -= timedelta(days=1)
    return streak

# ── NEW: level/position map — Admin=2 ... Customer=6 (super_admin=1 rewards-la varaadhu) ──
ROLE_LEVEL = {'admin': 2, 'dealer': 3, 'sub_dealer': 4, 'promotor': 5, 'customer': 6}
ROLE_LABEL = {'admin': 'Admin', 'dealer': 'Dealer', 'sub_dealer': 'Sub Dealer', 'promotor': 'Promotor', 'customer': 'Customer'}

def get_user_display_info(user):
    role_map = {
        'admin': ('admin_profile', 'admin_id'),
        'dealer': ('dealer_profile', 'dealer_id'),
        'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
        'promotor': ('promotor_profile', 'promotor_id'),
        'customer': ('customer_profile', 'customer_id'),
    }
    if user.role in role_map:
        attr, id_field = role_map[user.role]
        try:
            p = getattr(user, attr)
            return {
                'user_id_str': getattr(p, id_field, None),
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'phone': p.mobile_number,
                'level': ROLE_LEVEL.get(user.role),
                'position': ROLE_LABEL.get(user.role),
            }
        except Exception:
            pass
    if user.role == 'super_admin':
        return {
            'user_id_str': 'SUPER_ADMIN',
            'name': 'Super Admin',
            'phone': getattr(user, 'email', ''),
            'level': 0,
            'position': 'Super Admin',
        }
    return {'user_id_str': None, 'name': user.email, 'phone': None, 'level': None, 'position': None}


def _bulk_user_display_map(users):
    """Bulk version of get_user_display_info — {user_id: {...}} — one query
    per role instead of one query per user, same N+1 reasoning as
    _bulk_profile_id_map above (used for rendering reward/transaction lists)."""
    role_profile_map = {
        'admin': (AdminProfile, 'admin_id'), 'dealer': (DealerProfile, 'dealer_id'),
        'sub_dealer': (SubDealerProfile, 'sub_dealer_id'), 'promotor': (PromotorProfile, 'promotor_id'),
        'customer': (CustomerProfile, 'customer_id'),
    }
    ids_by_role = {}
    for u in users:
        ids_by_role.setdefault(u.role, set()).add(u.id)

    result = {}
    for role, user_ids in ids_by_role.items():
        cfg = role_profile_map.get(role)
        if not cfg:
            continue
        model, id_field = cfg
        for p in model.objects.filter(user_id__in=user_ids):
            result[p.user_id] = {
                'user_id_str': getattr(p, id_field, None),
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'phone': p.mobile_number,
                'level': ROLE_LEVEL.get(role),
                'position': ROLE_LABEL.get(role),
            }
    return result


def get_user_profile_id(user):
    """Returns the user's role-specific ID string."""
    try:
        role_map = {
            'admin':      ('admin_profile',      'admin_id'),
            'dealer':     ('dealer_profile',     'dealer_id'),
            'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
            'promotor':   ('promotor_profile',   'promotor_id'),
            'customer':   ('customer_profile',   'customer_id'),
        }
        if user.role in role_map:
            profile_attr, id_field = role_map[user.role]
            p = getattr(user, profile_attr)
            return getattr(p, id_field)
    except Exception:
        pass
    return None


def _bulk_profile_id_map(users):
    """Same lookup as get_user_profile_id, but ONE query per role instead of
    one query per user — get_user_profile_id(user) inside a per-row loop over
    a large queryset (CSV/PDF report exports covering thousands of orders) is
    a real N+1 query bug: each call hits `user.<role>_profile`, a reverse
    OneToOne accessor, which is a separate DB round-trip when not prefetched.
    Measured ~270ms/row against the remote DB — 7000 rows that way is 30+
    minutes and blows Render's 120s gunicorn timeout. Returns {user_id: id_string}."""
    role_profile_map = {
        'admin': (AdminProfile, 'admin_id'), 'dealer': (DealerProfile, 'dealer_id'),
        'sub_dealer': (SubDealerProfile, 'sub_dealer_id'), 'promotor': (PromotorProfile, 'promotor_id'),
        'customer': (CustomerProfile, 'customer_id'),
    }
    ids_by_role = {}
    for u in users:
        ids_by_role.setdefault(u.role, set()).add(u.id)

    result = {}
    for role, user_ids in ids_by_role.items():
        cfg = role_profile_map.get(role)
        if not cfg:
            continue
        model, id_field = cfg
        for row in model.objects.filter(user_id__in=user_ids).values('user_id', id_field):
            result[row['user_id']] = row[id_field]
    return result

def is_user_mentioned_in_title(title, user):
    """Check if user's ID appears in the announcement title."""
    user_id = get_user_profile_id(user)
    if not user_id:
        return False
    return user_id in title

    

def find_user_by_login_identifier(identifier):
    """Email, phone number, or public ID (admin_id/dealer_id/sub_dealer_id/
    promotor_id/customer_id) — edhை vechi login pannanaalum User-a find pannum."""
    if not identifier:
        return None

    # 1) Email match
    user = User.objects.filter(email=identifier).first()
    if user:
        return user

    profile_lookups = [
        (AdminProfile, 'admin_id'),
        (DealerProfile, 'dealer_id'),
        (SubDealerProfile, 'sub_dealer_id'),
        (PromotorProfile, 'promotor_id'),
        (CustomerProfile, 'customer_id'),
        (ShopProfile, 'shop_id'),
    ]

    # 2) Public ID match
    for model, field in profile_lookups:
        try:
            profile = model.objects.select_related('user').get(**{field: identifier})
            return profile.user
        except model.DoesNotExist:
            continue

    # 3) Phone number match
    for model, _ in profile_lookups:
        try:
            profile = model.objects.select_related('user').get(mobile_number=identifier)
            return profile.user
        except model.DoesNotExist:
            continue
        except model.MultipleObjectsReturned:
            continue

    return None


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('email')  # email/phone/ID — moonu vidhamum accept pannum
        password = request.data.get('password')

        # Step 1: identifier vachi user find pannu
        user_obj = find_user_by_login_identifier(identifier)
        if not user_obj:
            return Response({'error': 'No account found with this email, phone or ID'}, status=400)

        # Step 2: authenticate always email vechithaan pannanum (USERNAME_FIELD='email')
        user = authenticate(request, username=user_obj.email, password=password)
        if not user:
            return Response({'error': 'Incorrect password'}, status=400)

        # Step 3: last_login update pannu (Active/Inactive pie chart-ku idhu than base)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # ── NEW: Reward logic — super_admin ku reward venaam ──
        if user.role != 'super_admin':
            today = timezone.now().date()
            is_first_ever_login = not DailyLoginLog.objects.filter(user=user).exists()
            _, created_today_log = DailyLoginLog.objects.get_or_create(user=user, login_date=today)

            if created_today_log:
                if is_first_ever_login:
                    _grant_login_reward(user, 'first_login', REWARD_COINS['first_login'], today)
                else:
                    _grant_login_reward(user, 'daily_login', REWARD_COINS['daily_login'], today)

                streak = get_login_streak(user, today)
                bonus_map = {10: 'bonus_10', 20: 'bonus_20', 30: 'bonus_30'}
                if streak in bonus_map:
                    rtype = bonus_map[streak]
                    _grant_login_reward(user, rtype, REWARD_COINS[rtype], today)

        # Step 4: Success
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'email': user.email,
        })


class CreateAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = AdminProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            admin_prof = serializer.save()
            return Response({
                'message': 'Admin created successfully',
                'admin_id': getattr(admin_prof, 'admin_id', '')
            }, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        admins = AdminProfile.objects.all()
        serializer = AdminListSerializer(admins, many=True)
        return Response(serializer.data)

class CreateShopView(APIView):
    def get_permissions(self):
        # Anyone can submit the shop registration form (Copy URL flow) —
        # listing shops is still restricted to Super Admin only.
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request):
        serializer = ShopProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Shop created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        shops = ShopProfile.objects.all().order_by('-created_at')
        serializer = ShopListSerializer(shops, many=True)
        return Response(serializer.data)

class MyShopProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'shop':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            p = request.user.shop_profile
        except ShopProfile.DoesNotExist:
            return Response({'error': 'Shop profile not found'}, status=404)
        return Response(ShopSelfSerializer(p).data)

    def patch(self, request):
        if request.user.role != 'shop':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            p = request.user.shop_profile
        except ShopProfile.DoesNotExist:
            return Response({'error': 'Shop profile not found'}, status=404)
        serializer = ShopSelfSerializer(p, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


def _build_shop_node(shop, children_by_creator):
    """Recursively assembles one shop's subtree from an already-fetched
    children_by_creator map — same one-query-then-recurse-in-Python shape
    used for the customer referral chain in FullHierarchyView."""
    children = children_by_creator.get(shop.user_id, [])
    child_nodes = [_build_shop_node(child, children_by_creator) for child in children]
    descendant_count = len(child_nodes) + sum(c['descendant_count'] for c in child_nodes)
    return {
        'shop_id': shop.shop_id,
        'shop_name': shop.shop_name,
        'owner_name': shop.owner_name,
        'shop_type': shop.shop_type,
        'mobile_number': shop.mobile_number,
        'city': shop.city,
        'created_at': shop.created_at,
        'descendant_count': descendant_count,
        'children': child_nodes,
    }


class ShopHierarchyView(APIView):
    """Returns the subtree of shops created (directly or indirectly) by the
    logged-in shop — who's below them, recursively, via ShopProfile.created_by."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        all_shops = list(ShopProfile.objects.all().select_related('user'))
        children_by_creator = {}
        for shop in all_shops:
            children_by_creator.setdefault(shop.created_by_id, []).append(shop)

        if request.user.role == 'super_admin':
            # Whole-forest view: every shop whose creator isn't itself a shop
            # (created directly by Super Admin, or a pre-existing shop with no
            # recorded creator) is treated as a top-level root.
            shop_user_ids = {s.user_id for s in all_shops}
            root_shops = [s for s in all_shops if s.created_by_id not in shop_user_ids]
            child_nodes = [_build_shop_node(s, children_by_creator) for s in root_shops]
            descendant_count = len(child_nodes) + sum(c['descendant_count'] for c in child_nodes)
            tree = {
                'shop_id': None,
                'shop_name': 'All Shops',
                'owner_name': '',
                'shop_type': None,
                'mobile_number': '',
                'city': '',
                'created_at': None,
                'descendant_count': descendant_count,
                'children': child_nodes,
            }
            return Response(tree)

        if request.user.role != 'shop':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            root = request.user.shop_profile
        except ShopProfile.DoesNotExist:
            return Response({'error': 'Shop profile not found'}, status=404)

        tree = _build_shop_node(root, children_by_creator)
        return Response(tree)


class ShopDashboardStatsView(APIView):
    """Quick stats for the Shop Dashboard: network size + Physical/Virtual
    split (recursive over the whole subtree) and a monthly growth trend for
    shops this shop directly created — no order data available per-shop yet,
    so charts are built from what ShopProfile already tracks."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'shop':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            root = request.user.shop_profile
        except ShopProfile.DoesNotExist:
            return Response({'error': 'Shop profile not found'}, status=404)

        all_shops = list(ShopProfile.objects.all().select_related('user'))
        children_by_creator = {}
        for shop in all_shops:
            children_by_creator.setdefault(shop.created_by_id, []).append(shop)

        # Walk the subtree once to collect every descendant (not just direct children)
        descendants = []
        stack = list(children_by_creator.get(root.user_id, []))
        while stack:
            node = stack.pop()
            descendants.append(node)
            stack.extend(children_by_creator.get(node.user_id, []))

        physical_count = sum(1 for s in descendants if s.shop_type == 'live')
        virtual_count = sum(1 for s in descendants if s.shop_type == 'virtual')

        # Monthly growth: shops this shop directly created, last 6 months
        today = timezone.now().date()
        six_months_ago = (today.replace(day=1) - timedelta(days=150)).replace(day=1)
        monthly_counts = (
            ShopProfile.objects.filter(created_by=request.user, created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        monthly_growth = [
            {'month': m['month'].strftime('%b %Y'), 'count': m['count']}
            for m in monthly_counts
        ]

        return Response({
            'direct_children_count': len(children_by_creator.get(root.user_id, [])),
            'total_descendants_count': len(descendants),
            'physical_count': physical_count,
            'virtual_count': virtual_count,
            'monthly_growth': monthly_growth,
        })


class CreateDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = DealerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Dealer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        dealers = DealerProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = DealerListSerializer(dealers, many=True)
        return Response(serializer.data)


class CreateSubDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'dealer':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = SubDealerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Sub Dealer created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'dealer':
            return Response({'error': 'Permission denied'}, status=403)
        sub_dealers = SubDealerProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = SubDealerListSerializer(sub_dealers, many=True)
        return Response(serializer.data)


class DealerListForDealerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        dealers = DealerProfile.objects.select_related('user', 'assigned_admin').all()

        # NEW: server-side search — only when the user actually searches, like Amazon
        search = request.query_params.get('search', '').strip()
        if search:
            dealers = dealers.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(dealer_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search)
            )

        # NEW: offset/limit pagination — first batch 300, "Load More" click panna next batch
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))

        total_count = dealers.count()
        page = dealers[offset:offset + limit]

        serializer = DealerListSerializer(page, many=True)
        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        })


class AdminListForAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        admins = AdminProfile.objects.all()
        serializer = AdminListSerializer(admins, many=True)
        return Response(serializer.data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {'role': user.role, 'email': user.email}

        if user.role == 'admin':
            try:
                p = AdminProfile.objects.get(user=user)
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'admin_id': p.admin_id,
                    'admin_name': p.admin_name,
                    'admin_contact_no': p.admin_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.user.created_at,
                })
            except Exception:
                pass

        elif user.role == 'dealer':
            try:
                p = user.dealer_profile
                data.update({
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'dealer_id': p.dealer_id,
                    'dealer_name': p.dealer_name,
                    'dealer_contact_no': p.dealer_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'admin_name': p.assigned_admin.admin_name if p.assigned_admin else None,
                    'admin_id': p.assigned_admin.admin_id if p.assigned_admin else None,
                    'admin_contact_no': p.assigned_admin.admin_contact_no if p.assigned_admin else None,
                })
            except DealerProfile.DoesNotExist:
                pass

        elif user.role == 'sub_dealer':
            try:
                p = user.sub_dealer_profile
                data.update({
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'sub_dealer_id': p.sub_dealer_id,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'dealer_name': p.assigned_dealer.dealer_name if p.assigned_dealer else None,
                    'dealer_id': p.assigned_dealer.dealer_id if p.assigned_dealer else None,
                    'dealer_contact_no': p.assigned_dealer.dealer_contact_no if p.assigned_dealer else None,
                })
            except SubDealerProfile.DoesNotExist:
                pass

        elif user.role == 'promotor':
            try:
                p = user.promotor_profile
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'promotor_id': p.promotor_id,
                    'promotor_name': p.promotor_name,
                    'promotor_contact_no': p.promotor_contact_no,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'sub_dealer_name': f"{p.assigned_sub_dealer.first_name} {p.assigned_sub_dealer.last_name}" if p.assigned_sub_dealer else None,
                    'sub_dealer_id': p.assigned_sub_dealer.sub_dealer_id if p.assigned_sub_dealer else None,
                    'sub_dealer_contact_no': p.assigned_sub_dealer.mobile_number if p.assigned_sub_dealer else None,
                })
            except PromotorProfile.DoesNotExist:
                pass

        elif user.role == 'customer':
            try:
                p = user.customer_profile
                data.update({
                    'initial': p.initial,
                    'first_name': p.first_name,
                    'last_name': p.last_name,
                    'mobile_number': p.mobile_number,
                    'gender': p.gender,
                    'dob': p.dob,
                    'married_status': p.married_status,
                    'anniversary_date': p.anniversary_date,
                    'customer_id': p.customer_id,
                    'door_no': p.door_no,
                    'street_name': p.street_name,
                    'town_name': p.town_name,
                    'city_name': p.city_name,
                    'pincode': p.pincode,
                    'district': p.district,
                    'state': p.state,
                    'aadhaar_no': p.aadhaar_no,
                    'pan_no': p.pan_no,
                    'occupation': p.occupation,
                    'occupation_detail': p.occupation_detail,
                    'annual_salary': p.annual_salary,
                    'created_at': p.created_at,
                    'promotor_name': f"{p.assigned_promotor.first_name} {p.assigned_promotor.last_name}" if p.assigned_promotor else None,
                    'promotor_id': p.assigned_promotor.promotor_id if p.assigned_promotor else None,
                    'promotor_contact_no': p.assigned_promotor.promotor_contact_no if p.assigned_promotor else None,
                })
            except CustomerProfile.DoesNotExist:
                pass

        elif user.role == 'shop':
            try:
                p = user.shop_profile
                data.update({
                    'shop_id': p.shop_id,
                    'shop_name': p.shop_name,
                    'owner_name': p.owner_name,
                    'mobile_number': p.mobile_number,
                    'whatsapp_number': p.whatsapp_number,
                    'shop_address': p.shop_address,
                    'pincode': p.pincode,
                    'street_name': p.street_name,
                    'city': p.city,
                    'district': p.district,
                    'state': p.state,
                    'shop_type': p.shop_type,
                    'pan_no': p.pan_no,
                    'gst_no': p.gst_no,
                    'msme_no': p.msme_no,
                    'created_at': p.created_at,
                })
            except ShopProfile.DoesNotExist:
                pass

        return Response(data)

class MyBasicInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        info = get_user_display_info(user)   # already defined at the top of this file
        return Response({
            'role': user.role,
            'id': info['user_id_str'],
            'name': info['name'],
            'phone': info['phone'],
        })


# ── NEW: One-time-use public referral link system ──
class GenerateReferralLinkView(APIView):
    """IsAuthenticated — 'Copy URL' click pannumpothu idhu call aagum.
    Fresh unused token generate panni return pannum.
    Can generate for request.user or on behalf of target user_id / public_id."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import secrets
        token = secrets.token_urlsafe(24)
        target_user = request.user
        target_user_id = request.data.get('user_id')
        public_id = request.data.get('public_id')

        if target_user_id:
            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                pass
        elif public_id:
            pid = str(public_id).strip().upper()
            try:
                if pid.startswith('BBAD'):
                    target_user = AdminProfile.objects.get(admin_id=pid).user
                elif pid.startswith('BBDL'):
                    target_user = DealerProfile.objects.get(dealer_id=pid).user
                elif pid.startswith('BBSD'):
                    target_user = SubDealerProfile.objects.get(sub_dealer_id=pid).user
                elif pid.startswith('BBPR'):
                    target_user = PromotorProfile.objects.get(promotor_id=pid).user
                elif pid.startswith('BBCU'):
                    target_user = CustomerProfile.objects.get(customer_id=pid).user
            except Exception:
                pass

        ReferralLink.objects.create(token=token, referrer=target_user)
        return Response({'token': token})


class ReferrerInfoView(APIView):
    """AllowAny — register page load aagumpothu token valid-a, used-a nu check panni
    referrer id/name/phone return pannum."""
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('ref')
        if not token:
            return Response({'error': 'ref required'}, status=400)
        try:
            link = ReferralLink.objects.select_related('referrer').get(token=token)
        except ReferralLink.DoesNotExist:
            return Response({'error': 'Invalid referral link'}, status=404)

        if link.used:
            return Response({'error': 'This link has already been used'}, status=410)

        info = get_user_display_info(link.referrer)
        return Response({
            'id': info['user_id_str'],
        })


class PublicCustomerRegisterView(APIView):
    """AllowAny — token-based one-time registration.
    Token used=True aana udanE, andha link vera evarukum vela pannaadhu."""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        token = data.get('ref')
        if not token:
            return Response({'error': 'Invalid referral link'}, status=400)
        try:
            link = ReferralLink.objects.select_related('referrer').get(token=token)
        except ReferralLink.DoesNotExist:
            return Response({'error': 'Invalid referral link'}, status=404)

        if link.used:
            return Response({'error': 'This link has already been used'}, status=410)

        referrer = link.referrer
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=400)

        assigned_promotor = None
        if referrer.role == 'promotor':
            try:
                assigned_promotor = referrer.promotor_profile
            except PromotorProfile.DoesNotExist:
                assigned_promotor = None
        elif referrer.role == 'customer':
            try:
                assigned_promotor = referrer.customer_profile.assigned_promotor
            except Exception:
                assigned_promotor = None

        profile_fields = [
            'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
        ]
        profile_data = {f: data.get(f) for f in profile_fields if data.get(f) not in [None, '']}

        user = User.objects.create_user(email=email, password=password, role='customer')
        try:
            CustomerProfile.objects.create(
                user=user,
                created_by=referrer,
                assigned_promotor=assigned_promotor,
                **profile_data
            )
        except Exception as e:
            user.delete()
            return Response({'error': str(e)}, status=400)

        # ── Mark the token as permanently used — link now dead ──
        link.used = True
        link.used_by = user
        link.used_at = timezone.now()
        link.save(update_fields=['used', 'used_by', 'used_at'])

        return Response({'message': 'Customer registered successfully'}, status=201)


def send_sendgrid_otp_email(to_email, otp_code, recipient_name="Customer"):
    """
    Sends a high-deliverability transactional verification email using SendGrid v3 API.
    Designed according to anti-spam best practices so the mail lands in the Primary inbox.
    """
    import json
    import urllib.request
    import urllib.error
    import os

    try:
        from django.conf import settings
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
    except Exception:
        pass

    brevo_smtp_login = os.environ.get("BREVO_SMTP_LOGIN")
    brevo_smtp_key = os.environ.get("BREVO_SMTP_KEY")
    brevo_from_email = os.environ.get("BREVO_FROM_EMAIL", "senthil.bitbyte@gmail.com")
    resend_api_key = os.environ.get("RESEND_API_KEY")
    api_key = os.environ.get("SENDGRID_API_KEY")
    from_email = os.environ.get("SENDGRID_FROM_EMAIL", "senthil.bitbyte@gmail.com")
    from_name = os.environ.get("SENDGRID_FROM_NAME", "Athirai")

    clean_name = (recipient_name or "Valued Customer").strip()
    subject = f"Your Athirai Verification Code: {otp_code}"

    text_content = f"""Hello {clean_name},

Thank you for choosing Athirai Fine Jewellery.

Your verification code is: {otp_code}

This code will expire in 10 minutes. Please enter this code on the registration page to complete your account setup and unlock direct ordering.

For your security, please do not share this one-time code with anyone.

Best regards,
Athirai Jewellery Team
https://athirai.com
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Athirai Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(7, 59, 63, 0.08); border: 1px solid #e2eceb;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #073B3F 0%, #0c4e53 100%); padding: 34px 30px; text-align: center;">
              <h1 style="margin: 0; color: #d4af37; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                ATHIRAI
              </h1>
              <p style="margin: 6px 0 0; color: #e0f2f1; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
                Fine Jewellery &bull; Direct Customer Verification
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 38px 32px; background-color: #ffffff;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a2e2b;">
                Hello <strong>{clean_name}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4a5d59;">
                Welcome to Athirai! To complete your registration and unlock instant purchasing, please enter the one-time verification code below:
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f7faf9; border: 2px dashed #073B3F; border-radius: 12px; padding: 18px 28px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #073B3F; display: block;">
                        {otp_code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #738784; text-align: center;">
                &bull; This code is valid for <strong>10 minutes</strong>.<br>
                &bull; If you did not request this verification, please safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fbfdfc; padding: 22px 30px; text-align: center; border-top: 1px solid #edf4f3;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #889995;">
                Sent with care by <strong>Athirai Jewellery</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #a0b0ac;">
                &copy; 2026 Athirai. All rights reserved. &bull; senthil.bitbyte@gmail.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    if brevo_smtp_login and brevo_smtp_key:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{from_name} <{brevo_from_email}>"
            msg['To'] = to_email
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            with smtplib.SMTP('smtp-relay.brevo.com', 587, timeout=12) as server:
                server.starttls()
                server.login(brevo_smtp_login, brevo_smtp_key)
                server.sendmail(brevo_from_email, [to_email], msg.as_string())
            return True, "Sent via Brevo SMTP"
        except Exception as e:
            return False, f"Brevo SMTP error: {str(e)}"

    if resend_api_key:
        resend_from = os.environ.get("RESEND_FROM_EMAIL", f"{from_name} <onboarding@resend.dev>")
        resend_reply_to = os.environ.get("RESEND_REPLY_TO", "senthil.bitbyte@gmail.com")
        resend_payload = {
            "from": resend_from,
            "to": [to_email],
            "reply_to": resend_reply_to,
            "subject": subject,
            "html": html_content,
            "text": text_content,
        }
        resend_req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(resend_payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "resend-python/2.0.0"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(resend_req, timeout=12) as response:
                return True, f"Sent via Resend (Status {response.status})"
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            return False, f"Resend error {e.code}: {err_msg}"
        except Exception as e:
            return False, f"Resend email delivery failed: {str(e)}"

    payload = {
        "personalizations": [
            {
                "to": [{"email": to_email, "name": clean_name}],
                "subject": subject
            }
        ],
        "from": {
            "email": from_email,
            "name": from_name
        },
        "reply_to": {
            "email": from_email,
            "name": f"{from_name} Support"
        },
        "content": [
            {
                "type": "text/plain",
                "value": text_content
            },
            {
                "type": "text/html",
                "value": html_content
            }
        ]
    }

    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            return True, f"Sent successfully (Status {response.status})"
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')
        return False, f"SendGrid error {e.code}: {err_msg}"
    except Exception as e:
        return False, f"Email delivery failed: {str(e)}"


class RegisterSendOTPView(APIView):
    """Generates and dispatches a 6-digit OTP to the customer's email via SendGrid."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        first_name = (request.data.get('first_name') or '').strip()

        if not email or '@' not in email:
            return Response({'error': 'A valid email address is required.'}, status=400)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email address already exists. Please sign in.'}, status=400)

        # Generate 6-digit numeric OTP
        otp_code = f"{random.randint(100000, 999999)}"

        # Clear existing unverified OTPs for this email
        EmailOTP.objects.filter(email=email, is_verified=False).delete()

        # Create fresh OTP record
        EmailOTP.objects.create(
            email=email,
            otp=otp_code,
            purpose='register'
        )

        # Dispatch in the background — some hosts silently stall/block outbound
        # SMTP/API calls to email providers, and this view used to wait on that
        # call before responding, which made the "Sending..." button hang for
        # the user. The OTP record already exists above; the request now
        # returns immediately regardless of how long the actual send takes.
        def _dispatch():
            success, msg = send_sendgrid_otp_email(email, otp_code, first_name)
            print(f"[AUTH OTP] Email: {email} | OTP: {otp_code} | SendGrid: {success} ({msg})")

        threading.Thread(target=_dispatch, daemon=True).start()

        # Email verification is hidden from the user (see Register.jsx) — the OTP
        # is returned directly so the frontend can auto-verify without showing a
        # code-entry screen. The EmailOTP record + verify flow above stays fully
        # intact for whenever email delivery is turned back into a visible step.
        return Response({
            'message': f'Verification OTP sent to {email}. Valid for 10 minutes.',
            'otp': otp_code,
        }, status=200)


class RegisterVerifyOTPView(APIView):
    """Verifies the email OTP, registers user + profile, and issues JWT tokens for immediate checkout."""
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        email = (data.get('email') or '').strip().lower()
        otp = (data.get('otp') or '').strip()
        password = data.get('password')

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=400)
        if not password:
            return Response({'error': 'Password is required.'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=400)

        # Validate OTP
        otp_record = EmailOTP.objects.filter(email=email, is_verified=False).order_by('-created_at').first()
        if not otp_record or not otp_record.is_valid() or otp_record.otp != otp:
            return Response({'error': 'Invalid or expired OTP. Please request a new code.'}, status=400)

        # Handle optional referral token
        ref_token = data.get('ref')
        referrer = None
        assigned_promotor = None
        ref_link_obj = None

        if ref_token:
            try:
                ref_link_obj = ReferralLink.objects.select_related('referrer').get(token=ref_token)
                if not ref_link_obj.used:
                    referrer = ref_link_obj.referrer
                    if referrer.role == 'promotor':
                        try:
                            assigned_promotor = referrer.promotor_profile
                        except Exception:
                            assigned_promotor = None
                    elif referrer.role == 'customer':
                        try:
                            assigned_promotor = referrer.customer_profile.assigned_promotor
                        except Exception:
                            assigned_promotor = None
            except ReferralLink.DoesNotExist:
                pass

        profile_fields = [
            'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name', 'pincode',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary',
        ]
        profile_data = {f: data.get(f) for f in profile_fields if data.get(f) not in [None, '']}

        user = User.objects.create_user(email=email, password=password, role='customer')
        try:
            profile = CustomerProfile.objects.create(
                user=user,
                created_by=referrer,
                assigned_promotor=assigned_promotor,
                **profile_data
            )
        except Exception as e:
            user.delete()
            return Response({'error': str(e)}, status=400)

        # Mark OTP as verified
        otp_record.is_verified = True
        otp_record.save(update_fields=['is_verified'])

        # Mark referral link as used if applicable
        if ref_link_obj and not ref_link_obj.used:
            ref_link_obj.used = True
            ref_link_obj.used_by = user
            ref_link_obj.used_at = timezone.now()
            ref_link_obj.save(update_fields=['used', 'used_by', 'used_at'])

        # Generate JWT tokens for instant auto-login
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful! You are now logged in.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'email': user.email,
            'customer_id': getattr(profile, 'customer_id', ''),
            'name': f"{profile.first_name} {profile.last_name}".strip()
        }, status=201)


class CreatePromotorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'sub_dealer':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = PromotorProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Promotor created successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role != 'sub_dealer':
            return Response({'error': 'Permission denied'}, status=403)
        promotors = PromotorProfile.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = PromotorListSerializer(promotors, many=True)
        return Response(serializer.data)


class CreateCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['promotor', 'customer', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        serializer = CustomerProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            cp = serializer.save()
            return Response({
                'message': 'Customer created successfully',
                'customer_id': getattr(cp, 'customer_id', '')
            }, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin', 'customer']:
            return Response({'error': 'Permission denied'}, status=403)

        customers = CustomerProfile.objects.select_related(
            'user', 'assigned_promotor'
        ).order_by('-created_at')

        if request.user.role in ['promotor', 'customer']:
            customers = customers.filter(created_by=request.user)

        # NEW: server-side search — only when the user actually searches, like Amazon
        search = request.query_params.get('search', '').strip()
        if search:
            customers = customers.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(customer_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search)
            )

        # NEW: offset/limit pagination — first batch 300, "Load More" click panna next batch
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))

        total_count = customers.count()
        page = customers[offset:offset + limit]

        serializer = CustomerListSerializer(page, many=True)
        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        })


class GeneralCustomerListView(APIView):
    """
    Returns list of DIRECT customers registered online without referral (created_by is null).
    These are the General Customers from the storefront landing page /register.
    Accessible to Super Admin and Admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        search = request.query_params.get('search', '').strip()

        # Strictly filter direct customers (no referrer)
        qs = CustomerProfile.objects.filter(created_by__isnull=True).select_related('user').order_by('-created_at')

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(customer_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search) |
                Q(city_name__icontains=search) |
                Q(district__icontains=search) |
                Q(state__icontains=search) |
                Q(pincode__icontains=search)
            )

        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 200))
        total_count = qs.count()

        # Direct customers stats
        direct_order_stats = JewelryOrder.objects.filter(
            user__customer_profile__created_by__isnull=True
        ).aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_price')
        )
        active_count = CustomerProfile.objects.filter(created_by__isnull=True, user__is_active=True).count()
        all_customers_count = CustomerProfile.objects.count()
        referred_count = CustomerProfile.objects.filter(created_by__isnull=False).count()

        page = qs[offset:offset + limit]

        user_ids = [cp.user_id for cp in page if cp.user_id]
        orders_map = {}
        if user_ids:
            order_stats = JewelryOrder.objects.filter(user_id__in=user_ids).values('user_id').annotate(
                order_count=Count('id'),
                total_spent=Sum('total_price')
            )
            for o in order_stats:
                orders_map[o['user_id']] = {
                    'order_count': o['order_count'],
                    'total_spent': float(o['total_spent'] or 0)
                }

        results = []
        for cp in page:
            u = cp.user
            stats = orders_map.get(cp.user_id, {'order_count': 0, 'total_spent': 0})
            address_parts = [cp.door_no, cp.street_name, cp.town_name, cp.city_name, cp.district, cp.state]
            valid_addr = ", ".join([p for p in address_parts if p])
            if cp.pincode:
                valid_addr = f"{valid_addr} - {cp.pincode}" if valid_addr else cp.pincode

            results.append({
                'id': cp.id,
                'user_id': cp.user_id,
                'customer_id': cp.customer_id,
                'name': f"{cp.first_name} {cp.last_name or ''}".strip(),
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'email': u.email if u else '',
                'mobile_number': cp.mobile_number,
                'gender': cp.gender,
                'dob': cp.dob,
                'married_status': cp.married_status,
                'door_no': cp.door_no,
                'street_name': cp.street_name,
                'town_name': cp.town_name,
                'city_name': cp.city_name,
                'district': cp.district,
                'state': cp.state,
                'pincode': cp.pincode,
                'full_address': valid_addr,
                'created_at': cp.created_at,
                'is_active': u.is_active if u else True,
                'is_direct': True,
                'order_count': stats['order_count'],
                'total_spent': stats['total_spent'],
                'referrer_name': "Direct Online",
                'promotor_id': None,
            })

        return Response({
            'results': results,
            'total_count': total_count,
            'active_count': active_count,
            'total_orders': direct_order_stats['total_orders'] or 0,
            'total_spent': float(direct_order_stats['total_spent'] or 0),
            'all_customers_count': all_customers_count,
            'referred_count': referred_count,
            'has_more': offset + limit < total_count,
        })


class ReferralCustomerListView(APIView):
    """
    Returns list of REFERRED customers who registered via Referral URLs / agent invites (created_by is not null).
    Displays referrer details (name, role, ID, email) and promotor details.
    Accessible to Super Admin and Admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        search = request.query_params.get('search', '').strip()
        referrer_role = request.query_params.get('role', '').strip().lower()

        # Strictly filter to customers who ACTUALLY self-registered via a
        # shared Referral URL (ReferralLink.used_by) — NOT customers a
        # promotor/admin manually typed in on their behalf via "Create
        # Customer" (those also get created_by set, but never consumed a link).
        referred_user_ids = ReferralLink.objects.filter(
            used=True, used_by__isnull=False
        ).values_list('used_by_id', flat=True)
        qs = CustomerProfile.objects.filter(user_id__in=referred_user_ids).select_related(
            'user', 'created_by', 'assigned_promotor'
        ).order_by('-created_at')

        if referrer_role and referrer_role != 'all':
            qs = qs.filter(created_by__role=referrer_role)

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(customer_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search) |
                Q(city_name__icontains=search) |
                Q(district__icontains=search) |
                Q(state__icontains=search) |
                Q(pincode__icontains=search) |
                Q(created_by__email__icontains=search) |
                Q(assigned_promotor__promotor_id__icontains=search) |
                Q(assigned_promotor__first_name__icontains=search)
            )

        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 200))
        total_count = qs.count()

        # Stats across all referred customers
        referred_order_stats = JewelryOrder.objects.filter(
            user_id__in=referred_user_ids
        ).aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_price')
        )
        active_count = CustomerProfile.objects.filter(user_id__in=referred_user_ids, user__is_active=True).count()
        direct_count = CustomerProfile.objects.filter(created_by__isnull=True).count()

        page = qs[offset:offset + limit]

        user_ids = [cp.user_id for cp in page if cp.user_id]
        orders_map = {}
        if user_ids:
            order_stats = JewelryOrder.objects.filter(user_id__in=user_ids).values('user_id').annotate(
                order_count=Count('id'),
                total_spent=Sum('total_price')
            )
            for o in order_stats:
                orders_map[o['user_id']] = {
                    'order_count': o['order_count'],
                    'total_spent': float(o['total_spent'] or 0)
                }

        # Batch load creator display info
        creator_user_ids = list(set([cp.created_by_id for cp in page if cp.created_by_id]))
        creator_map = {}
        if creator_user_ids:
            creators = User.objects.filter(id__in=creator_user_ids).select_related(
                'admin_profile', 'dealer_profile', 'sub_dealer_profile', 'promotor_profile', 'customer_profile'
            )
            for cu in creators:
                creator_map[cu.id] = get_user_display_info(cu)

        results = []
        for cp in page:
            u = cp.user
            stats = orders_map.get(cp.user_id, {'order_count': 0, 'total_spent': 0})
            address_parts = [cp.door_no, cp.street_name, cp.town_name, cp.city_name, cp.district, cp.state]
            valid_addr = ", ".join([p for p in address_parts if p])
            if cp.pincode:
                valid_addr = f"{valid_addr} - {cp.pincode}" if valid_addr else cp.pincode

            ref_info = creator_map.get(cp.created_by_id, {})
            ref_name = ref_info.get('name') or (cp.created_by.email if cp.created_by else 'Unknown')
            ref_id = ref_info.get('user_id_str') or ''
            ref_role = cp.created_by.role if cp.created_by else ''
            ref_phone = ref_info.get('phone') or ''

            promotor_id = cp.assigned_promotor.promotor_id if cp.assigned_promotor else None
            promotor_name = f"{cp.assigned_promotor.first_name} {cp.assigned_promotor.last_name or ''}".strip() if cp.assigned_promotor else None

            results.append({
                'id': cp.id,
                'user_id': cp.user_id,
                'customer_id': cp.customer_id,
                'name': f"{cp.first_name} {cp.last_name or ''}".strip(),
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'email': u.email if u else '',
                'mobile_number': cp.mobile_number,
                'gender': cp.gender,
                'dob': cp.dob,
                'married_status': cp.married_status,
                'door_no': cp.door_no,
                'street_name': cp.street_name,
                'town_name': cp.town_name,
                'city_name': cp.city_name,
                'district': cp.district,
                'state': cp.state,
                'pincode': cp.pincode,
                'full_address': valid_addr,
                'created_at': cp.created_at,
                'is_active': u.is_active if u else True,
                'is_direct': False,
                'order_count': stats['order_count'],
                'total_spent': stats['total_spent'],
                'referrer_id': ref_id,
                'referrer_name': ref_name,
                'referrer_email': cp.created_by.email if cp.created_by else '',
                'referrer_role': ref_role,
                'referrer_phone': ref_phone,
                'promotor_id': promotor_id,
                'promotor_name': promotor_name,
            })

        return Response({
            'results': results,
            'total_count': total_count,
            'active_count': active_count,
            'total_orders': referred_order_stats['total_orders'] or 0,
            'total_spent': float(referred_order_stats['total_spent'] or 0),
            'direct_count': direct_count,
            'has_more': offset + limit < total_count,
        })


class PromotorListForView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        promotors = PromotorProfile.objects.select_related(
            'user', 'assigned_sub_dealer__assigned_dealer__assigned_admin'
        ).all()

        # NEW: server-side search
        search = request.query_params.get('search', '').strip()
        if search:
            promotors = promotors.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(promotor_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search)
            )

        # NEW: offset/limit pagination
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))

        total_count = promotors.count()
        page = promotors[offset:offset + limit]

        serializer = PromotorListSerializer(page, many=True)
        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        })


class SubDealerListForView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['promotor', 'sub_dealer', 'dealer', 'admin', 'super_admin']:
            return Response({'error': 'Permission denied'}, status=403)
        sub_dealers = SubDealerProfile.objects.select_related('user', 'assigned_dealer').all()

        # NEW: server-side search
        search = request.query_params.get('search', '').strip()
        if search:
            sub_dealers = sub_dealers.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(sub_dealer_id__icontains=search) |
                Q(mobile_number__icontains=search) |
                Q(user__email__icontains=search)
            )

        # NEW: offset/limit pagination
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))

        total_count = sub_dealers.count()
        page = sub_dealers[offset:offset + limit]

        serializer = SubDealerListSerializer(page, many=True)
        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        })


class FullHierarchyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Permission denied'}, status=403)

        admin_id_param = request.query_params.get('admin_id')
        if admin_id_param:
            try:
                admin_node = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=admin_id_param)
                orders_by_user = _bulk_orders_for_admin(admin_node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(admin_node))
                admin_data = _build_admin(admin_node, orders_by_user, monthly_counts)
                return Response({
                    'admins': [admin_data],
                    'super_admin_email': User.objects.filter(role='super_admin').first().email if User.objects.filter(role='super_admin').exists() else '',
                })
            except AdminProfile.DoesNotExist:
                return Response({'admins': [], 'super_admin_email': ''})

        customers_pf = Prefetch(
            'assigned_customers',
            queryset=CustomerProfile.objects.filter(assigned_promotor__isnull=False)
        )
        promotors_pf = Prefetch(
            'assigned_promotors',
            queryset=PromotorProfile.objects.filter(assigned_sub_dealer__isnull=False).prefetch_related(customers_pf)
        )
        sub_dealers_pf = Prefetch(
            'assigned_sub_dealers',
            queryset=SubDealerProfile.objects.filter(assigned_dealer__isnull=False).prefetch_related(promotors_pf)
        )
        dealers_pf = Prefetch(
            'assigned_dealers',
            queryset=DealerProfile.objects.filter(assigned_admin__isnull=False).prefetch_related(sub_dealers_pf)
        )

        now = timezone.now()
        # ── FIX: year/month extract panradhukku pathila date RANGE use pandrom.
        # Idhu database INDEX-ah use pannum (full table scan aagadhu) — romba fast aagum. ──
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month_start = month_start.replace(year=now.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=now.month + 1)

        order_counts = dict(
            JewelryOrder.objects.filter(
                created_at__gte=month_start, created_at__lt=next_month_start
            ).values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
        )

        # ── NEW: customer -> customer chain (created_by) — ella depth-um map pannும் ──
        children_by_creator = {}
        for cust in CustomerProfile.objects.all().only('id', 'user_id', 'created_by_id'):
            children_by_creator.setdefault(cust.created_by_id, []).append(cust)

        if request.user.role == 'admin':
            admins = AdminProfile.objects.filter(user=request.user).prefetch_related(dealers_pf)
        else:
            admins = AdminProfile.objects.all().prefetch_related(dealers_pf)

        tree = []
        for admin in admins:
            dealer_list = []
            for dealer in admin.assigned_dealers.all():
                sub_dealer_list = []
                for sd in dealer.assigned_sub_dealers.all():
                    promotor_list = []
                    for pr in sd.assigned_promotors.all():
                        customer_list = [
    build_customer_node(c, children_by_creator, order_counts)
    for c in pr.assigned_customers.all()
]
                        promotor_order_count = sum(c['order_count'] for c in customer_list)
                        promotor_status = worst_status([c['status'] for c in customer_list])   # ← NEW
                        promotor_list.append({
    'id': pr.id,
    'user_id': pr.user_id,
    'promotor_id': pr.promotor_id,
    'first_name': pr.first_name,
    'last_name': pr.last_name,
    'mobile_number': pr.mobile_number,
    'city_name': pr.city_name,
    'customers': customer_list,
    'order_count': promotor_order_count,
    'status': promotor_status,   # ← NEW
})

                    sub_dealer_order_count = sum(pr['order_count'] for pr in promotor_list)
                    sub_dealer_status = worst_status([pr['status'] for pr in promotor_list])   # ← NEW
                    sub_dealer_list.append({
                        'id': sd.id,
                        'user_id': sd.user_id,
                        'sub_dealer_id': sd.sub_dealer_id,
                        'first_name': sd.first_name,
                        'last_name': sd.last_name,
                        'mobile_number': sd.mobile_number,
                        'city_name': sd.city_name,
                        'promotors': promotor_list,
                        'order_count': sub_dealer_order_count,
                        'status': sub_dealer_status,   # ← NEW
                    })

                dealer_order_count = sum(sd['order_count'] for sd in sub_dealer_list)
                dealer_status = worst_status([sd['status'] for sd in sub_dealer_list])   # ← NEW
                dealer_list.append({
                    'id': dealer.id,
                    'user_id': dealer.user_id,
                    'dealer_id': dealer.dealer_id,
                    'first_name': dealer.first_name,
                    'last_name': dealer.last_name,
                    'mobile_number': dealer.mobile_number,
                    'city_name': dealer.city_name,
                    'sub_dealers': sub_dealer_list,
                    'order_count': dealer_order_count,
                    'status': dealer_status,   # ← NEW
                })

            admin_order_count = sum(d['order_count'] for d in dealer_list)
            admin_status = worst_status([d['status'] for d in dealer_list])   # ← NEW
            tree.append({
                'id': admin.id,
                'user_id': admin.user_id,
                'admin_id': admin.admin_id,
                'first_name': admin.first_name,
                'last_name': admin.last_name,
                'mobile_number': admin.mobile_number,
                'city_name': admin.city_name,
                'dealers': dealer_list,
                'order_count': admin_order_count,
                'status': admin_status,   # ← NEW
            })

        return Response({'super_admin_email': request.user.email, 'admins': tree})



class AnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get('target_user')

        # ── CASE 1: Personal message — oru specific person ku mattum ──
        if target_user_id:
            try:
                target_user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response({'error': 'Target user not found'}, status=404)

            title = request.data.get('title', '').strip()
            message = request.data.get('message', '').strip()
            if not title or not message:
                return Response({'error': 'Title and message required'}, status=400)

            Announcement.objects.create(
                title=title,
                message=message,
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Message sent to this person only'}, status=201)

        # ── CASE 2: Broadcast — Super Admin மட்டும் ──
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response({'message': 'Announcement sent successfully'}, status=201)
        return Response(serializer.errors, status=400)

    def get(self, request):
        role = request.user.role
        if role == 'super_admin':
            announcements = Announcement.objects.filter(is_active=True).filter(
                Q(target_user__isnull=True) | Q(target_user=request.user) | Q(created_by=request.user)
            ).order_by('-created_at')
        else:
            announcements = Announcement.objects.filter(is_active=True).filter(
                Q(target_user=request.user) |
                Q(target_user__isnull=True, target_roles__contains=role)
            ).order_by('-created_at')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)


class AnnouncementReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Only super_admin OR the mentioned person can read replies."""
        try:
            announcement = Announcement.objects.get(id=pk)
        except Announcement.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        user = request.user
        if user.role != 'super_admin' and not is_user_mentioned_in_title(announcement.title, user):
            return Response({'error': 'Permission denied'}, status=403)

        replies = AnnouncementReply.objects.filter(
            announcement=announcement
        ).order_by('-created_at')
        serializer = AnnouncementReplySerializer(replies, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        """Anyone can reply, but only once per announcement."""
        try:
            announcement = Announcement.objects.get(id=pk)
        except Announcement.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if AnnouncementReply.objects.filter(
            announcement=announcement, replied_by=request.user
        ).exists():
            return Response({'error': 'Already replied'}, status=400)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message required'}, status=400)

        reply = AnnouncementReply.objects.create(
            announcement=announcement,
            replied_by=request.user,
            message=message
        )
        return Response(AnnouncementReplySerializer(reply).data, status=201)        

class ProfileUpdateRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        qs = ProfileUpdateRequest.objects.filter(status='pending').order_by('-created_at')
        serializer = ProfileUpdateRequestSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProfileUpdateRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Profile update request submitted'}, status=201)
        return Response(serializer.errors, status=400)


class ProfileUpdateApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        req = ProfileUpdateRequest.objects.get(id=pk)

        profile_map = {
            'admin': 'admin_profile',
            'dealer': 'dealer_profile',
            'sub_dealer': 'sub_dealer_profile',
            'promotor': 'promotor_profile',
            'customer': 'customer_profile',
        }

        profile = getattr(req.user, profile_map[req.user.role])

        fields = [
            'initial', 'first_name', 'last_name', 'mobile_number',
            'gender', 'dob', 'married_status', 'anniversary_date',
            'door_no', 'street_name', 'town_name', 'city_name',
            'district', 'state', 'aadhaar_no', 'pan_no',
            'occupation', 'occupation_detail', 'annual_salary'
        ]

        for field in fields:
            value = getattr(req, field)
            if value not in ['', None]:
                setattr(profile, field, value)

        profile.save()
        req.status = 'approved'
        req.save()

        return Response({'message': 'Request approved and profile updated'})

        


class MetalRateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        """Return today's rate; if not entered yet, return latest available."""
        from django.utils import timezone
        today = timezone.now().date()

        rate = MetalRate.objects.filter(date=today).first()
        if not rate:
            rate = MetalRate.objects.order_by('-date').first()

        if not rate:
            return Response({'error': 'No rates entered yet'}, status=404)

        serializer = MetalRateSerializer(rate)
        return Response(serializer.data)

    def post(self, request):
        """Super admin sets/updates rate for a given date."""
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        date = request.data.get('date')
        if not date:
            return Response({'error': 'date is required'}, status=400)

        existing = MetalRate.objects.filter(date=date).first()
        if existing:
            serializer = MetalRateSerializer(existing, data=request.data, partial=True)
        else:
            serializer = MetalRateSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    

class MetalOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Customer places an order."""
        data = request.data
        metal_type = data.get('metal_type')
        weight_label = data.get('weight_label')
        weight_grams = float(data.get('weight_grams', 0))
        count = int(data.get('count', 1))
        rate_per_gram = float(data.get('rate_per_gram', 0))

        if not all([metal_type, weight_label, weight_grams, count, rate_per_gram]):
            return Response({'error': 'All fields required'}, status=400)

        unit_price = round(weight_grams * rate_per_gram, 2)
        total_amount = round(unit_price * count, 2)

        order = MetalOrder.objects.create(
            user=request.user,
            metal_type=metal_type,
            weight_label=weight_label,
            weight_grams=weight_grams,
            count=count,
            rate_per_gram=rate_per_gram,
            unit_price=unit_price,
            total_amount=total_amount,
        )
        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.id,
            'total_amount': total_amount,
        }, status=201)

    def get(self, request):
        """Super admin sees all orders; customer sees own orders."""
        if request.user.role == 'super_admin':
            orders = MetalOrder.objects.all().order_by('-created_at')
        else:
            orders = MetalOrder.objects.filter(user=request.user).order_by('-created_at')
        serializer = MetalOrderSerializer(orders, many=True)
        return Response(serializer.data)
class MetalOrderSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        def summarize(qs):
            from django.db.models import Sum, Count
            result = {}
            for metal in ['gold_22k', 'gold_24k', 'silver_999']:
                metal_qs = qs.filter(metal_type=metal)
                agg = metal_qs.aggregate(
                    total_orders=Count('id'),
                    total_grams=Sum('weight_grams'),
                    total_amount=Sum('total_amount'),
                )
                result[metal] = {
                    'orders': agg['total_orders'] or 0,
                    'grams': float(agg['total_grams'] or 0),
                    'amount': float(agg['total_amount'] or 0),
                }
            return result

        base = MetalOrder.objects.filter(user=user)

        return Response({
            'today': summarize(base.filter(created_at__date=today)),
            'week':  summarize(base.filter(created_at__date__gte=week_start)),
            'month': summarize(base.filter(created_at__date__gte=month_start)),
        })    


# ADD AT BOTTOM OF views.py (before the ping function):

class JewelryProductView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        images = request.FILES.getlist('uploaded_images')

        serializer = JewelryProductSerializer(
            data={**data, 'uploaded_images': images},
            context={'request': request}
        )
        if serializer.is_valid():
            product = serializer.save()
            # If created as internal allocation asset (e.g. from Add Jewellery)
            is_internal = data.get('is_internal_asset') in [True, 'true', 'True', 1, '1']
            if is_internal:
                product.is_internal_asset = True
                product.save(update_fields=['is_internal_asset'])
                if product.stock_quantity > 0:
                    stock, _ = JewelryStock.objects.get_or_create(
                        user=request.user, product=product,
                        defaults={'qty': 0}
                    )
                    stock.qty += product.stock_quantity
                    stock.save()

                    # ── Track in History as Super Admin Master Stock Addition ──
                    mint_req = JewelryRequest.objects.create(
                        requested_by=request.user,
                        requested_to=request.user,
                        status='sent',
                        reject_reason='MASTER_MINT',
                        sent_at=timezone.now()
                    )
                    JewelryRequestItem.objects.create(
                        request=mint_req,
                        product=product,
                        qty=product.stock_quantity
                    )

            return Response({'message': 'Product created!', 'data': serializer.data}, status=201)
        return Response(serializer.errors, status=400)

   
    def get(self, request):
        if request.user.is_authenticated and getattr(request.user, 'role', None) == 'super_admin':
            qs = JewelryProduct.objects.all().prefetch_related('images')
        else:
            # ── sold-out (is_active=False due to stock=0) products-um kaamikkanum,
            # hided products (manual hide) mattum hide aaganum ──
            qs = JewelryProduct.objects.filter(
                Q(is_active=True) | Q(stock_quantity=0)
            ).prefetch_related('images')

        # Filter by internal asset status if requested
        internal = request.query_params.get('internal')
        if internal == 'true':
            qs = qs.filter(is_internal_asset=True)
        elif internal == 'false':
            qs = qs.filter(is_internal_asset=False)

        # ── Existing filters (உன்னோட பழைய code — same) ──

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        subcategory = request.query_params.get('subcategory')
        if subcategory:
            qs = qs.filter(name__icontains=subcategory)

        new = request.query_params.get('new')
        if new == 'true':
            qs = qs.filter(tag__icontains='New')

        bestseller = request.query_params.get('bestseller')
        if bestseller == 'true':
            qs = qs.filter(tag__icontains='Bestseller')

        metal = request.query_params.get('metal')
        if metal:
            qs = qs.filter(metal__iexact=metal)

        gender = request.query_params.get('gender')
        if gender and gender != 'all':
            qs = qs.filter(gender=gender)

        age_group = request.query_params.get('age')
        if age_group:
            qs = qs.filter(age_group=age_group)

        # ── Occasion is now a checkbox (multi-select) filter on the frontend —
        # comma-joined values ("Wedding,Birthday"), OR-matched. A single value
        # still works exactly as before (splits into a 1-item list). ──
        occasion = request.query_params.get('occasion')
        if occasion:
            occasion_list = [o.strip() for o in occasion.split(',') if o.strip()]
            if occasion_list:
                occasion_q = Q()
                for o in occasion_list:
                    occasion_q |= Q(occasion__icontains=o)
                qs = qs.filter(occasion_q)

        wedding_category = request.query_params.get('wedding_category')
        if wedding_category:
            qs = qs.filter(wedding_category__icontains=wedding_category)

        gift_tag = request.query_params.get('gift_tag')
        if gift_tag:
            qs = qs.filter(gift_tags__icontains=gift_tag)   # JSONField la icontains — list-oda text match

        gift_type = request.query_params.get('gift_type')
        if gift_type:
            qs = qs.filter(gift_subcategory__icontains=gift_type)

        grade = request.query_params.get('grade')
        if grade:
            qs = qs.filter(grade=grade)

        # ── Price filter (NEW) ──
        # price = request.query_params.get('price')
        # if price == 'below25k':
        #     qs = qs.filter(price__lt=25000)
        # elif price == '25k-50k':
        #     qs = qs.filter(price__gte=25000, price__lt=50000)
        # elif price == '50k-1L':
        #     qs = qs.filter(price__gte=50000, price__lt=100000)
        # elif price == 'above1L':
        #     qs = qs.filter(price__gte=100000)

                # ── Price filter (NEW) ──
        price = request.query_params.get('price')
        if price == 'below25k':
            qs = qs.filter(price__lt=25000)
        elif price == '25k-50k':
            qs = qs.filter(price__gte=25000, price__lt=50000)
        elif price == '50k-1L':
            qs = qs.filter(price__gte=50000, price__lt=100000)
        elif price == 'above1L':
            qs = qs.filter(price__gte=100000)
        # ── NEW price buckets — sidebar Price dropdown ku ──
        elif price == '0-2000':
            qs = qs.filter(price__gte=0, price__lt=2000)
        elif price == '2000-10000':
            qs = qs.filter(price__gte=2000, price__lt=10000)
        elif price == '10000-50000':
            qs = qs.filter(price__gte=10000, price__lt=50000)
        elif price == '50000-100000':
            qs = qs.filter(price__gte=50000, price__lt=100000)
        elif price == '100000-above':
            qs = qs.filter(price__gte=100000)

        # ── Search filter (NEW) ──
        search = request.query_params.get('search', '').strip()
        if search:
            try:
                # Number type பண்ணா — weight search
                num = float(search)
                qs = qs.filter(
                    Q(net_weight=num) |
                    Q(cross_weight=num)
                )
            except ValueError:
                # Text type பண்ணா — name, metal, category எல்லாத்திலயும் search
                qs = qs.filter(
                    Q(name__icontains=search) |
                    Q(metal__icontains=search) |
                    Q(category__icontains=search) |
                    Q(grade__icontains=search) |
                    Q(description__icontains=search) |
                    Q(tag__icontains=search) |
                    Q(occasion__icontains=search) |
                    Q(gender__icontains=search) |
                    Q(wedding_category__icontains=search)
                )

        qs = qs.order_by('-created_at')
        serializer = JewelryProductSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

class JewelryProductDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            product = JewelryProduct.objects.prefetch_related('images').get(id=pk)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        serializer = JewelryProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            product = JewelryProduct.objects.get(id=pk)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # NEW: multipart/form-data always sends strings — cast to correct
        # type before setattr, otherwise in-memory object keeps the string
        # even after save(), and later comparisons (like stock_status) crash
        INT_FIELDS = {'stock_quantity', 'low_stock_threshold'}
        DECIMAL_FIELDS = {'cross_weight', 'stone_weight', 'net_weight', 'making_charge',
                          'wastage_charge', 'die_charge', 'stone_value', 'tax_percent', 'price', 'original_price'}
        BOOL_FIELDS = {'is_active'}

        for field in ['category', 'metal', 'grade', 'name', 'description',
                      'cross_weight', 'stone_weight', 'net_weight',
                      'making_charge', 'wastage_charge', 'die_charge', 'stone_value', 'tax_percent',
                      'price', 'original_price', 'tag', 'occasion', 'wedding_category',
                      'gift_tags', 'gift_subcategory',
                      'gender', 'age_group', 'is_active',
                      'stock_quantity', 'low_stock_threshold']:   # ── NEW: restock fields ──
            if field in request.data:
                value = request.data[field]
                if field in INT_FIELDS:
                    value = int(value)
                elif field in DECIMAL_FIELDS and value not in ['', None]:
                    value = Decimal(str(value))
                elif field in BOOL_FIELDS:
                    value = value in [True, 'true', 'True', '1', 1]
                setattr(product, field, value)

        # ── NEW: Restock pannina, stock > 0 aana automatic-a "active" ah maathum ──
        if 'stock_quantity' in request.data and int(request.data['stock_quantity']) > 0:
            product.is_active = True

        product.save()

        # Sync Super Admin stock holdings if stock_quantity was updated
        if product.is_internal_asset and 'stock_quantity' in request.data:
            stk, _ = JewelryStock.objects.get_or_create(user=request.user, product=product, defaults={'qty': 0})
            stk.qty = product.stock_quantity
            stk.save(update_fields=['qty'])

        new_images = request.FILES.getlist('uploaded_images')
        if new_images:
            last_order = product.images.count()
            for i, img in enumerate(new_images):
                JewelryProductImage.objects.create(product=product, image=img, order=last_order + i)

        serializer = JewelryProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        if request.user.role != 'super_admin':  # ✅ 8 spaces
            return Response({'error': 'Permission denied'}, status=403)
        try:
            product = JewelryProduct.objects.get(id=pk)
            product.delete()
            return Response({'message': 'Product deleted'})
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Not found'}, status=404) 

# ── NEW: Sold Out / Low Stock products list — dashboard "Notify" click ku ──
class SoldOutProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        from django.db.models import F, Q
        filter_type = request.query_params.get('filter', 'sold_out')  # sold_out | low_stock | both

        qs = JewelryProduct.objects.all().prefetch_related('images')
        if filter_type == 'sold_out':
            qs = qs.filter(stock_quantity=0)
        elif filter_type == 'low_stock':
            qs = qs.filter(stock_quantity__gt=0, stock_quantity__lte=F('low_stock_threshold'))
        else:  # both
            qs = qs.filter(Q(stock_quantity=0) | Q(stock_quantity__lte=F('low_stock_threshold')))

        qs = qs.order_by('stock_quantity')
        serializer = JewelryProductSerializer(qs, many=True, context={'request': request})
        return Response({
            'count': qs.count(),
            'results': serializer.data,
        })

# ── NEW: Customer "Notify Me" ── 
class StockNotifyRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Customer sold-out product-la 'Notify Me' click pண்ணும்pothு call aagும்."""
        product_id = request.data.get('product_id')
        try:
            product = JewelryProduct.objects.get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        obj, created = StockNotifyRequest.objects.get_or_create(
            product=product, user=request.user
        )
        if not created:
            return Response({'message': 'You already requested notification for this product.'}, status=200)
        return Response({'message': 'We will notify you when this product is back in stock!'}, status=201)

    def get(self, request):
        """
        Customer: 'my_requests=true' query param -> avanga own notify requests (product IDs) return pண்ணும்,
        so frontend button state ah check pண்ண mудியும்.
        Super Admin: ella requests-ayум் product-wise group பண்ணி return pண்ணும்.
        """
        if request.query_params.get('my_requests') == 'true':
            ids = list(StockNotifyRequest.objects.filter(user=request.user).values_list('product_id', flat=True))
            return Response({'product_ids': ids})

        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        notified_filter = request.query_params.get('notified')
        qs = StockNotifyRequest.objects.select_related('product', 'user').order_by('-created_at')
        if notified_filter == 'false':
            qs = qs.filter(notified=False)

        serializer = StockNotifyRequestSerializer(qs, many=True)

        # ── product-wise group pண்ணுறோம் — Super Admin ku "இந்த product-க்கு 5 pேr wait pண்றாங்க" nு தெரிய ──
        grouped = {}
        for item in serializer.data:
            pid = item['product']
            if pid not in grouped:
                grouped[pid] = {
                    'product_id': pid,
                    'product_name': item['product_name'],
                    'product_code': item['product_code'],
                    'current_stock': item['product_stock'],
                    'waiting_count': 0,
                    'customers': [],
                }
            grouped[pid]['waiting_count'] += 1
            grouped[pid]['customers'].append({
                'notify_id': item['id'],
                'email': item['customer_email'],
                'role': item['customer_role'],
                'id_str': item['customer_id_str'],
                'requested_at': item['created_at'],
                'notified': item['notified'],
            })

        results = sorted(grouped.values(), key=lambda x: x['waiting_count'], reverse=True)
        return Response({'total_requests': len(serializer.data), 'products': results})    


class JewelryProductImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            img = JewelryProductImage.objects.get(id=pk)
            img.image.delete()
            img.delete()
            return Response({'message': 'Image deleted'})
        except JewelryProductImage.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)



class HomeBannerView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        banners = HomeBanner.objects.filter(is_active=True).order_by('slot')
        serializer = HomeBannerSerializer(banners, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        slot = request.data.get('slot')
        image = request.FILES.get('image')
        if not slot or not image:
            return Response({'error': 'slot and image required'}, status=400)
        existing = HomeBanner.objects.filter(slot=slot).first()
        if existing:
            existing.image.delete(save=False)
            existing.image = image
            existing.is_active = True
            existing.save()
            serializer = HomeBannerSerializer(existing, context={'request': request})
            return Response(serializer.data)
        banner = HomeBanner.objects.create(slot=slot, image=image)
        serializer = HomeBannerSerializer(banner, context={'request': request})
        return Response(serializer.data, status=201)


class HomeBannerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            banner = HomeBanner.objects.get(id=pk)
        except HomeBanner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if 'image' in request.FILES:
            banner.image.delete(save=False)
            banner.image = request.FILES['image']
        if 'is_active' in request.data:
            banner.is_active = request.data['is_active'] in [True, 'true', '1']
        banner.save()
        serializer = HomeBannerSerializer(banner, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            banner = HomeBanner.objects.get(id=pk)
            banner.image.delete(save=False)
            banner.delete()
            return Response({'message': 'Banner deleted'})
        except HomeBanner.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)   


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """User's cart items fetch"""
        items = CartItem.objects.filter(user=request.user).select_related('product').prefetch_related('product__images')
        serializer = CartItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Add to cart - product_id + qty"""
        product_id = request.data.get('product_id')
        qty = int(request.data.get('qty', 1))

        if not product_id:
            return Response({'error': 'product_id required'}, status=400)

        try:
            product = JewelryProduct.objects.get(id=product_id, is_active=True)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # Already in cart → qty update
        item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'qty': qty}
        )
        if not created:
            item.qty += qty
            item.save()

        serializer = CartItemSerializer(item, context={'request': request})
        return Response(serializer.data, status=201 if created else 200)

    def delete(self, request):
        """Remove specific item - product_id send பண்ணு"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)

        CartItem.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'message': 'Removed from cart'})


class CartItemQtyView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        """Update qty for a cart item"""
        try:
            item = CartItem.objects.get(id=pk, user=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        qty = int(request.data.get('qty', 1))
        if qty < 1:
            item.delete()
            return Response({'message': 'Item removed'})

        item.qty = qty
        item.save()
        serializer = CartItemSerializer(item, context={'request': request})
        return Response(serializer.data)                     

class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user).select_related('product').prefetch_related('product__images')
        serializer = WishlistItemSerializer(items, many=True, context={'request': request})
        return Response({'count': items.count(), 'items': serializer.data})

    def post(self, request):
        """Toggle wishlist — add if not exists, remove if exists"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        try:
            product = JewelryProduct.objects.get(id=product_id, is_active=True)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        existing = Wishlist.objects.filter(user=request.user, product=product).first()
        if existing:
            existing.delete()
            return Response({'action': 'removed', 'message': 'Removed from wishlist'})
        else:
            Wishlist.objects.create(user=request.user, product=product)
            return Response({'action': 'added', 'message': 'Added to wishlist'}, status=201)

    def delete(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({'message': 'Removed from wishlist'})

class JewelryOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Customer places a jewelry order"""
        data = request.data
        
        product_id = data.get('product_id')
        product_image_url = data.get('product_image_url', '')
        quantity = int(data.get('quantity', 1))
        
        try:
            product = JewelryProduct.objects.get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # ── NEW: Atomic stock check + reduce — race condition safe ──
        from django.db.models import F
        updated_rows = JewelryProduct.objects.filter(
            id=product_id, stock_quantity__gte=quantity
        ).update(stock_quantity=F('stock_quantity') - quantity)

        if not updated_rows:
            return Response({'error': f'Only limited stock left for {product.name}. Please reduce quantity.'}, status=400)

        # ── NEW: Auto sold-out — stock 0 aana product hide aagum ──
        product.refresh_from_db()
        if product.stock_quantity <= 0:
            product.is_active = False
            product.save(update_fields=['is_active'])

        # Get first image URL if not provided
        if not product_image_url:
            first_img = product.images.first()
            if first_img:
                product_image_url = request.build_absolute_uri(first_img.image.url)

        order = JewelryOrder.objects.create(
            user=request.user,
            product=product,
            product_name=product.name,
            product_metal=product.metal,
            product_grade=product.grade or '',
            product_category=product.category,
            product_image_url=product_image_url,
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            customer_alt_phone=data.get('customer_alt_phone', ''),
            customer_dob=data.get('customer_dob') or None,
            customer_anniversary=data.get('customer_anniversary') or None,
            pincode=data.get('pincode', ''),
            address_line1=data.get('address_line1', ''),
            address_line2=data.get('address_line2', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            quantity=int(data.get('quantity', 1)),
            unit_price=float(data.get('unit_price', 0)),
            total_price=float(data.get('total_price', 0)),
            payment_method=data.get('payment_method', 'upi'),
            payment_status='pending',
            status='pending',
        )

        # ── NEW: commission chain ku pogum — "Place Order" vachi pannina orders-kum trigger aagum ──
        try:
            distribute_commission(order)
        except Exception as e:
            print('❌ distribute_commission FAILED (JewelryOrderView):', repr(e))

        serializer = JewelryOrderSerializer(order, context={'request': request})
        return Response({
            'message': 'Order placed successfully!',
            'order_id': order.order_id,
            'data': serializer.data
        }, status=201)
    

    # AFTER — select_related + prefetch_related add pannuna N+1 fix aagum
    def get(self, request):
        """Super admin sees all orders; customer sees own orders"""
        base_qs = JewelryOrder.objects.select_related(
            'user', 'product'
        ).prefetch_related(
            'product__images'
        )
        if request.user.role == 'super_admin':
            orders = base_qs.all().order_by('-created_at')
        else:
            orders = base_qs.filter(user=request.user).order_by('-created_at')
        
        serializer = JewelryOrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            order = JewelryOrder.objects.get(id=pk)
        except JewelryOrder.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        status_val = request.data.get('status')
        if status_val and status_val != order.status:
            order.status = status_val
            order.save()
            # ── Auto-log a tracking checkpoint on every status change, so the
            # customer's tracking timeline always has at least this milestone
            # even if the admin doesn't separately add a detailed update. ──
            valid_stages = dict(OrderTrackingEvent.STAGE_CHOICES)
            if status_val in valid_stages:
                OrderTrackingEvent.objects.create(
                    order=order, stage=status_val,
                    location=request.data.get('location', '') or order.city,
                    note=request.data.get('note', ''),
                    created_by=request.user,
                )
        return Response(JewelryOrderSerializer(order, context={'request': request}).data)


def _admin_orders_period_queryset(period, start_date, end_date):
    """Today / Week / Month / Year / Custom — same shape as the other period
    filters in this file. 'today' is the default so the Admin Orders page's
    first load is always small instead of pulling every order ever placed."""
    qs = JewelryOrder.objects.all()
    today = timezone.now().date()

    if period == 'today':
        qs = qs.filter(created_at__date=today)
    elif period == 'week':
        start_of_week = today - timedelta(days=today.weekday())
        qs = qs.filter(created_at__date__gte=start_of_week, created_at__date__lte=today)
    elif period == 'month':
        qs = qs.filter(created_at__year=today.year, created_at__month=today.month)
    elif period == 'year':
        qs = qs.filter(created_at__year=today.year)
    elif period == 'custom' and start_date and end_date:
        qs = qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    # period == 'all' — no date filter, everything

    return qs


class AdminOrdersListView(APIView):
    """Dedicated, paginated Super Admin orders list — JewelryOrderView.get()
    (used everywhere else, including the customer's own order history) loads
    every single order with no limit, which is fine for one customer's orders
    but becomes very slow once thousands of orders exist across all customers.
    This view period-filters at the DB level (default: today), paginates with
    offset/limit, and computes the stat cards via DB aggregates — never by
    loading full rows into Python."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'today')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        status_filter = request.query_params.get('status', 'all')
        search = request.query_params.get('search', '').strip()
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 100))

        period_qs = _admin_orders_period_queryset(period, start_date, end_date)

        # ── Stat cards — DB aggregate over the period scope only, unaffected by
        # the status/search filter below so the counts stay stable while browsing ──
        status_counts = dict(
            period_qs.values('status').annotate(c=Count('id')).values_list('status', 'c')
        )
        total_revenue = period_qs.aggregate(s=Sum('total_price'))['s'] or 0

        qs = period_qs.select_related('user', 'product').order_by('-created_at')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(order_id__icontains=search) | Q(product_name__icontains=search) |
                Q(customer_name__icontains=search) | Q(customer_phone__icontains=search) |
                Q(user__email__icontains=search)
            )

        total_count = qs.count()
        page = qs[offset:offset + limit]
        serializer = JewelryOrderSerializer(page, many=True, context={'request': request})

        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
            'stats': {
                'total': sum(status_counts.values()),
                'pending': status_counts.get('pending', 0),
                'confirmed': status_counts.get('confirmed', 0),
                'processing': status_counts.get('processing', 0),
                'shipped': status_counts.get('shipped', 0),
                'delivered': status_counts.get('delivered', 0),
                'cancelled': status_counts.get('cancelled', 0),
                'revenue': float(total_revenue),
            },
        })


class OrderTrackingView(APIView):
    """Amazon/Flipkart-style shipment timeline for one order — GET returns
    every checkpoint (stage + location + note, oldest first) for the order
    owner or Super Admin; POST lets Super Admin add a detailed checkpoint
    (location + note) separately from the plain status dropdown, for cases
    like 'In Transit' hub-to-hub updates that aren't a status change."""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = JewelryOrder.objects.get(order_id=order_id)
        except JewelryOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.user_id != request.user.id and request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        events = order.tracking_events.all()
        return Response({
            'order_id': order.order_id,
            'current_status': order.status,
            'events': OrderTrackingEventSerializer(events, many=True).data,
        })

    def post(self, request, order_id):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        try:
            order = JewelryOrder.objects.get(order_id=order_id)
        except JewelryOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        stage = request.data.get('stage')
        if stage not in dict(OrderTrackingEvent.STAGE_CHOICES):
            return Response({'error': 'Invalid stage'}, status=400)

        event = OrderTrackingEvent.objects.create(
            order=order, stage=stage,
            location=request.data.get('location', '').strip(),
            note=request.data.get('note', '').strip(),
            created_by=request.user,
        )
        return Response(OrderTrackingEventSerializer(event).data, status=201)

# ── COMMISSION DISTRIBUTION ENGINE ──
# Order oda buyer-ஐ irundhu மேலே ஏறி, created_by chain walk pண்ணி commission distribute pண்ணும்.
COMMISSION_POOL_PERCENT = Decimal('27.00')
COMMISSION_LEVEL1_PERCENT = Decimal('7.00')
COMMISSION_LEVEL_PERCENT = Decimal('1.00')
SUPER_ADMIN_OWN_PERCENT = Decimal('1.00')   # ── NEW: Super Admin's fixed "My Commission" share ──

_ROLE_PROFILE_MAP = {
    'customer': CustomerProfile,
    'promotor': PromotorProfile,
    'sub_dealer': SubDealerProfile,
    'dealer': DealerProfile,
    'admin': AdminProfile,
}

def _get_creator_user(user):
    """Idha user-ஐ direct create pண்ணின User-ஐ return pண்ணும் (role edhுவும் ஆகலாம்)."""
    model = _ROLE_PROFILE_MAP.get(user.role)
    if not model:
        return None
    try:
        profile = model.objects.get(user=user)
        return profile.created_by
    except model.DoesNotExist:
        return None


def build_commission_chain(buyer_user):
    """Buyer-ஐ இருந்து மேலே ஏறி, Super Admin varaikkum chain build pண்ணும்.
    Loop-safe — seen ids track pண்ணுறோம்."""
    chain = []
    current = buyer_user
    seen = set()
    while True:
        creator = _get_creator_user(current)
        if not creator or creator.id in seen:
            break
        seen.add(creator.id)
        chain.append(creator)
        if creator.role == 'super_admin':
            break
        current = creator
    return chain


def distribute_commission(order):
    """Order success aana odane call pண்ணனும் — 27% chain ku distribute pண்ணும்,
    balance Super Admin ku pogும். Role edhுவும் irundhalும் (customer/promotor/
    sub_dealer/dealer/admin) buyer order pannalum commission chain trigger aagum."""
    now = timezone.now()
    cache.delete(f'month_rollup_counts_{now.strftime("%Y%m")}')
    cache.delete(f'month_status_map_{now.strftime("%Y%m")}')
    buyer = order.user
    # ── role restriction REMOVED — evaru order pannalum commission poogum ──

    total_amount = Decimal(str(order.total_price))
    chain = build_commission_chain(buyer)

    remaining_percent = COMMISSION_POOL_PERCENT
    level = 0

    for creator_user in chain:
        if creator_user.role == 'super_admin':
            break   # Super Admin ku balance kீழே handle pண்ணுறோம்

        if remaining_percent <= 0:
            break

        level += 1
        pct = COMMISSION_LEVEL1_PERCENT if level == 1 else COMMISSION_LEVEL_PERCENT
        if pct > remaining_percent:
            pct = remaining_percent

        amount = (total_amount * pct / Decimal('100')).quantize(Decimal('0.01'))
        coins = int(amount * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=creator_user)
        wallet.balance_coins += coins
        wallet.save(update_fields=['balance_coins'])

        try:
            CoinRecharge.objects.create(
                user=creator_user, amount_paid=amount, coins_credited=coins,
                payment_method='commission', status='success',
                entry_type='credit', source='commission',
                related_order=order, commission_level=level,
            )
        except Exception as e:
            print(f'❌ Commission log FAILED for {creator_user.email}:', repr(e))
        remaining_percent -= pct

    # ── Super Admin — split into "My Commission" (fixed 1%) + "Balance" (remainder).
    # Entry mattum than create aagum evlo actual amount kidaicha — zero na entry ye illa,
    # adhunala "Today" list-la evlo orders-ku real-a commission kidaichucho, adhu mattum varum. ──
    super_admin = User.objects.filter(role='super_admin').first()
    if super_admin and remaining_percent > 0:
        my_commission_pct = min(SUPER_ADMIN_OWN_PERCENT, remaining_percent)
        balance_pct = remaining_percent - my_commission_pct

        # ── My Commission — Super Admin's own fixed 1% share, commission_level=-1 ──
        if my_commission_pct > 0:
            my_amount = (total_amount * my_commission_pct / Decimal('100')).quantize(Decimal('0.01'))
            my_coins = int(my_amount * COIN_RATE_PER_RUPEE)

            wallet, _ = Wallet.objects.get_or_create(user=super_admin)
            wallet.balance_coins += my_coins
            wallet.save(update_fields=['balance_coins'])

            try:
                CoinRecharge.objects.create(
                    user=super_admin, amount_paid=my_amount, coins_credited=my_coins,
                    payment_method='commission', status='success',
                    entry_type='credit', source='commission',
                    related_order=order, commission_level=-1,
                )
            except Exception as e:
                print('❌ Super Admin MY COMMISSION log FAILED:', repr(e))

        # ── Balance — leftover percent (Super Admin Commission), commission_level=0 ──
        if balance_pct > 0:
            bal_amount = (total_amount * balance_pct / Decimal('100')).quantize(Decimal('0.01'))
            bal_coins = int(bal_amount * COIN_RATE_PER_RUPEE)

            wallet, _ = Wallet.objects.get_or_create(user=super_admin)
            wallet.balance_coins += bal_coins
            wallet.save(update_fields=['balance_coins'])

            try:
                CoinRecharge.objects.create(
                    user=super_admin, amount_paid=bal_amount, coins_credited=bal_coins,
                    payment_method='commission', status='success',
                    entry_type='credit', source='commission',
                    related_order=order, commission_level=0,
                )
            except Exception as e:
                print('❌ Super Admin BALANCE COMMISSION log FAILED:', repr(e))


# ── VIEW 1: Razorpay Order Create ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    try:
        amount = request.data.get('amount')  # Frontend ₹ amount அனுப்பும்
        
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        
        # Razorpay-ல order create பண்ணு
        razorpay_order = client.order.create({
            "amount": int(float(amount)) * 100,  # Paise-ல அனுப்பணும்
            "currency": "INR",
            "payment_capture": 1
        })
        
        return Response({
            "razorpay_order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# ── VIEW 2: Payment Verify + Order Save ──
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        data = request.data
        
        # Signature verify பண்ணு (Security check)
        body = data['razorpay_order_id'] + "|" + data['razorpay_payment_id']
        
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_sig != data['razorpay_signature']:
            return Response({"status": "failed", "msg": "Invalid signature"}, status=400)
        
        # ✅ Payment genuine! - Order Database-ல save பண்ணு
        # உன் existing Order model இருந்தா இங்க use பண்ணு
        order_id = "BB" + data['razorpay_payment_id'][-8:].upper()
        
        

        # ✅ JewelryOrder model-ல save பண்ணு
        try:
            product = JewelryProduct.objects.get(id=data.get('product_id'))
            product_image_url = data.get('product_image_url', '')
            if not product_image_url:
                first_img = product.images.first()
                if first_img:
                    product_image_url = request.build_absolute_uri(first_img.image.url)
            order = JewelryOrder.objects.create(
                user=request.user,
                product=product,
                product_name=product.name,
                product_metal=product.metal,
                product_grade=product.grade or '',
                product_category=product.category,
                product_image_url=product_image_url,
                customer_name=data.get('customer_name', ''),
                customer_phone=data.get('customer_phone', ''),
                customer_alt_phone='',
                pincode=data.get('pincode', ''),
                address_line1=data.get('address_line1', ''),
                address_line2=data.get('address_line2', ''),
                city=data.get('city', ''),
                state=data.get('state', ''),
                quantity=int(data.get('quantity', 1)),
                unit_price=float(data.get('unit_price', 0)),
                total_price=float(data.get('total_price', 0)),
                payment_method='razorpay',
                payment_status='paid',
                status='confirmed',
                razorpay_order_id=data['razorpay_order_id'],
                razorpay_payment_id=data['razorpay_payment_id'],
            )
            order_id = order.order_id
            distribute_commission(order)   # ── NEW: commission chain ku pogும் ──
        except Exception as e:
            print('❌ JewelryOrder SAVE FAILED:', repr(e))
            order_id = "BB" + data['razorpay_payment_id'][-8:].upper()
        
        return Response({
            "status": "success",
            "order_id": order_id,
            "payment_id": data['razorpay_payment_id']
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)


def _serialize_order(o):
    img_url = o.product_image_url
    if not img_url and o.product:
        first_img = o.product.images.first()
        if first_img:
            img_url = first_img.image.url
    return {
        'id': o.id,
        'order_id': o.order_id,
        'product_name': o.product_name,
        'metal': o.product_metal,
        'grade': o.product_grade,
        'category': o.product_category,
        'net_weight': str(o.product.net_weight) if o.product and o.product.net_weight else None,
        'product_image_url': img_url,
        'quantity': o.quantity,
        'unit_price': float(o.unit_price),
        'total_price': float(o.total_price),
        'status': o.status,
        'created_at': o.created_at,
    }

def _orders_by_user_map(user_ids):
    orders_by_user = {}
    qs = JewelryOrder.objects.filter(user_id__in=user_ids).select_related('product').order_by('-created_at')
    for o in qs:
        orders_by_user.setdefault(o.user_id, []).append(_serialize_order(o))
    return orders_by_user

def _collect_user_ids_admin(a):
    ids = []
    for d in a.assigned_dealers.all():
        for sd in d.assigned_sub_dealers.all():
            for p in sd.assigned_promotors.all():
                for c in p.assigned_customers.all():
                    ids.append(c.user_id)
    return ids

def _collect_user_ids_dealer(d):
    ids = []
    for sd in d.assigned_sub_dealers.all():
        for p in sd.assigned_promotors.all():
            for c in p.assigned_customers.all():
                ids.append(c.user_id)
    return ids

def _collect_user_ids_sub_dealer(sd):
    ids = []
    for p in sd.assigned_promotors.all():
        for c in p.assigned_customers.all():
            ids.append(c.user_id)
    return ids

def _bulk_orders_for_admin(a):
    return _orders_by_user_map(_collect_user_ids_admin(a) + [a.user_id])

def _bulk_orders_for_dealer(d):
    return _orders_by_user_map(_collect_user_ids_dealer(d) + [d.user_id])

def _bulk_orders_for_sub_dealer(sd):
    return _orders_by_user_map(_collect_user_ids_sub_dealer(sd) + [sd.user_id])

def _bulk_orders_for_promotor(p):
    ids = [c.user_id for c in p.assigned_customers.all()]
    return _orders_by_user_map(ids)


def _monthly_order_counts_map(user_ids):
    """DB level la ella customer kum ore query la group-by + count.
    Python loop venaam — idhu than 3 min ஆனத்துக்கு main reason."""
    now = timezone.now()
    counts = dict(
        JewelryOrder.objects.filter(
            user_id__in=user_ids,
            created_at__year=now.year,
            created_at__month=now.month,
        ).values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )
    return counts


def _get_children_by_creator():
    """Map: creator user_id -> list of CustomerProfile objects directly
    referred by them (the customer-refers-customer chain)."""
    from collections import defaultdict
    children_by_creator = defaultdict(list)
    for cust in CustomerProfile.objects.all().only(
        'id', 'user_id', 'created_by_id', 'customer_id',
        'first_name', 'last_name', 'mobile_number', 'city_name'
    ):
        children_by_creator[cust.created_by_id].append(cust)
    return children_by_creator


def _collect_nested_customer_ids(user_id, children_by_creator, seen=None):
    """Every descendant customer's user_id under this user, any depth."""
    if seen is None:
        seen = set()
    ids = []
    for child in children_by_creator.get(user_id, []):
        if child.user_id in seen:
            continue
        seen.add(child.user_id)
        ids.append(child.user_id)
        ids.extend(_collect_nested_customer_ids(child.user_id, children_by_creator, seen))
    return ids


def _build_customer(c, orders_by_user, monthly_counts, children_by_creator=None):
    orders = orders_by_user.get(c.user_id, [])
    monthly_count = monthly_counts.get(c.user_id, 0)   # ← O(1) dict lookup, loop illa
    nested_customers = []
    if children_by_creator:
        nested_customers = [
            _build_customer(sc, orders_by_user, monthly_counts, children_by_creator)
            for sc in children_by_creator.get(c.user_id, [])
        ]
    return {
        'type': 'customer', 'id': c.id, 'customer_id': c.customer_id,
        'first_name': c.first_name, 'last_name': c.last_name,
        'mobile_number': c.mobile_number, 'city_name': c.city_name,
        'orders': orders,
        'order_count': monthly_count,
        'status': get_target_status(monthly_count),
        'customers': nested_customers,
    }

def _build_promotor(p, orders_by_user, monthly_counts, children_by_creator=None):
    customers = [_build_customer(c, orders_by_user, monthly_counts, children_by_creator) for c in p.assigned_customers.all()]
    own_orders = orders_by_user.get(p.user_id, [])
    own_monthly = monthly_counts.get(p.user_id, 0)
    return {
        'type': 'promotor', 'id': p.id, 'promotor_id': p.promotor_id, 'user_id': p.user_id,
        'first_name': p.first_name, 'last_name': p.last_name,
        'mobile_number': p.mobile_number, 'city_name': p.city_name,
        'customers': customers,
        'own_orders': own_orders,
        'order_count': sum(c['order_count'] for c in customers) + own_monthly,
        'status': worst_status([c['status'] for c in customers] + [get_target_status(own_monthly)]),
    }

def _build_sub_dealer(sd, orders_by_user, monthly_counts, children_by_creator=None):
    promotors = [_build_promotor(p, orders_by_user, monthly_counts, children_by_creator) for p in sd.assigned_promotors.all()]
    own_orders = orders_by_user.get(sd.user_id, [])
    own_monthly = monthly_counts.get(sd.user_id, 0)
    return {
        'type': 'sub_dealer', 'id': sd.id, 'sub_dealer_id': sd.sub_dealer_id, 'user_id': sd.user_id,
        'first_name': sd.first_name, 'last_name': sd.last_name,
        'mobile_number': sd.mobile_number, 'city_name': sd.city_name,
        'promotors': promotors,
        'own_orders': own_orders,
        'order_count': sum(p['order_count'] for p in promotors) + own_monthly,
        'status': worst_status([p['status'] for p in promotors] + [get_target_status(own_monthly)]),
    }

def _build_dealer(d, orders_by_user, monthly_counts, children_by_creator=None):
    sub_dealers = [_build_sub_dealer(sd, orders_by_user, monthly_counts, children_by_creator) for sd in d.assigned_sub_dealers.all()]
    own_orders = orders_by_user.get(d.user_id, [])
    own_monthly = monthly_counts.get(d.user_id, 0)
    return {
        'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id, 'user_id': d.user_id,
        'first_name': d.first_name, 'last_name': d.last_name,
        'mobile_number': d.mobile_number, 'city_name': d.city_name,
        'sub_dealers': sub_dealers,
        'own_orders': own_orders,
        'order_count': sum(sd['order_count'] for sd in sub_dealers) + own_monthly,
        'status': worst_status([sd['status'] for sd in sub_dealers] + [get_target_status(own_monthly)]),
    }

def _build_admin(a, orders_by_user, monthly_counts, children_by_creator=None):
    dealers = [_build_dealer(d, orders_by_user, monthly_counts, children_by_creator) for d in a.assigned_dealers.all()]
    own_orders = orders_by_user.get(a.user_id, [])
    own_monthly = monthly_counts.get(a.user_id, 0)
    return {
        'type': 'admin', 'id': a.id, 'admin_id': a.admin_id, 'user_id': a.user_id,
        'first_name': a.first_name, 'last_name': a.last_name,
        'mobile_number': a.mobile_number, 'city_name': a.city_name,
        'dealers': dealers,
        'own_orders': own_orders,
        'order_count': sum(d['order_count'] for d in dealers) + own_monthly,
        'status': worst_status([d['status'] for d in dealers] + [get_target_status(own_monthly)]),
    }


class HierarchySubtreeOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        if not role or not node_id:
            return Response({'error': 'role and id required'}, status=400)

        try:
            if role == 'admin':
                node = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_admin(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(node))
                root = _build_admin(node, orders_by_user, monthly_counts)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(node))
                root = _build_dealer(node, orders_by_user, monthly_counts)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(id=node_id)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(node))
                root = _build_sub_dealer(node, orders_by_user, monthly_counts)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(id=node_id)
                orders_by_user = _bulk_orders_for_promotor(node)
                monthly_counts = _monthly_order_counts_map(
                    [c.user_id for c in node.assigned_customers.all()]
                )
                root = _build_promotor(node, orders_by_user, monthly_counts)
            elif role == 'customer':
                node = CustomerProfile.objects.get(id=node_id)
                orders_by_user = _orders_by_user_map([node.user_id])
                monthly_counts = _monthly_order_counts_map([node.user_id])
                root = _build_customer(node, orders_by_user, monthly_counts)
            else:
                return Response({'error': 'invalid role'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        return Response({'root': root})


# ── NEW: Selected node kila irukka orders ah product-wise group panni,
# DB level offset/limit pagination kudukum. Right panel (product cards) ku idha use pannuvom ──
class HierarchyNodeOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        period = request.query_params.get('period')
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 20))

        try:
            user_ids = _resolve_scope_user_ids(request.user, role, node_id)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        qs = JewelryOrder.objects.filter(user_id__in=user_ids)
        if period == 'today':
            today = timezone.now().date()
            qs = qs.filter(created_at__date=today)
        elif period != 'all':
            # ── NEW: default = this month mattum — Grid page-la kaattura SALES(X)
            # number matching aagum. period=all pass panninaa mattum lifetime varum ──
            now = timezone.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=month_start)

        # ── Overall totals — MOTHATHA subtree ku, pagination touch pannadhu ──
        overall = qs.aggregate(total_count=Count('id'), total_amount=Sum('total_price'))

        # ── product + owner vachi group pannurom — DB level la ──
        grouped_qs = (
            qs.values('product_id', 'product_name', 'product_metal', 'product_grade',
                      'product_category', 'user_id')
            .annotate(
                total_qty=Sum('quantity'),
                total_amount=Sum('total_price'),
                latest_at=Max('created_at'),
                last_unit_price=Max('unit_price'),
            )
            .order_by('-latest_at')
        )

        total_groups = grouped_qs.count()
        page = list(grouped_qs[offset:offset + limit])

        owner_user_ids = [g['user_id'] for g in page]
        owners = {cp.user_id: cp for cp in CustomerProfile.objects.filter(user_id__in=owner_user_ids)}
        product_ids = [g['product_id'] for g in page if g['product_id']]
        products = {p.id: p for p in JewelryProduct.objects.filter(id__in=product_ids).prefetch_related('images')}

        results = []
        for g in page:
            owner = owners.get(g['user_id'])
            product = products.get(g['product_id'])
            img_url = None
            if product:
                first_img = product.images.first()
                if first_img:
                    img_url = first_img.image.url
            results.append({
                'product_name': g['product_name'], 'metal': g['product_metal'],
                'grade': g['product_grade'], 'category': g['product_category'],
                'net_weight': str(product.net_weight) if product and product.net_weight else None,
                'image': img_url,
                'total_qty': g['total_qty'], 'total_amount': float(g['total_amount']),
                'last_rate': float(g['last_unit_price']), 'latest_at': g['latest_at'],
                # ── NEW: user_id add pண்ணுறோம் — front-end path-to-node lookup ku thevai ──
                'owner': {'id': owner.id, 'user_id': owner.user_id, 'first_name': owner.first_name, 'last_name': owner.last_name} if owner else None,
            })

        return Response({
            'items': results, 'total_groups': total_groups,
            'overall_count': overall['total_count'] or 0,
            'overall_amount': float(overall['total_amount'] or 0),
        })

def _month_status_map():
    """dict: (role, profile_id) -> status ('red'/'orange'/'yellow'/'green').
    ── NEW: cached same way as _month_rollup_counts — idhu ella profile
    ah Python-la load panni recursive calculate pண்ணுthு, romba heavy ──"""
    cache_key = f'month_status_map_{timezone.now().strftime("%Y%m")}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    own_counts = dict(
        JewelryOrder.objects.filter(created_at__gte=month_start)
        .values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )

    customers = list(CustomerProfile.objects.all().values('id', 'user_id', 'created_by_id', 'assigned_promotor_id'))
    promotors = list(PromotorProfile.objects.all().values('id', 'user_id', 'assigned_sub_dealer_id'))
    sub_dealers = list(SubDealerProfile.objects.all().values('id', 'user_id', 'assigned_dealer_id'))
    dealers = list(DealerProfile.objects.all().values('id', 'user_id', 'assigned_admin_id'))
    admins = list(AdminProfile.objects.all().values('id', 'user_id'))

    subcustomers_by_creator = {}
    for c in customers:
        subcustomers_by_creator.setdefault(c['created_by_id'], []).append(c)

    customers_by_promotor = {}
    for c in customers:
        if c['assigned_promotor_id']:
            customers_by_promotor.setdefault(c['assigned_promotor_id'], []).append(c)

    promotors_by_sd = {}
    for p in promotors:
        if p['assigned_sub_dealer_id']:
            promotors_by_sd.setdefault(p['assigned_sub_dealer_id'], []).append(p)

    sds_by_dealer = {}
    for sd in sub_dealers:
        if sd['assigned_dealer_id']:
            sds_by_dealer.setdefault(sd['assigned_dealer_id'], []).append(sd)

    dealers_by_admin = {}
    for d in dealers:
        if d['assigned_admin_id']:
            dealers_by_admin.setdefault(d['assigned_admin_id'], []).append(d)

    status_map = {}
    customer_status_cache = {}

    def customer_status(c):
        if c['id'] in customer_status_cache:
            return customer_status_cache[c['id']]
        own = get_target_status(own_counts.get(c['user_id'], 0))
        sub_statuses = [customer_status(sc) for sc in subcustomers_by_creator.get(c['user_id'], [])]
        result = worst_status([own] + sub_statuses)
        customer_status_cache[c['id']] = result
        status_map[('customer', c['user_id'])] = result
        return result

    for c in customers:
        customer_status(c)

    for p in promotors:
        # ── FIX: "own" venaam — Promotor kila irukka customer status mattum vachi decide pannanum ──
        child_statuses = customer_status_cache and [customer_status_cache[c['id']] for c in customers_by_promotor.get(p['id'], [])]
        status_map[('promotor', p['id'])] = worst_status(child_statuses) if customers_by_promotor.get(p['id']) else 'red'

    for sd in sub_dealers:
        child_statuses = [status_map[('promotor', p['id'])] for p in promotors_by_sd.get(sd['id'], [])]
        status_map[('sub_dealer', sd['id'])] = worst_status(child_statuses) if child_statuses else 'red'

    for d in dealers:
        child_statuses = [status_map[('sub_dealer', sd['id'])] for sd in sds_by_dealer.get(d['id'], [])]
        status_map[('dealer', d['id'])] = worst_status(child_statuses) if child_statuses else 'red'

    for a in admins:
        child_statuses = [status_map[('dealer', d['id'])] for d in dealers_by_admin.get(a['id'], [])]
        status_map[('admin', a['id'])] = worst_status(child_statuses) if child_statuses else 'red'

    cache.set(cache_key, status_map, 120)   # ── NEW: 2 min TTL ──
    return status_map


# ── NEW: Lightweight — Level 1 mattum. Full tree venaam ──
class HierarchyAdminsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.localtime(timezone.now()).date()

        # All admin profiles with related user
        all_admin_profiles = list(AdminProfile.objects.select_related('user').all())
        total_all_count = len(all_admin_profiles)

        # Active user IDs for today (last_login today or DailyLoginLog today)
        active_user_ids = set(
            User.objects.filter(role='admin', last_login__date=today).values_list('id', flat=True)
        ) | set(
            DailyLoginLog.objects.filter(user__role='admin', login_date=today).values_list('user_id', flat=True)
        )

        today_active_count = sum(1 for a in all_admin_profiles if a.user_id in active_user_ids)
        today_inactive_count = max(0, total_all_count - today_active_count)
        today_orders_count = JewelryOrder.objects.filter(created_at__date=today).count()

        # NEW: search filter — Python-level (admin_id/name/mobile/email match)
        search = request.query_params.get('search', '').strip().lower()
        if search:
            admins = [a for a in all_admin_profiles if (
                search in (a.admin_id or '').lower() or
                search in f"{a.first_name} {a.last_name}".lower() or
                search in (a.mobile_number or '') or
                search in (a.user.email if a.user else '').lower()
            )]
        else:
            admins = all_admin_profiles

        admin_ids = [a.user_id for a in admins]

        dealer_counts = dict(
            DealerProfile.objects.filter(assigned_admin__user_id__in=admin_ids)
            .values('assigned_admin_id').annotate(c=Count('id')).values_list('assigned_admin_id', 'c')
        )

        rollup_counts = _month_rollup_counts()
        today_rollup = _today_rollup_counts()
        status_map = _month_status_map()

        # ── NEW: red/orange/yellow/green breakdown of each admin's DIRECT dealers ──
        dealers_for_status = list(
            DealerProfile.objects.filter(assigned_admin__user_id__in=admin_ids)
            .values('id', 'assigned_admin_id')
        )
        child_status_by_admin = {}
        for d in dealers_for_status:
            aid = d['assigned_admin_id']
            st = status_map.get(('dealer', d['id']), 'red')
            bucket = child_status_by_admin.setdefault(aid, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0})
            bucket[st] += 1

        results = []
        for a in admins:
            oc = rollup_counts.get(('admin', a.id), 0)
            today_oc = today_rollup.get(('admin', a.id), 0)
            status = status_map.get(('admin', a.id), 'red')
            is_active_today = a.user_id in active_user_ids
            last_login = a.user.last_login.isoformat() if (a.user and a.user.last_login) else None
            email = a.user.email if a.user else ''
            results.append({
                'id': a.id, 'user_id': a.user_id, 'admin_id': a.admin_id,
                'first_name': a.first_name, 'last_name': a.last_name,
                'email': email,
                'mobile_number': a.mobile_number, 'city_name': a.city_name,
                'dealer_count': dealer_counts.get(a.id, 0),
                'order_count': oc,
                'today_order_count': today_oc,
                'is_active_today': is_active_today,
                'last_login': last_login,
                'status': status,
                'child_status_counts': child_status_by_admin.get(a.id, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0}),
            })

        # Optional today_status filter: 'active' | 'inactive' | 'all'
        today_status = request.query_params.get('today_status')
        if today_status == 'active':
            results = [r for r in results if r['is_active_today']]
        elif today_status == 'inactive':
            results = [r for r in results if not r['is_active_today']]

        total_filtered = len(results)
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))
        page = results[offset:offset + limit]

        super_admin_user = User.objects.filter(role='super_admin').first()
        return Response({
            'super_admin_email': super_admin_user.email if super_admin_user else '',
            'admins': page,
            'total_count': total_all_count,
            'today_active_count': today_active_count,
            'today_inactive_count': today_inactive_count,
            'today_orders_count': today_orders_count,
            'filtered_count': total_filtered,
            'has_more': offset + limit < total_filtered,
        })


class HierarchyTierDirectoryView(APIView):
    """Same shape as HierarchyAdminsView (Total / Today Active / Today
    Inactive / Today Orders + a searchable, paginated list) but generalized
    to any tier via ?role= — powers the Distributor / Wholesale Dealer /
    Retailer / Customer directory pages' stat cards and search, without
    needing a separate hardcoded view per role."""
    permission_classes = [IsAuthenticated]

    PROFILE_MAP = {
        'admin': (AdminProfile, 'admin_id'),
        'dealer': (DealerProfile, 'dealer_id'),
        'sub_dealer': (SubDealerProfile, 'sub_dealer_id'),
        'promotor': (PromotorProfile, 'promotor_id'),
        'customer': (CustomerProfile, 'customer_id'),
    }

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        role = request.query_params.get('role')
        cfg = self.PROFILE_MAP.get(role)
        if not cfg:
            return Response({'error': 'invalid role'}, status=400)
        model, id_field = cfg

        today = timezone.localtime(timezone.now()).date()
        all_profiles = list(model.objects.select_related('user').all())
        total_all_count = len(all_profiles)

        active_user_ids = set(
            User.objects.filter(role=role, last_login__date=today).values_list('id', flat=True)
        ) | set(
            DailyLoginLog.objects.filter(user__role=role, login_date=today).values_list('user_id', flat=True)
        )
        today_active_count = sum(1 for p in all_profiles if p.user_id in active_user_ids)
        today_inactive_count = max(0, total_all_count - today_active_count)

        search = request.query_params.get('search', '').strip().lower()
        if search:
            profiles = [p for p in all_profiles if (
                search in (getattr(p, id_field, '') or '').lower() or
                search in f"{p.first_name} {p.last_name or ''}".lower() or
                search in (p.mobile_number or '') or
                search in (p.user.email if p.user else '').lower()
            )]
        else:
            profiles = all_profiles

        rollup_counts = _today_rollup_counts()
        today_orders_count = sum(
            rollup_counts.get((role, p.user_id if role == 'customer' else p.id), 0)
            for p in all_profiles
        )

        results = []
        for p in profiles:
            key = p.user_id if role == 'customer' else p.id
            results.append({
                'id': p.id, 'user_id': p.user_id,
                id_field: getattr(p, id_field, None),
                'first_name': p.first_name, 'last_name': p.last_name,
                'email': p.user.email if p.user else '',
                'mobile_number': p.mobile_number, 'city_name': getattr(p, 'city_name', None),
                'today_order_count': rollup_counts.get((role, key), 0),
                'is_active_today': p.user_id in active_user_ids,
                'last_login': p.user.last_login.isoformat() if (p.user and p.user.last_login) else None,
            })

        total_filtered = len(results)
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 300))
        page = results[offset:offset + limit]

        return Response({
            'results': page,
            'total_count': total_all_count,
            'today_active_count': today_active_count,
            'today_inactive_count': today_inactive_count,
            'today_orders_count': today_orders_count,
            'filtered_count': total_filtered,
            'has_more': offset + limit < total_filtered,
        })


# ── NEW: Generic — ஒரு node-oda DIRECT children mattum. role+id vachi call pண்ணுவாங்க ──
class HierarchyChildrenView(APIView):
    permission_classes = [IsAuthenticated]

    ROLE_CONFIG = {
        'admin':      {'model': DealerProfile,   'filter': 'assigned_admin_id',      'id_field': 'dealer_id',      'child_role': 'dealer'},
        'dealer':     {'model': SubDealerProfile,'filter': 'assigned_dealer_id',     'id_field': 'sub_dealer_id',  'child_role': 'sub_dealer'},
        'sub_dealer': {'model': PromotorProfile, 'filter': 'assigned_sub_dealer_id', 'id_field': 'promotor_id',    'child_role': 'promotor'},
        'promotor':   {'model': CustomerProfile, 'filter': 'assigned_promotor_id',   'id_field': 'customer_id',    'child_role': 'customer'},
    }

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        if role == 'customer':
            return self._customer_children(request)

        cfg = self.ROLE_CONFIG.get(role)
        if not cfg or not node_id:
            return Response({'error': 'invalid role/id'}, status=400)

        children = cfg['model'].objects.filter(**{cfg['filter']: node_id}).only(
            'id', 'user_id', cfg['id_field'], 'first_name', 'last_name', 'mobile_number', 'city_name'
        )
        child_ids = [c.user_id for c in children]

        grandchild_counts = {}
        child_status_breakdown = {}   # ── NEW: parent_id -> {red,orange,yellow,green} ──
        rollup_counts = _month_rollup_counts()
        status_map = _month_status_map()

        # ── FIX: role == 'promotor' na, child_role == 'customer' — customer chain
        # ROLE_CONFIG la illa (assigned_promotor_id illama, created_by_id vachi
        # chain pogum), so idha separate ah handle pannanum. Illana andha customer
        # kila innum customer irundhalum, toggle arrow kaamikkathu. ──
        if cfg['child_role'] == 'customer':
            gc = dict(
                CustomerProfile.objects.filter(created_by_id__in=child_ids)
                .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
            )
            grandchild_counts = gc  # ── key = user_id (created_by_id), not profile id ──

            # ── NEW: nested customer-to-customer status breakdown ──
            nested_customers = list(
                CustomerProfile.objects.filter(created_by_id__in=child_ids).values('user_id', 'created_by_id')
            )
            for nc in nested_customers:
                parent_uid = nc['created_by_id']
                st = status_map.get(('customer', nc['user_id']), 'red')
                bucket = child_status_breakdown.setdefault(parent_uid, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0})
                bucket[st] += 1
        else:
            next_cfg = self.ROLE_CONFIG.get(cfg['child_role'])
            if next_cfg:
                grandchildren = list(
                    next_cfg['model'].objects.filter(**{f"{next_cfg['filter'].replace('_id','')}__id__in": [c.id for c in children]})
                    .values('id', next_cfg['filter'])
                )
                gc = {}
                for g in grandchildren:
                    parent_id = g[next_cfg['filter']]
                    gc[parent_id] = gc.get(parent_id, 0) + 1
                    st = status_map.get((next_cfg['child_role'], g['id']), 'red')
                    bucket = child_status_breakdown.setdefault(parent_id, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0})
                    bucket[st] += 1
                grandchild_counts = gc

        count_key_attr = 'user_id' if cfg['child_role'] == 'customer' else 'id'

        results = []
        for c in children:
            key_val = c.user_id if cfg['child_role'] == 'customer' else c.id
            oc = rollup_counts.get((cfg['child_role'], key_val), 0)
            status = status_map.get((cfg['child_role'], key_val), 'red')
            results.append({
                'id': c.id, 'user_id': c.user_id, cfg['id_field']: getattr(c, cfg['id_field']),
                'first_name': c.first_name, 'last_name': c.last_name,
                'mobile_number': c.mobile_number, 'city_name': c.city_name,
                'child_count': grandchild_counts.get(getattr(c, count_key_attr), 0),
                'order_count': oc, 'status': status,
                'child_status_counts': child_status_breakdown.get(getattr(c, count_key_attr), {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0}),
            })
        return Response({'role': cfg['child_role'], 'items': results})

    def _customer_children(self, request):
        node_id = request.query_params.get('id')
        try:
            parent = CustomerProfile.objects.get(id=node_id)
        except CustomerProfile.DoesNotExist:
            return Response({'error': 'not found'}, status=404)

        children = CustomerProfile.objects.filter(created_by_id=parent.user_id).only(
            'id', 'user_id', 'customer_id', 'first_name', 'last_name', 'mobile_number', 'city_name'
        )
        child_ids = [c.user_id for c in children]
        sub_child_counts = dict(
            CustomerProfile.objects.filter(created_by_id__in=child_ids)
            .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
        )
        rollup_counts = _month_rollup_counts()
        status_map = _month_status_map()

        # ── NEW: grandchild (nested customer) status breakdown ──
        grandchildren = list(
            CustomerProfile.objects.filter(created_by_id__in=child_ids).values('user_id', 'created_by_id')
        )
        child_status_breakdown = {}
        for g in grandchildren:
            parent_uid = g['created_by_id']
            st = status_map.get(('customer', g['user_id']), 'red')
            bucket = child_status_breakdown.setdefault(parent_uid, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0})
            bucket[st] += 1

        results = []
        for c in children:
            oc = rollup_counts.get(('customer', c.user_id), 0)
            status = status_map.get(('customer', c.user_id), 'red')
            results.append({
                'id': c.id, 'user_id': c.user_id, 'customer_id': c.customer_id,
                'first_name': c.first_name, 'last_name': c.last_name,
                'mobile_number': c.mobile_number, 'city_name': c.city_name,
                'child_count': sub_child_counts.get(c.user_id, 0),
                'order_count': oc, 'status': status,
                'child_status_counts': child_status_breakdown.get(c.user_id, {'red': 0, 'orange': 0, 'yellow': 0, 'green': 0}),
            })
        return Response({'role': 'customer', 'items': results})        


# ── NEW: single node basic info fetch pannும் — root node load pannும்போது use aagும் ──
class HierarchyNodeInfoView(APIView):
    permission_classes = [IsAuthenticated]

    MODEL_MAP = {
        'admin': (AdminProfile, 'admin_id'),
        'dealer': (DealerProfile, 'dealer_id'),
        'sub_dealer': (SubDealerProfile, 'sub_dealer_id'),
        'promotor': (PromotorProfile, 'promotor_id'),
        'customer': (CustomerProfile, 'customer_id'),
    }

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        cfg = self.MODEL_MAP.get(role)
        if not cfg or not node_id:
            return Response({'error': 'invalid role/id'}, status=400)

        model, id_field = cfg
        try:
            node = model.objects.get(id=node_id)
        except model.DoesNotExist:
            return Response({'error': 'not found'}, status=404)

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        order_count = JewelryOrder.objects.filter(
            user_id=node.user_id, created_at__gte=month_start
        ).count()

        return Response({
            'id': node.id, 'user_id': node.user_id,
            id_field: getattr(node, id_field, None),
            'first_name': node.first_name, 'last_name': node.last_name,
            'mobile_number': node.mobile_number,
            'city_name': getattr(node, 'city_name', None),
            'order_count': order_count,
        })


class HierarchyPathToNodeView(APIView):
    """Given a currently-displayed root (role+id) and a buyer's User id,
    walks the created_by chain from buyer up to that root and returns the
    ordered path (root's direct child ... buyer) so the frontend can
    auto-expand the tree one level at a time down to that person."""
    permission_classes = [IsAuthenticated]

    ROLE_PROFILE_ATTR = {
        'admin': ('admin_profile', 'admin_id'),
        'dealer': ('dealer_profile', 'dealer_id'),
        'sub_dealer': ('sub_dealer_profile', 'sub_dealer_id'),
        'promotor': ('promotor_profile', 'promotor_id'),
        'customer': ('customer_profile', 'customer_id'),
    }

    def get(self, request):
        root_role = request.query_params.get('root_role')
        root_id = request.query_params.get('root_id')
        target_user_id = request.query_params.get('target_user_id')

        if not target_user_id:
            return Response({'error': 'target_user_id required'}, status=400)
        try:
            target_user_id = int(target_user_id)
        except ValueError:
            return Response({'error': 'invalid target_user_id'}, status=400)

        try:
            buyer = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'buyer not found'}, status=404)

        # ── Walk up buyer -> ... -> super_admin, using the same created_by
        # chain the commission engine uses ──
        chain_users = [buyer]
        current = buyer
        seen = set()
        while True:
            creator = _get_creator_user(current)
            if not creator or creator.id in seen:
                break
            seen.add(creator.id)
            chain_users.append(creator)
            if creator.role == 'super_admin':
                break
            current = creator
        chain_users.reverse()   # top (near super_admin) -> bottom (buyer)

        path = []
        for u in chain_users:
            if u.role == 'super_admin':
                continue
            attr, id_field = self.ROLE_PROFILE_ATTR.get(u.role, (None, None))
            if not attr:
                continue
            try:
                p = getattr(u, attr)
            except Exception:
                continue
            path.append({
                'type': u.role,
                'id': p.id,
                'user_id': u.id,
                id_field: getattr(p, id_field, None),
                'first_name': p.first_name,
                'last_name': p.last_name,
                'mobile_number': getattr(p, 'mobile_number', None),
                'city_name': getattr(p, 'city_name', None),
            })

        # ── Trim everything above the currently-open root node ──
        if root_role and root_id:
            try:
                root_id_int = int(root_id)
            except ValueError:
                root_id_int = None
            trimmed = []
            found_root = False
            for node in path:
                if found_root:
                    trimmed.append(node)
                elif node['type'] == root_role and node['id'] == root_id_int:
                    found_root = True
            path = trimmed if found_root else path

        return Response({'path': path})

# ── NEW: role-scoped hierarchy for Admin / Dealer / Sub Dealer / Promotor logins.
# Ovvoruthar their own subtree mattum kaanpanum — SuperAdmin mari full tree venaam. ──
class MyHierarchyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role not in ['admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Use /hierarchy/full/ for your role'}, status=403)

        try:
            if role == 'admin':
                node = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_admin(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(node))
                root = _build_admin(node, orders_by_user, monthly_counts)
            elif role == 'dealer':
                node = DealerProfile.objects.prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(node) + [node.user_id])
                root = _build_dealer(node, orders_by_user, monthly_counts)
            elif role == 'sub_dealer':
                node = SubDealerProfile.objects.prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_sub_dealer(node)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(node) + [node.user_id])
                root = _build_sub_dealer(node, orders_by_user, monthly_counts)
            elif role == 'promotor':
                node = PromotorProfile.objects.prefetch_related('assigned_customers').get(user=user)
                orders_by_user = _bulk_orders_for_promotor(node)
                monthly_counts = _monthly_order_counts_map(
                    [c.user_id for c in node.assigned_customers.all()] + [node.user_id]
                )
                root = _build_promotor(node, orders_by_user, monthly_counts)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        return Response({
            'super_admin_email': User.objects.filter(role='super_admin').first().email if User.objects.filter(role='super_admin').exists() else '',
            'viewer_role': role,
            'root': root,
        })

def get_report_ancestors(role, profile):
    """Build the chain from Super Admin down to (but not including) the logged-in user's own node."""
    ancestors = [{'type': 'super_admin'}]

    if role == 'admin':
        return ancestors

    if role == 'dealer':
        a = profile.assigned_admin
        if a:
            ancestors.append({
                'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                'first_name': a.first_name, 'last_name': a.last_name,
                'mobile_number': a.mobile_number, 'city_name': a.city_name,
            })
        return ancestors

    if role == 'sub_dealer':
        d = profile.assigned_dealer
        if d:
            a = d.assigned_admin
            if a:
                ancestors.append({
                    'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                    'first_name': a.first_name, 'last_name': a.last_name,
                    'mobile_number': a.mobile_number, 'city_name': a.city_name,
                })
            ancestors.append({
                'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id,
                'first_name': d.first_name, 'last_name': d.last_name,
                'mobile_number': d.mobile_number, 'city_name': d.city_name,
            })
        return ancestors

    if role == 'promotor':
        sd = profile.assigned_sub_dealer
        if sd:
            d = sd.assigned_dealer
            if d:
                a = d.assigned_admin
                if a:
                    ancestors.append({
                        'type': 'admin', 'id': a.id, 'admin_id': a.admin_id,
                        'first_name': a.first_name, 'last_name': a.last_name,
                        'mobile_number': a.mobile_number, 'city_name': a.city_name,
                    })
                ancestors.append({
                    'type': 'dealer', 'id': d.id, 'dealer_id': d.dealer_id,
                    'first_name': d.first_name, 'last_name': d.last_name,
                    'mobile_number': d.mobile_number, 'city_name': d.city_name,
                })
            ancestors.append({
                'type': 'sub_dealer', 'id': sd.id, 'sub_dealer_id': sd.sub_dealer_id,
                'first_name': sd.first_name, 'last_name': sd.last_name,
                'mobile_number': sd.mobile_number, 'city_name': sd.city_name,
            })
        return ancestors

    return ancestors


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role == 'customer':
            return Response({'error': 'Report not available for customer'}, status=403)

        if role == 'super_admin':
            admins = list(AdminProfile.objects.all().prefetch_related(
                'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
            ))

            admin_ids = list(AdminProfile.objects.values_list('user_id', flat=True))
            dealer_ids = list(DealerProfile.objects.filter(assigned_admin__isnull=False).values_list('user_id', flat=True))
            sub_dealer_ids = list(SubDealerProfile.objects.filter(assigned_dealer__isnull=False).values_list('user_id', flat=True))
            promotor_ids = list(PromotorProfile.objects.filter(assigned_sub_dealer__isnull=False).values_list('user_id', flat=True))
            customer_ids = list(CustomerProfile.objects.filter(assigned_promotor__isnull=False).values_list('user_id', flat=True))

            # ── NEW: customer-refers-customer chain — every nested customer
            # under a direct customer, any depth, so their orders/sales show up too ──
            children_by_creator = _get_children_by_creator()
            nested_customer_ids = []
            for cid in customer_ids:
                nested_customer_ids.extend(_collect_nested_customer_ids(cid, children_by_creator))

            all_ids = admin_ids + dealer_ids + sub_dealer_ids + promotor_ids + customer_ids + nested_customer_ids

            orders_by_user = _orders_by_user_map(all_ids)
            monthly_counts = _monthly_order_counts_map(all_ids)
            return Response({
                'role': role,
                'data': [_build_admin(a, orders_by_user, monthly_counts, children_by_creator) for a in admins],
                'ancestors': [],
            })

        elif role == 'admin':
            try:
                admin = AdminProfile.objects.prefetch_related(
                    'assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_admin(admin)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_admin(admin))
                return Response({
                    'role': role,
                    'data': [_build_admin(admin, orders_by_user, monthly_counts)],
                    'ancestors': get_report_ancestors(role, admin),
                })
            except AdminProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'dealer':
            try:
                dealer = DealerProfile.objects.select_related('assigned_admin').prefetch_related(
                    'assigned_sub_dealers__assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_dealer(dealer)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_dealer(dealer) + [dealer.user_id])
                return Response({
                    'role': role,
                    'data': [_build_dealer(dealer, orders_by_user, monthly_counts)],
                    'ancestors': get_report_ancestors(role, dealer),
                })
            except DealerProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'sub_dealer':
            try:
                sd = SubDealerProfile.objects.select_related('assigned_dealer__assigned_admin').prefetch_related(
                    'assigned_promotors__assigned_customers'
                ).get(user=user)
                orders_by_user = _bulk_orders_for_sub_dealer(sd)
                monthly_counts = _monthly_order_counts_map(_collect_user_ids_sub_dealer(sd) + [sd.user_id])
                return Response({
                    'role': role,
                    'data': [_build_sub_dealer(sd, orders_by_user, monthly_counts)],
                    'ancestors': get_report_ancestors(role, sd),
                })
            except SubDealerProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})

        elif role == 'promotor':
            try:
                p = PromotorProfile.objects.select_related(
                    'assigned_sub_dealer__assigned_dealer__assigned_admin'
                ).prefetch_related('assigned_customers').get(user=user)
                orders_by_user = _bulk_orders_for_promotor(p)
                monthly_counts = _monthly_order_counts_map([c.user_id for c in p.assigned_customers.all()] + [p.user_id])
                return Response({
                    'role': role,
                    'data': [_build_promotor(p, orders_by_user, monthly_counts)],
                    'ancestors': get_report_ancestors(role, p),
                })
            except PromotorProfile.DoesNotExist:
                return Response({'role': role, 'data': [], 'ancestors': []})


class HierarchyPersonSearchView(APIView):



    """Search a person by public ID, name, or phone number across every
    hierarchy role (admin/dealer/sub_dealer/promotor/customer). Used by the
    SuperAdmin navbar search bar to jump straight to a person's hierarchy
    grid view or sales report."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'error': 'q (search query) is required'}, status=400)

        role_models = [
            ('admin', AdminProfile, 'admin_id'),
            ('dealer', DealerProfile, 'dealer_id'),
            ('sub_dealer', SubDealerProfile, 'sub_dealer_id'),
            ('promotor', PromotorProfile, 'promotor_id'),
            ('customer', CustomerProfile, 'customer_id'),
        ]

        results = []
        for role_key, model, id_field in role_models:
            matches = model.objects.filter(
                Q(**{f'{id_field}__icontains': query}) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(mobile_number__icontains=query)
            ).select_related('user')[:10]

            for m in matches:
                results.append({
                    'role': role_key,
                    'id': m.id,
                    'user_id': m.user_id,
                    'public_id': getattr(m, id_field, None),
                    'first_name': m.first_name,
                    'last_name': m.last_name,
                    'mobile_number': m.mobile_number,
                    'city_name': getattr(m, 'city_name', None),
                })

        return Response({'query': query, 'results': results})


def _resolve_scope_user_ids(user, role, node_id):
    """role+node_id (DB pk) kொடுத்தா andha subtree oda user_ids list return pண்ணும்.
    role illama na, logged-in user oda own network return pண்ணும்."""
    if role == 'admin':
        node = AdminProfile.objects.prefetch_related('assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers').get(id=node_id)
        return _collect_user_ids_admin(node) + [node.user_id]
    elif role == 'dealer':
        node = DealerProfile.objects.prefetch_related('assigned_sub_dealers__assigned_promotors__assigned_customers').get(id=node_id)
        return _collect_user_ids_dealer(node) + [node.user_id]
    elif role == 'sub_dealer':
        node = SubDealerProfile.objects.prefetch_related('assigned_promotors__assigned_customers').get(id=node_id)
        return _collect_user_ids_sub_dealer(node) + [node.user_id]
    elif role == 'promotor':
        node = PromotorProfile.objects.prefetch_related('assigned_customers').get(id=node_id)
        return [c.user_id for c in node.assigned_customers.all()] + [node.user_id]
    elif role == 'customer':
        node = CustomerProfile.objects.get(id=node_id)
        children_by_creator = _get_children_by_creator()
        return _collect_nested_customer_ids(node.user_id, children_by_creator) + [node.user_id]
    else:
        u_role = user.role
        if u_role == 'super_admin':
            return list(User.objects.values_list('id', flat=True))
        elif u_role == 'admin':
            admin = AdminProfile.objects.prefetch_related('assigned_dealers__assigned_sub_dealers__assigned_promotors__assigned_customers').get(user=user)
            return _collect_user_ids_admin(admin) + [admin.user_id]
        elif u_role == 'dealer':
            dealer = DealerProfile.objects.prefetch_related('assigned_sub_dealers__assigned_promotors__assigned_customers').get(user=user)
            return _collect_user_ids_dealer(dealer) + [dealer.user_id]
        elif u_role == 'sub_dealer':
            sd = SubDealerProfile.objects.prefetch_related('assigned_promotors__assigned_customers').get(user=user)
            return _collect_user_ids_sub_dealer(sd) + [sd.user_id]
        elif u_role == 'promotor':
            p = PromotorProfile.objects.prefetch_related('assigned_customers').get(user=user)
            return [c.user_id for c in p.assigned_customers.all()] + [p.user_id]
        return [user.id]


class SalesSummaryView(APIView):
    """Total Sales / Total Orders / Customers with Orders — DB aggregate mattum,
    full tree walk illama fast ah."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        period = request.query_params.get('period', 'week')   # NEW
        try:
            user_ids = _resolve_scope_user_ids(request.user, role, node_id)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        qs = JewelryOrder.objects.filter(user_id__in=user_ids)

        # NEW: period filter — trend graph range oda match aaguradhu ku
        now = timezone.now()
        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=start)
        elif period == 'week':
            start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=start)
        elif period == 'month':
            start = (now - timedelta(days=27)).replace(hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=start)
        elif period == 'year':
            start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=start)
        # period == 'all' na filter illama full lifetime varum

        agg = qs.aggregate(total_sales=Sum('total_price'), total_orders=Count('id'))
        customers_with_orders = qs.values('user_id').distinct().count()

        return Response({
            'total_sales': float(agg['total_sales'] or 0),
            'total_orders': agg['total_orders'] or 0,
            'customers_with_orders': customers_with_orders,
        })


class SalesTrendView(APIView):
    """Sales trend graph — period query param (today/week/month/year) vachi
    call pண்ணும், ovvoru button click-கும் thani API call pண்ணும்."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        node_id = request.query_params.get('id')
        period = request.query_params.get('period', 'week')
        try:
            user_ids = _resolve_scope_user_ids(request.user, role, node_id)
        except Exception as e:
            return Response({'error': str(e)}, status=404)

        now = timezone.now()
        qs = JewelryOrder.objects.filter(user_id__in=user_ids)

        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            step = timedelta(hours=4)
            num_buckets = 6
        elif period == 'week':
            start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
            step = timedelta(days=1)
            num_buckets = 7
        elif period == 'month':
            start = (now - timedelta(days=27)).replace(hour=0, minute=0, second=0, microsecond=0)
            step = timedelta(weeks=1)
            num_buckets = 4
        else:  # year
            start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
            step = None
            num_buckets = 12

        data = []
        if period == 'year':
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            cursor = start.replace(day=1)
            for i in range(12):
                if cursor.month == 12:
                    next_cursor = cursor.replace(year=cursor.year + 1, month=1)
                else:
                    next_cursor = cursor.replace(month=cursor.month + 1)
                agg = qs.filter(created_at__gte=cursor, created_at__lt=next_cursor).aggregate(total=Sum('total_price'), count=Count('id'))
                data.append({'label': months[cursor.month - 1], 'total': float(agg['total'] or 0), 'count': agg['count'] or 0})
                cursor = next_cursor
        elif period == 'month':
            cursor = start
            for i in range(4):
                next_cursor = cursor + timedelta(weeks=1)
                agg = qs.filter(created_at__gte=cursor, created_at__lt=next_cursor).aggregate(total=Sum('total_price'), count=Count('id'))
                data.append({'label': f'Week {i+1}', 'total': float(agg['total'] or 0), 'count': agg['count'] or 0})
                cursor = next_cursor
        else:  # today / week
            cursor = start
            for i in range(num_buckets):
                next_cursor = cursor + step
                agg = qs.filter(created_at__gte=cursor, created_at__lt=next_cursor).aggregate(total=Sum('total_price'), count=Count('id'))
                label = f'{cursor.hour}:00' if period == 'today' else cursor.strftime('%a')
                data.append({'label': label, 'total': float(agg['total'] or 0), 'count': agg['count'] or 0})
                cursor = next_cursor

        return Response({'period': period, 'data': data})


class OrderTimeSeriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'today')
        now = timezone.localtime(timezone.now())
        qs = JewelryOrder.objects.all()
        if request.user.role != 'super_admin':
            try:
                scope_user_ids = _resolve_scope_user_ids(request.user, None, None)
            except Exception as exc:
                return Response({'error': str(exc)}, status=404)
            qs = qs.filter(user_id__in=scope_user_ids)

        if period == 'today':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncHour('created_at'))
            step = timedelta(hours=1)
            bucket_start = start
        elif period == 'week':
            start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncDate('created_at'))
            step = timedelta(days=1)
            bucket_start = start
        elif period == 'month':
            start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncDate('created_at'))
            step = timedelta(days=1)
            bucket_start = start
        elif period == '3month':
            start = (now - timedelta(days=90)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncWeek('created_at'))
            step = timedelta(weeks=1)
            # TruncWeek always returns Monday. Fill from that same boundary so
            # generated keys match the database aggregation keys.
            bucket_start = start - timedelta(days=start.weekday())
        elif period == 'year':
            start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            qs = qs.filter(created_at__gte=start).annotate(bucket=TruncMonth('created_at'))
            step = 'month'
            bucket_start = start.replace(day=1)
        else:  # all
            earliest = JewelryOrder.objects.order_by('created_at').first()
            start = earliest.created_at if earliest else now
            end = now
            qs = qs.annotate(bucket=TruncMonth('created_at'))
            step = 'month'
            bucket_start = start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        rows = (
            qs.values('bucket')
              .annotate(count=Count('id'))
              .order_by('bucket')
        )

        # ── FIX: TruncHour returns datetime, but TruncDate/TruncWeek/TruncMonth
        # return date objects (no time part). Normalize both sides so the
        # lookup actually matches — otherwise week/month/year/all always show 0. ──
        is_hourly = (period == 'today')

        def normalize_key(value):
            if value is None:
                return None
            if is_hourly:
                return value
            return value.date() if hasattr(value, 'date') else value

        counts_map = {}
        for row in rows:
            key = normalize_key(row['bucket'])
            if key is not None:
                counts_map[key] = row['count']

        # ── Fill every bucket in the range, even with 0 orders ──
        data = []
        cursor = bucket_start
        safety_limit = 500  # avoid infinite loop
        i = 0
        while cursor <= end and i < safety_limit:
            lookup_key = cursor if is_hourly else cursor.date()
            data.append({
                'time': cursor.isoformat(),
                'count': counts_map.get(lookup_key, 0),
            })
            if step == 'month':
                cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
            else:
                cursor += step
            i += 1

        return Response({'period': period, 'data': data})



def _today_order_counts():
    """user_id -> today order count map (JewelryOrder based)"""
    today = timezone.localtime(timezone.now()).date()
    counts = dict(
        JewelryOrder.objects.filter(created_at__date=today)
        .values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )
    return counts



def _get_period_rollup_counts(period='today'):
    """Returns dict: key = (role, profile_id or user_id) -> order count rolled up from the entire subtree.
    Hierarchy:
      Admin (Super Stockist)
        └── Dealer (Distributor)
              └── Sub Dealer (Wholesale Dealer)
                    └── Promotor (Retailer)
                          └── Customer (and nested child customers)
    role keys:
      'customer': user_id
      'promotor': profile.id
      'sub_dealer': profile.id
      'dealer': profile.id
      'admin': profile.id
    """
    now = timezone.localtime(timezone.now())
    today = now.date()
    qs = JewelryOrder.objects.all()

    if period == 'today':
        qs = qs.filter(created_at__date=today)
    elif period == '3days':
        qs = qs.filter(created_at__date__gte=today - timedelta(days=3))
    elif period == 'week':
        qs = qs.filter(created_at__date__gte=today - timedelta(days=7))
    elif period == 'month':
        qs = qs.filter(created_at__date__gte=today - timedelta(days=30))
    elif period == '6months':
        qs = qs.filter(created_at__date__gte=today - timedelta(days=180))
    elif period == 'year':
        qs = qs.filter(created_at__date__gte=today - timedelta(days=365))

    order_counts_by_user = dict(
        qs.values('user_id').annotate(c=Count('id')).values_list('user_id', 'c')
    )

    customers = list(CustomerProfile.objects.all().values('id', 'user_id', 'created_by_id', 'assigned_promotor_id'))
    promotors = list(PromotorProfile.objects.all().values('id', 'user_id', 'assigned_sub_dealer_id'))
    sub_dealers = list(SubDealerProfile.objects.all().values('id', 'user_id', 'assigned_dealer_id'))
    dealers = list(DealerProfile.objects.all().values('id', 'user_id', 'assigned_admin_id'))
    admins = list(AdminProfile.objects.all().values('id', 'user_id'))

    subcustomers_by_creator = {}
    for c in customers:
        if c['created_by_id']:
            subcustomers_by_creator.setdefault(c['created_by_id'], []).append(c)

    customers_by_promotor = {}
    for c in customers:
        if c['assigned_promotor_id']:
            customers_by_promotor.setdefault(c['assigned_promotor_id'], []).append(c)

    promotors_by_sd = {}
    for p in promotors:
        if p['assigned_sub_dealer_id']:
            promotors_by_sd.setdefault(p['assigned_sub_dealer_id'], []).append(p)

    sds_by_dealer = {}
    for sd in sub_dealers:
        if sd['assigned_dealer_id']:
            sds_by_dealer.setdefault(sd['assigned_dealer_id'], []).append(sd)

    dealers_by_admin = {}
    for d in dealers:
        if d['assigned_admin_id']:
            dealers_by_admin.setdefault(d['assigned_admin_id'], []).append(d)

    # 1. Customers (including recursive child customers)
    customer_user_ids_map = {}

    def get_customer_user_ids(c, visited=None):
        if visited is None:
            visited = set()
        cid = c['id']
        if cid in customer_user_ids_map:
            return customer_user_ids_map[cid]
        if cid in visited:
            return set()
        visited.add(cid)

        uids = {c['user_id']}
        for child in subcustomers_by_creator.get(c['user_id'], []):
            uids.update(get_customer_user_ids(child, visited))
        customer_user_ids_map[cid] = uids
        return uids

    for c in customers:
        get_customer_user_ids(c)

    counts = {}

    # Set customer rollup counts (key: user_id)
    for c in customers:
        uids = customer_user_ids_map.get(c['id'], {c['user_id']})
        counts[('customer', c['user_id'])] = sum(order_counts_by_user.get(uid, 0) for uid in uids)

    # 2. Promotors (Retailers)
    promotor_user_ids_map = {}
    for p in promotors:
        p_uids = {p['user_id']}
        for c in customers_by_promotor.get(p['id'], []):
            p_uids.update(customer_user_ids_map.get(c['id'], {c['user_id']}))
        promotor_user_ids_map[p['id']] = p_uids
        counts[('promotor', p['id'])] = sum(order_counts_by_user.get(uid, 0) for uid in p_uids)

    # 3. Sub Dealers (Wholesale Dealers)
    sd_user_ids_map = {}
    for sd in sub_dealers:
        sd_uids = {sd['user_id']}
        for p in promotors_by_sd.get(sd['id'], []):
            sd_uids.update(promotor_user_ids_map.get(p['id'], {p['user_id']}))
        sd_user_ids_map[sd['id']] = sd_uids
        counts[('sub_dealer', sd['id'])] = sum(order_counts_by_user.get(uid, 0) for uid in sd_uids)

    # 4. Dealers (Distributors)
    dealer_user_ids_map = {}
    for d in dealers:
        d_uids = {d['user_id']}
        for sd in sds_by_dealer.get(d['id'], []):
            d_uids.update(sd_user_ids_map.get(sd['id'], {sd['user_id']}))
        dealer_user_ids_map[d['id']] = d_uids
        counts[('dealer', d['id'])] = sum(order_counts_by_user.get(uid, 0) for uid in d_uids)

    # 5. Admins (Super Stockists)
    for a in admins:
        a_uids = {a['user_id']}
        for d in dealers_by_admin.get(a['id'], []):
            a_uids.update(dealer_user_ids_map.get(d['id'], {d['user_id']}))
        counts[('admin', a['id'])] = sum(order_counts_by_user.get(uid, 0) for uid in a_uids)

    return counts


def _today_rollup_counts():
    return _get_period_rollup_counts('today')


def _month_rollup_counts():
    """dict: (role, profile_id) -> this month's order count, rolled up from
    the entire subtree kீழе. role keys: 'customer'(user_id), 'promotor','sub_dealer',
    'dealer','admin' (profile id). DB aggregate queries mattum — Python loop illa.
    ── NEW: cache pண்ணுறோம் — indha function FULL DB scan pண்ணுthு, ovvoru
    hierarchy click-kும் recompute aana 6 sec edukkum. 2 min TTL cache-la vachi,
    ella children-fetch click-ும் fast aagும் ──"""
    cache_key = f'month_rollup_counts_{timezone.now().strftime("%Y%m")}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    base = JewelryOrder.objects.filter(created_at__gte=month_start)
    counts = {}

    def add(key, c):
        counts[key] = counts.get(key, 0) + c

    for r in base.filter(user__customer_profile__isnull=False).values('user_id').annotate(c=Count('id')):
        add(('customer', r['user_id']), r['c'])

    for r in base.filter(user__customer_profile__assigned_promotor__isnull=False).values('user__customer_profile__assigned_promotor_id').annotate(c=Count('id')):
        add(('promotor', r['user__customer_profile__assigned_promotor_id']), r['c'])
    for r in base.filter(user__promotor_profile__isnull=False).values('user__promotor_profile__id').annotate(c=Count('id')):
        add(('promotor', r['user__promotor_profile__id']), r['c'])

    for r in base.filter(user__customer_profile__assigned_promotor__assigned_sub_dealer__isnull=False).values('user__customer_profile__assigned_promotor__assigned_sub_dealer_id').annotate(c=Count('id')):
        add(('sub_dealer', r['user__customer_profile__assigned_promotor__assigned_sub_dealer_id']), r['c'])
    for r in base.filter(user__promotor_profile__assigned_sub_dealer__isnull=False).values('user__promotor_profile__assigned_sub_dealer_id').annotate(c=Count('id')):
        add(('sub_dealer', r['user__promotor_profile__assigned_sub_dealer_id']), r['c'])
    for r in base.filter(user__sub_dealer_profile__isnull=False).values('user__sub_dealer_profile__id').annotate(c=Count('id')):
        add(('sub_dealer', r['user__sub_dealer_profile__id']), r['c'])

    for r in base.filter(user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer__isnull=False).values('user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer_id').annotate(c=Count('id')):
        add(('dealer', r['user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer_id']), r['c'])
    for r in base.filter(user__promotor_profile__assigned_sub_dealer__assigned_dealer__isnull=False).values('user__promotor_profile__assigned_sub_dealer__assigned_dealer_id').annotate(c=Count('id')):
        add(('dealer', r['user__promotor_profile__assigned_sub_dealer__assigned_dealer_id']), r['c'])
    for r in base.filter(user__sub_dealer_profile__assigned_dealer__isnull=False).values('user__sub_dealer_profile__assigned_dealer_id').annotate(c=Count('id')):
        add(('dealer', r['user__sub_dealer_profile__assigned_dealer_id']), r['c'])
    for r in base.filter(user__dealer_profile__isnull=False).values('user__dealer_profile__id').annotate(c=Count('id')):
        add(('dealer', r['user__dealer_profile__id']), r['c'])

    for r in base.filter(user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin__isnull=False).values('user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin_id').annotate(c=Count('id')):
        add(('admin', r['user__customer_profile__assigned_promotor__assigned_sub_dealer__assigned_dealer__assigned_admin_id']), r['c'])
    for r in base.filter(user__promotor_profile__assigned_sub_dealer__assigned_dealer__assigned_admin__isnull=False).values('user__promotor_profile__assigned_sub_dealer__assigned_dealer__assigned_admin_id').annotate(c=Count('id')):
        add(('admin', r['user__promotor_profile__assigned_sub_dealer__assigned_dealer__assigned_admin_id']), r['c'])
    for r in base.filter(user__sub_dealer_profile__assigned_dealer__assigned_admin__isnull=False).values('user__sub_dealer_profile__assigned_dealer__assigned_admin_id').annotate(c=Count('id')):
        add(('admin', r['user__sub_dealer_profile__assigned_dealer__assigned_admin_id']), r['c'])
    for r in base.filter(user__dealer_profile__assigned_admin__isnull=False).values('user__dealer_profile__assigned_admin_id').annotate(c=Count('id')):
        add(('admin', r['user__dealer_profile__assigned_admin_id']), r['c'])
    for r in base.filter(user__admin_profile__isnull=False).values('user__admin_profile__id').annotate(c=Count('id')):
        add(('admin', r['user__admin_profile__id']), r['c'])

    cache.set(cache_key, counts, 120)   # ── NEW: 2 min TTL ──
    return counts

class TodayLoginStatusView(APIView):
    permission_classes = [IsAuthenticated]

   
    PERIOD_DAYS = {
        '3days': 3,
        'week': 7,
        'month': 30,
        '6months': 180,
        'year': 365,
    }

    ROLE_META = {
        # role_key: (id_field, label, level)
        'admin':      ('admin_id', 'Admin', 2),
        'dealer':     ('dealer_id', 'Dealer', 3),
        'sub_dealer': ('sub_dealer_id', 'Sub Dealer', 4),
        'promotor':   ('promotor_id', 'Promotor', 5),
        'customer':   ('customer_id', 'Customer', 6),
    }
    LABEL_TO_ROLE_KEY = {'Admin': 'admin', 'Dealer': 'dealer', 'Sub Dealer': 'sub_dealer', 'Promotor': 'promotor', 'Customer': 'customer'}

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin', 'dealer', 'sub_dealer', 'promotor']:
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'today')
        scope_role = request.query_params.get('scope_role')
        scope_id = request.query_params.get('scope_id')
        scope_user_ids = None
        if scope_role and scope_id:
            try:
                scope_user_ids = set(_resolve_scope_user_ids(request.user, scope_role, scope_id))
            except Exception:
                scope_user_ids = set()
        elif request.user.role != 'super_admin':
            try:
                scope_user_ids = set(_resolve_scope_user_ids(request.user, None, None))
            except Exception:
                scope_user_ids = set()

        today = timezone.now().date()
        rollup_counts = _get_period_rollup_counts(period)

        # ── NEW: role -> level Case/When, DB level la order pண்ணறatuku ──
        # pyrefly: ignore [missing-import]
        from django.db.models import Case, When, Value, IntegerField
        level_case = Case(
            When(role='admin', then=Value(2)), When(role='dealer', then=Value(3)),
            When(role='sub_dealer', then=Value(4)), When(role='promotor', then=Value(5)),
            When(role='customer', then=Value(6)), default=Value(99), output_field=IntegerField(),
        )

        base_qs = User.objects.exclude(role='super_admin').annotate(level=level_case).select_related(
            'admin_profile', 'dealer_profile', 'sub_dealer_profile', 'promotor_profile', 'customer_profile'
        ).order_by('level', 'id')

        # ── NEW: role filter DB level-ல ──
        role_filter = request.query_params.get('role')
        if role_filter and role_filter != 'all':
            role_key = self.LABEL_TO_ROLE_KEY.get(role_filter)
            if role_key:
                base_qs = base_qs.filter(role=role_key)

        # ── NEW: scope filter DB level-ல ──
        if scope_user_ids is not None:
            base_qs = base_qs.filter(id__in=scope_user_ids)

        # ── NEW: active/inactive/never DB level-ல split ──
        if period == 'today':
            active_q = Q(last_login__date=today)
        else:
            days_needed = self.PERIOD_DAYS.get(period, 0)
            active_q = Q(last_login__date__gte=today - timedelta(days=days_needed))

        active_qs = base_qs.filter(active_q)
        # ── Inactive = logged in before, but NOT in this period ──
        inactive_qs = base_qs.exclude(active_q).filter(last_login__isnull=False)
        # ── Never logged in = never logged in at all ──
        never_qs = base_qs.filter(last_login__isnull=True)

        list_type = request.query_params.get('list_type', 'inactive')
        offset = int(request.query_params.get('offset', 0))
        limit = int(request.query_params.get('limit', 50))

        active_total = active_qs.count()
        inactive_total = inactive_qs.count()
        never_total = never_qs.count()
        grand_total = base_qs.count()

        if list_type == 'all':
            target_qs = base_qs
            total_count = grand_total
        elif list_type == 'active':
            target_qs = active_qs
            total_count = active_total
        elif list_type == 'never':
            target_qs = never_qs
            total_count = never_total
        else:  # 'inactive'
            target_qs = inactive_qs
            total_count = inactive_total

        # ── NEW: DB level la LIMIT/OFFSET — idhu than real pagination ──
        page_users = target_qs[offset:offset + limit]

        def build_entry(u):
            role_key = u.role
            meta = self.ROLE_META.get(role_key)
            if not meta:
                return None
            id_field, role_label, level = meta
            profile = getattr(u, f'{role_key}_profile', None)
            if not profile:
                return None

            last_login_date = u.last_login.date() if u.last_login else None
            reference_date = last_login_date or (u.created_at.date() if u.created_at else today)
            days_inactive = (today - reference_date).days
            is_active = bool(last_login_date and last_login_date >= (today - timedelta(days=self.PERIOD_DAYS.get(period, 0)))) if period != 'today' else bool(last_login_date and last_login_date == today)

            lookup_key = u.id if role_key == 'customer' else profile.id
            return {
                'level': level, 'level_role': role_label,
                'id': getattr(profile, id_field, None), 'db_id': profile.id,
                'name': f"{profile.first_name} {profile.last_name or ''}".strip(),
                'email': u.email, 'phone': profile.mobile_number, 'location': profile.city_name,
                'active': is_active,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'created_at': u.created_at.isoformat() if u.created_at else None,
                'days_inactive': days_inactive,
                'order_count': rollup_counts.get((role_key, lookup_key), 0),
            }

        entries = [e for e in (build_entry(u) for u in page_users) if e]

        return Response({
            'period': period,
            'list_type': list_type,
            'total_count': total_count,
            'other_count': (inactive_total + never_total) if list_type == 'active' else active_total,
            # ── Stable counters that don't shift when list_type changes — stat cards use these ──
            'active_count': active_total,
            'inactive_count': inactive_total,
            'never_login_count': never_total,
            'grand_total_count': grand_total,
            'results': entries,
            'active': entries if list_type in ('active', 'all') else [],
            'inactive': entries if list_type in ('inactive', 'never', 'all') else [],
        })

class DashboardQuickStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        cache_key = 'sa_dashboard_quick_stats'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        # ── NEW: range queries instead of __date= — these USE the index, __date= does not ──
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        today_end = today_start + timedelta(days=1)
        yesterday_start = today_start - timedelta(days=1)

        active_users = User.objects.exclude(role='super_admin').filter(
            last_login__gte=today_start, last_login__lt=today_end
        ).count()

        total_non_super = User.objects.exclude(role='super_admin').count()

        data = {
            'yesterday_orders': JewelryOrder.objects.filter(created_at__gte=yesterday_start, created_at__lt=today_start).count(),
            'today_orders': JewelryOrder.objects.filter(created_at__gte=today_start, created_at__lt=today_end).count(),
            'today_new_customers': CustomerProfile.objects.filter(created_at__gte=today_start, created_at__lt=today_end).count(),
            'active_users': active_users,
            'admins': AdminProfile.objects.count(),
            'dealers': DealerProfile.objects.count(),
            'sub_dealers': SubDealerProfile.objects.count(),
            'promotors': PromotorProfile.objects.count(),
            'customers': CustomerProfile.objects.count(),
            # ── NEW: subtract instead of a second full-table exclude-count — half the DB work ──
            'today_inactive_count': total_non_super - active_users,
        }
        cache.set(cache_key, data, 180)   # ── NEW: 60s → 180s, fewer cache-miss slow hits ──
        return Response(data)

class CoinRequestView(APIView):
    """
    POST — Promotor/SubDealer/Dealer/Admin creates a coin request to their assigned parent.
           (Super Admin uses SuperAdminAddCoinsView instead — no request needed.)
    GET   — Returns requests: 'received' (pending, sent to me) or 'sent' (my own requests).
            Defaults: sub_dealer/dealer/admin/super_admin see received-pending,
                      everyone else (promotor) sees their own sent history.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.user.role
        target_user = None

        if role == 'promotor':
            try:
                profile = request.user.promotor_profile
            except PromotorProfile.DoesNotExist:
                return Response({'error': 'Promotor profile not found'}, status=404)
            if not profile.assigned_sub_dealer:
                return Response({'error': 'No sub dealer assigned to you'}, status=400)
            target_user = profile.assigned_sub_dealer.user

        elif role == 'sub_dealer':
            try:
                profile = request.user.sub_dealer_profile
            except SubDealerProfile.DoesNotExist:
                return Response({'error': 'Sub dealer profile not found'}, status=404)
            if not profile.assigned_dealer:
                return Response({'error': 'No dealer assigned to you'}, status=400)
            target_user = profile.assigned_dealer.user

        elif role == 'dealer':
            try:
                profile = request.user.dealer_profile
            except DealerProfile.DoesNotExist:
                return Response({'error': 'Dealer profile not found'}, status=404)
            if not profile.assigned_admin:
                return Response({'error': 'No admin assigned to you'}, status=400)
            target_user = profile.assigned_admin.user

        elif role == 'admin':
            target_user = User.objects.filter(role='super_admin').first()
            if not target_user:
                return Response({'error': 'Super admin account not found'}, status=404)

        else:
            return Response({'error': 'Your role cannot request coins'}, status=403)

        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'At least one coin item required'}, status=400)

        coin_request = CoinRequest.objects.create(
            requested_by=request.user,
            requested_to=target_user,
        )
        for item in items:
            CoinRequestItem.objects.create(
                request=coin_request,
                metal_type=item.get('metal_type'),
                weight_label=item.get('weight_label'),
                weight_grams=item.get('weight_grams'),
                qty=item.get('qty'),
            )

        serializer = CoinRequestSerializer(coin_request)
        return Response({'message': 'Request sent successfully!', 'data': serializer.data}, status=201)

    def get(self, request):
        role = request.user.role
        box = request.query_params.get('box')  # optional override: 'sent', 'received', or 'history'
        receiver_roles = ['sub_dealer', 'dealer', 'admin', 'super_admin']

        # ── NEW: history box — DB level pagination + status filter + aggregate counts ──
        if box == 'history':
            if request.user.role == 'super_admin':
                base_qs = CoinRequest.objects.all()
            else:
                base_qs = CoinRequest.objects.filter(
                    Q(requested_to=request.user) | Q(requested_by=request.user) | Q(approved_by=request.user)
                )

            # Search filter (by person ID, phone, email, name across both requester & approver)
            search = request.query_params.get('search', '').strip()
            if search:
                base_qs = base_qs.filter(
                    Q(requested_by__email__icontains=search) |
                    Q(requested_by__promotor_profile__promotor_id__icontains=search) |
                    Q(requested_by__promotor_profile__first_name__icontains=search) |
                    Q(requested_by__promotor_profile__last_name__icontains=search) |
                    Q(requested_by__promotor_profile__mobile_number__icontains=search) |
                    Q(requested_by__sub_dealer_profile__sub_dealer_id__icontains=search) |
                    Q(requested_by__sub_dealer_profile__first_name__icontains=search) |
                    Q(requested_by__sub_dealer_profile__mobile_number__icontains=search) |
                    Q(requested_by__dealer_profile__dealer_id__icontains=search) |
                    Q(requested_by__dealer_profile__first_name__icontains=search) |
                    Q(requested_by__dealer_profile__mobile_number__icontains=search) |
                    Q(requested_by__admin_profile__admin_id__icontains=search) |
                    Q(requested_by__admin_profile__first_name__icontains=search) |
                    Q(requested_by__admin_profile__mobile_number__icontains=search) |
                    Q(requested_to__email__icontains=search) |
                    Q(requested_to__promotor_profile__promotor_id__icontains=search) |
                    Q(requested_to__sub_dealer_profile__sub_dealer_id__icontains=search) |
                    Q(requested_to__dealer_profile__dealer_id__icontains=search) |
                    Q(requested_to__admin_profile__admin_id__icontains=search)
                ).distinct()

            # Date / Period filtering (day, week, month, year, custom date)
            period = request.query_params.get('period', '').strip().lower()
            start_date = request.query_params.get('start_date', '').strip()
            end_date = request.query_params.get('end_date', '').strip()

            from datetime import datetime
            today = timezone.localdate()

            if period == 'day':
                base_qs = base_qs.filter(created_at__date=today)
            elif period == 'week':
                start_of_week = today - timedelta(days=today.weekday())
                base_qs = base_qs.filter(created_at__date__gte=start_of_week, created_at__date__lte=today)
            elif period == 'month':
                base_qs = base_qs.filter(created_at__year=today.year, created_at__month=today.month)
            elif period == 'year':
                base_qs = base_qs.filter(created_at__year=today.year)
            elif period == 'custom' or (start_date and end_date):
                if start_date:
                    try:
                        sd = datetime.strptime(start_date, '%Y-%m-%d').date()
                        base_qs = base_qs.filter(created_at__date__gte=sd)
                    except Exception:
                        pass
                if end_date:
                    try:
                        ed = datetime.strptime(end_date, '%Y-%m-%d').date()
                        base_qs = base_qs.filter(created_at__date__lte=ed)
                    except Exception:
                        pass

            # ── status-wise counts — ONE DB aggregate query ──
            status_counts = dict(
                base_qs.values('status').annotate(c=Count('id')).values_list('status', 'c')
            )

            total_disbursed_pieces = CoinRequestItem.objects.filter(request__in=base_qs.filter(status='sent')).aggregate(s=Sum('qty'))['s'] or 0
            total_pending_pieces = CoinRequestItem.objects.filter(request__in=base_qs.filter(status='pending')).aggregate(s=Sum('qty'))['s'] or 0

            # ── My Transactions vs Leader Transactions — DB-level split over the FULL base_qs
            # (mirrors isMyTransaction in Transaction_History.jsx, not just the loaded/paginated page) ──
            if request.user.role == 'super_admin':
                my_q = (
                    Q(reject_reason='MASTER_MINT') |
                    Q(requested_by__role='super_admin') |
                    Q(requested_to__role='super_admin') |
                    Q(approved_by__role='super_admin') |
                    Q(requested_by=request.user) |
                    Q(requested_to=request.user) |
                    Q(approved_by=request.user)
                )
            else:
                my_q = (
                    Q(requested_by=request.user) |
                    Q(requested_to=request.user) |
                    Q(approved_by=request.user)
                )
            total_all_count = base_qs.count()
            my_count = base_qs.filter(my_q).distinct().count()
            leader_count = total_all_count - my_count

            status_filter = request.query_params.get('status')
            if status_filter and status_filter != 'all':
                base_qs = base_qs.filter(status=status_filter)

            total_count = base_qs.count()
            offset = int(request.query_params.get('offset', 0))
            limit = int(request.query_params.get('limit', 20))

            reqs = base_qs.prefetch_related('items', 'requested_by', 'requested_to').order_by('-created_at')[offset:offset + limit]
            serializer = CoinRequestSerializer(reqs, many=True)
            return Response({
                'items': serializer.data,
                'total_count': total_count,
                'my_count': my_count,
                'leader_count': leader_count,
                'status_counts': {
                    'pending': status_counts.get('pending', 0),
                    'sent': status_counts.get('sent', 0),
                    'rejected': status_counts.get('rejected', 0),
                    'total': sum(status_counts.values()),
                    'disbursed_pieces': total_disbursed_pieces,
                    'pending_pieces': total_pending_pieces,
                },
            })

        if box == 'all':
            if role == 'super_admin':
                reqs = CoinRequest.objects.all()
            else:
                reqs = CoinRequest.objects.filter(
                    Q(requested_to=request.user) | Q(requested_by=request.user) | Q(approved_by=request.user)
                )
        elif box == 'sent':
            reqs = CoinRequest.objects.filter(requested_by=request.user)
        elif box == 'received':
            if role == 'super_admin':
                reqs = CoinRequest.objects.filter(status='pending')
            else:
                reqs = CoinRequest.objects.filter(requested_to=request.user, status='pending')
        elif role == 'super_admin':
            reqs = CoinRequest.objects.filter(status='pending')
        elif role in receiver_roles:
            reqs = CoinRequest.objects.filter(requested_to=request.user, status='pending')
        else:
            reqs = CoinRequest.objects.filter(requested_by=request.user)

        reqs = reqs.prefetch_related('items').order_by('-created_at')
        serializer = CoinRequestSerializer(reqs, many=True)
        return Response(serializer.data)


class CoinRequestApproveView(APIView):
    """Any role approves a pending request sent to them — deducts coins from
    the approver's own stock and adds them into the requester's stock.
    Super Admin can oversee and approve any pending request across hierarchy (requires Super Admin password)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role == 'super_admin':
            password = request.data.get('password', '').strip()
            if not password or not request.user.check_password(password):
                return Response({'error': 'Invalid Super Admin password. Action unauthorized.'}, status=401)

        try:
            if request.user.role == 'super_admin':
                coin_request = CoinRequest.objects.prefetch_related('items').get(
                    id=pk, status='pending'
                )
            else:
                coin_request = CoinRequest.objects.prefetch_related('items').get(
                    id=pk, requested_to=request.user, status='pending'
                )
        except CoinRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        # If Super Admin approves, try to deduct from assigned parent's stock; fallback to super admin stock
        approver = coin_request.requested_to if coin_request.requested_to else request.user
        if request.user.role == 'super_admin':
            has_parent_stock = True
            for item in coin_request.items.all():
                stk = CoinStock.objects.filter(user=approver, metal_type=item.metal_type, weight_label=item.weight_label).first()
                if not stk or stk.qty < item.qty:
                    has_parent_stock = False
                    break
            stock_user = approver if has_parent_stock else request.user
        else:
            stock_user = request.user

        for item in coin_request.items.all():
            approver_stock = CoinStock.objects.filter(
                user=stock_user, metal_type=item.metal_type, weight_label=item.weight_label
            ).first()
            available = approver_stock.qty if approver_stock else 0
            if available < item.qty:
                user_label = "Assigned parent" if stock_user == approver else "Approver"
                return Response({
                    'error': f'Insufficient stock for {item.metal_type} {item.weight_label}. '
                             f'{user_label} stock available: {available}, Requested: {item.qty}'
                }, status=400)

        for item in coin_request.items.all():
            approver_stock = CoinStock.objects.get(
                user=stock_user, metal_type=item.metal_type, weight_label=item.weight_label
            )
            approver_stock.qty -= item.qty
            approver_stock.save()

            requester_stock, created = CoinStock.objects.get_or_create(
                user=coin_request.requested_by,
                metal_type=item.metal_type,
                weight_label=item.weight_label,
                defaults={'weight_grams': item.weight_grams, 'qty': 0}
            )
            requester_stock.qty += item.qty
            requester_stock.save()

        coin_request.status = 'sent'
        coin_request.sent_at = timezone.now()
        coin_request.approved_by = request.user
        coin_request.save()

        return Response({'message': 'Request approved successfully!'})


class CoinRequestRejectView(APIView):
    """Any role rejects a pending request sent to them, with a reason message.
    Super Admin can reject any pending request across hierarchy (requires Super Admin password)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role == 'super_admin':
            password = request.data.get('password', '').strip()
            if not password or not request.user.check_password(password):
                return Response({'error': 'Invalid Super Admin password. Action unauthorized.'}, status=401)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Reject reason is required'}, status=400)

        try:
            if request.user.role == 'super_admin':
                coin_request = CoinRequest.objects.get(
                    id=pk, status='pending'
                )
            else:
                coin_request = CoinRequest.objects.get(
                    id=pk, requested_to=request.user, status='pending'
                )
        except CoinRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        coin_request.status = 'rejected'
        coin_request.reject_reason = message
        coin_request.sent_at = timezone.now()
        coin_request.save()

        return Response({'message': 'Request rejected successfully!'})


class CoinRequestApproveAllView(APIView):
    """Any role approves ALL pending requests sent to them in one click.
    Deducts from approver's stock and adds to each requester's stock.
    Super Admin requires password confirmation."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role == 'super_admin':
            password = request.data.get('password', '').strip()
            if not password or not request.user.check_password(password):
                return Response({'error': 'Invalid Super Admin password. Action unauthorized.'}, status=401)
            pending = CoinRequest.objects.filter(status='pending').prefetch_related('items')
        else:
            pending = CoinRequest.objects.filter(requested_to=request.user, status='pending').prefetch_related('items')

        needed = {}
        for coin_request in pending:
            for item in coin_request.items.all():
                key = (item.metal_type, item.weight_label)
                needed[key] = needed.get(key, 0) + item.qty
        for (metal_type, weight_label), qty_needed in needed.items():
            approver_stock = CoinStock.objects.filter(
                user=request.user, metal_type=metal_type, weight_label=weight_label
            ).first()
            available = approver_stock.qty if approver_stock else 0
            if available < qty_needed:
                return Response({
                    'error': f'Insufficient stock for {metal_type} {weight_label}. '
                             f'Available: {available}, Needed: {qty_needed}'
                }, status=400)

        count = 0
        for coin_request in pending:
            for item in coin_request.items.all():
                approver_stock = CoinStock.objects.get(
                    user=request.user, metal_type=item.metal_type, weight_label=item.weight_label
                )
                approver_stock.qty -= item.qty
                approver_stock.save()

                requester_stock, created = CoinStock.objects.get_or_create(
                    user=coin_request.requested_by,
                    metal_type=item.metal_type,
                    weight_label=item.weight_label,
                    defaults={'weight_grams': item.weight_grams, 'qty': 0}
                )
                requester_stock.qty += item.qty
                requester_stock.save()

            coin_request.status = 'sent'
            coin_request.sent_at = timezone.now()
            coin_request.approved_by = request.user
            coin_request.save()
            count += 1

        return Response({'message': f'{count} requests approved successfully!'})

class SuperAdminAddCoinsView(APIView):
    """Super Admin adds coins directly into their own stock — no approval flow needed."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Only super admin can add coins directly'}, status=403)

        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'At least one coin item required'}, status=400)

        for item in items:
            stock, created = CoinStock.objects.get_or_create(
                user=request.user,
                metal_type=item.get('metal_type'),
                weight_label=item.get('weight_label'),
                defaults={'weight_grams': item.get('weight_grams'), 'qty': 0}
            )
            stock.qty += int(item.get('qty', 0))
            stock.save()

        # Log MASTER_MINT in CoinRequest for official audit trail (matching Jewelry)
        coin_req = CoinRequest.objects.create(
            requested_by=request.user,
            requested_to=request.user,
            status='sent',
            reject_reason='MASTER_MINT',
            approved_by=request.user,
            sent_at=timezone.now(),
        )
        for item in items:
            CoinRequestItem.objects.create(
                request=coin_req,
                metal_type=item.get('metal_type'),
                weight_label=item.get('weight_label'),
                weight_grams=item.get('weight_grams'),
                qty=item.get('qty', 0),
            )

        return Response({'message': 'Coins added to your stock successfully!'})


class CoinStockView(APIView):
    """Logged-in user sees their own coin stock.
    Super Admin can pass ?scope=hierarchy to see coin holdings across all admins, dealers, sub-dealers, promotors."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scope = request.query_params.get('scope')
        if scope == 'hierarchy' and request.user.role == 'super_admin':
            stocks = CoinStock.objects.filter(qty__gt=0).select_related('user').order_by('user__role', 'metal_type')
            user_map = {}
            for s in stocks:
                u = s.user
                if u.id not in user_map:
                    role_field = {
                        'promotor': 'promotor_profile',
                        'sub_dealer': 'sub_dealer_profile',
                        'dealer': 'dealer_profile',
                        'admin': 'admin_profile',
                        'shop': 'shop_profile',
                    }.get(u.role)
                    try:
                        prof = getattr(u, role_field, None) if role_field else None
                    except Exception:
                        prof = None

                    id_field = {
                        'promotor': 'promotor_id',
                        'sub_dealer': 'sub_dealer_id',
                        'dealer': 'dealer_id',
                        'admin': 'admin_id',
                    }.get(u.role)
                    id_str = getattr(prof, id_field, '') if (prof and id_field) else ''
                    if prof:
                        if u.role == 'shop':
                            name = getattr(prof, 'shop_name', '') or getattr(prof, 'owner_name', '') or u.email
                        else:
                            fn = getattr(prof, 'first_name', '')
                            ln = getattr(prof, 'last_name', '') or ''
                            name = f"{fn} {ln}".strip() or u.email
                        phone = getattr(prof, 'mobile_number', '')
                    else:
                        name = 'Super Admin' if u.role == 'super_admin' else (getattr(u, 'email', '').split('@')[0] if u.email else 'User')
                        phone = ''

                    user_map[u.id] = {
                        'user_id': u.id,
                        'id_str': id_str,
                        'name': name,
                        'email': u.email,
                        'role': u.role,
                        'phone': phone,
                        'items': [],
                        'total_pieces': 0,
                        'total_grams': 0.0,
                    }
                user_map[u.id]['items'].append({
                    'id': s.id,
                    'metal_type': s.metal_type,
                    'weight_label': s.weight_label,
                    'weight_grams': float(s.weight_grams or 0),
                    'qty': s.qty,
                })
                user_map[u.id]['total_pieces'] += s.qty
                if s.weight_grams:
                    user_map[u.id]['total_grams'] += round(float(s.weight_grams) * s.qty, 4)

            result = list(user_map.values())
            role_order = {'super_admin': 0, 'admin': 1, 'dealer': 2, 'sub_dealer': 3, 'promotor': 4}
            result.sort(key=lambda x: (role_order.get(x['role'], 99), x['name']))
            return Response(result)

        if request.user.role == 'super_admin':
            INITIAL_COINS = [
                ('gold_22k', '50 mg', 0.05, 500),
                ('gold_22k', '100 mg', 0.1, 500),
                ('gold_22k', '150 mg', 0.15, 300),
                ('gold_22k', '200 mg', 0.2, 300),
                ('gold_22k', '500 mg', 0.5, 200),
                ('gold_22k', '1 gm', 1.0, 200),
                ('gold_22k', '2 gm', 2.0, 100),
                ('gold_22k', '4 gm', 4.0, 100),
                ('gold_22k', '8 gm', 8.0, 50),
                ('gold_24k', '50 mg', 0.05, 500),
                ('gold_24k', '100 mg', 0.1, 500),
                ('gold_24k', '200 mg', 0.2, 300),
                ('gold_24k', '500 mg', 0.5, 200),
                ('gold_24k', '1 gm', 1.0, 200),
                ('gold_24k', '2 gm', 2.0, 100),
                ('gold_24k', '4 gm', 4.0, 100),
                ('gold_24k', '8 gm', 8.0, 50),
                ('silver_999', '500 mg', 0.5, 500),
                ('silver_999', '1 gm', 1.0, 500),
                ('silver_999', '2 gm', 2.0, 300),
                ('silver_999', '5 gm', 5.0, 200),
                ('silver_999', '10 gm', 10.0, 200),
                ('silver_999', '20 gm', 20.0, 100),
                ('silver_999', '50 gm', 50.0, 50),
                ('silver_999', '100 gm', 100.0, 50),
            ]
            for m_type, w_label, w_grams, qty in INITIAL_COINS:
                stk, created = CoinStock.objects.get_or_create(
                    user=request.user,
                    metal_type=m_type,
                    weight_label=w_label,
                    defaults={'weight_grams': w_grams, 'qty': qty}
                )
                # <= 0, not == 0 — once distributions to the team exceed the initial
                # seed, this balance goes negative and a strict "== 0" check never
                # re-triggers the top-up, so "My Vault Stock" gets stuck showing 0.
                if not created and stk.qty <= 0:
                    stk.qty = qty
                    stk.save(update_fields=['qty'])

        stock = CoinStock.objects.filter(user=request.user, qty__gt=0).order_by('metal_type', 'weight_grams')
        serializer = CoinStockSerializer(stock, many=True)
        return Response(serializer.data)


class CoinStockForUserView(APIView):
    """View any user's (admin/dealer/sub_dealer/promotor) coin stock by user_id —
    used by the Sales Report page's coin distribution pie chart."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'customer':
            return Response({'error': 'Permission denied'}, status=403)

        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        stock = CoinStock.objects.filter(user=target_user, qty__gt=0).order_by('metal_type', 'weight_grams')
        serializer = CoinStockSerializer(stock, many=True)
        return Response(serializer.data)


# ── JEWELRY STOCK & HIERARCHY ALLOCATION VIEWS ──
class JewelryStockView(APIView):
    """Logged-in user sees their own jewelry stock.
    Super Admin can pass ?scope=hierarchy to see jewelry holdings across all admins, dealers, sub-dealers, promotors."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        scope = request.query_params.get('scope')
        if scope == 'hierarchy' and request.user.role == 'super_admin':
            stocks = JewelryStock.objects.filter(qty__gt=0).select_related('user', 'product').prefetch_related('product__images').order_by('user__role', 'product__name')
            user_map = {}
            for s in stocks:
                u = s.user
                if u.id not in user_map:
                    role_field = {
                        'promotor': 'promotor_profile',
                        'sub_dealer': 'sub_dealer_profile',
                        'dealer': 'dealer_profile',
                        'admin': 'admin_profile',
                        'shop': 'shop_profile',
                    }.get(u.role)
                    try:
                        prof = getattr(u, role_field, None) if role_field else None
                    except Exception:
                        prof = None

                    id_field = {
                        'promotor': 'promotor_id',
                        'sub_dealer': 'sub_dealer_id',
                        'dealer': 'dealer_id',
                        'admin': 'admin_id',
                    }.get(u.role)
                    id_str = getattr(prof, id_field, '') if (prof and id_field) else ''
                    if prof:
                        if u.role == 'shop':
                            name = getattr(prof, 'shop_name', '') or getattr(prof, 'owner_name', '') or u.email
                        else:
                            fn = getattr(prof, 'first_name', '')
                            ln = getattr(prof, 'last_name', '') or ''
                            name = f"{fn} {ln}".strip() or u.email
                        phone = getattr(prof, 'mobile_number', '')
                    else:
                        name = 'Super Admin' if u.role == 'super_admin' else (getattr(u, 'email', '').split('@')[0] if u.email else 'User')
                        phone = ''

                    user_map[u.id] = {
                        'user_id': u.id,
                        'id_str': id_str,
                        'name': name,
                        'email': u.email,
                        'role': u.role,
                        'phone': phone,
                        'items': [],
                        'total_pieces': 0,
                        'total_gross_grams': 0.0,
                        'total_net_grams': 0.0,
                        'gold_22k_pieces': 0,
                        'gold_24k_pieces': 0,
                        'silver_pieces': 0,
                    }

                p = s.product
                gross = float(p.cross_weight or 0)
                net = float(p.net_weight or p.cross_weight or 0)
                first_img = p.images.first()
                img_url = first_img.image.url if first_img and first_img.image else ''
                if img_url and not img_url.startswith('http'):
                    img_url = request.build_absolute_uri(img_url)

                user_map[u.id]['items'].append({
                    'id': s.id,
                    'product_id': p.id,
                    'product_code': p.product_code,
                    'name': p.name,
                    'category': p.category,
                    'metal': p.metal,
                    'grade': p.grade,
                    'cross_weight': gross,
                    'net_weight': net,
                    'qty': s.qty,
                    'price': float(p.price or 0),
                    'image': img_url,
                })
                user_map[u.id]['total_pieces'] += s.qty
                user_map[u.id]['total_gross_grams'] += round(gross * s.qty, 3)
                user_map[u.id]['total_net_grams'] += round(net * s.qty, 3)

                metal_lower = (p.metal or '').lower()
                grade_lower = (p.grade or '').lower()
                if metal_lower == 'gold' and '24' in grade_lower:
                    user_map[u.id]['gold_24k_pieces'] += s.qty
                elif metal_lower == 'gold':
                    user_map[u.id]['gold_22k_pieces'] += s.qty
                elif metal_lower == 'silver':
                    user_map[u.id]['silver_pieces'] += s.qty

            result = list(user_map.values())
            role_order = {'super_admin': 0, 'admin': 1, 'dealer': 2, 'sub_dealer': 3, 'promotor': 4}
            result.sort(key=lambda x: (role_order.get(x['role'], 99), x['name']))
            return Response(result)

        if request.user.role == 'super_admin':
            for p in JewelryProduct.objects.filter(is_internal_asset=True, stock_quantity__gt=0):
                stk, created = JewelryStock.objects.get_or_create(user=request.user, product=p, defaults={'qty': p.stock_quantity})
                if not created and stk.qty == 0 and p.stock_quantity > 0:
                    stk.qty = p.stock_quantity
                    stk.save(update_fields=['qty'])

        stocks = JewelryStock.objects.filter(user=request.user, qty__gt=0).select_related('product').prefetch_related('product__images')
        serializer = JewelryStockSerializer(stocks, many=True, context={'request': request})
        return Response(serializer.data)


class MemberHoldingsDetailView(APIView):
    """
    Detailed holdings of any member (Coins + Jewellery) with live valuations
    based on Today's Metal Rates.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)

        # Profile & identifier lookup
        role_field = {
            'promotor': 'promotor_profile',
            'sub_dealer': 'sub_dealer_profile',
            'dealer': 'dealer_profile',
            'admin': 'admin_profile',
            'shop': 'shop_profile',
        }.get(target_user.role)

        prof = None
        if role_field:
            try:
                prof = getattr(target_user, role_field, None)
            except Exception:
                prof = None

        id_field = {
            'promotor': 'promotor_id',
            'sub_dealer': 'sub_dealer_id',
            'dealer': 'dealer_id',
            'admin': 'admin_id',
        }.get(target_user.role)
        id_str = getattr(prof, id_field, '') if (prof and id_field) else ''

        if prof:
            if target_user.role == 'shop':
                name = getattr(prof, 'shop_name', '') or getattr(prof, 'owner_name', '') or target_user.email
            else:
                fn = getattr(prof, 'first_name', '')
                ln = getattr(prof, 'last_name', '') or ''
                name = f"{fn} {ln}".strip() or target_user.email
            phone = getattr(prof, 'mobile_number', '') or getattr(prof, 'admin_contact_no', '')
            city = getattr(prof, 'city_name', '')
            district = getattr(prof, 'district', '')
            state = getattr(prof, 'state', '')
        else:
            name = 'Super Admin' if target_user.role == 'super_admin' else (target_user.email.split('@')[0] if target_user.email else 'User')
            phone = ''
            city = ''
            district = ''
            state = ''

        # Live Metal Rate
        latest_rate = MetalRate.objects.first()
        r_22k = float(latest_rate.gold_22k) if latest_rate and latest_rate.gold_22k else 0.0
        r_24k = float(latest_rate.gold_24k) if latest_rate and latest_rate.gold_24k else 0.0
        r_silver = float(latest_rate.silver_999) if latest_rate and latest_rate.silver_999 else 0.0

        today_rates = {
            'date': str(latest_rate.date) if latest_rate else '',
            'gold_22k': r_22k,
            'gold_24k': r_24k,
            'silver_999': r_silver,
        }

        # ── COIN HOLDINGS ──
        coin_stocks = CoinStock.objects.filter(user=target_user, qty__gt=0).order_by('metal_type', 'weight_grams')
        coin_items = []
        coin_total_pieces = 0
        coin_total_grams = 0.0
        coin_total_value = 0.0

        gold_22k_pcs = 0
        gold_22k_wt = 0.0
        gold_22k_val = 0.0

        gold_24k_pcs = 0
        gold_24k_wt = 0.0
        gold_24k_val = 0.0

        silver_pcs = 0
        silver_wt = 0.0
        silver_val = 0.0

        for c in coin_stocks:
            w_unit = float(c.weight_grams or 0)
            total_g = round(w_unit * c.qty, 4)

            # Match rate
            if c.metal_type == 'gold_24k':
                rate_per_g = r_24k
                metal_label = 'Gold 24K (999)'
            elif c.metal_type == 'silver_999':
                rate_per_g = r_silver
                metal_label = 'Silver 999'
            else:
                rate_per_g = r_22k
                metal_label = 'Gold 22K (916)'

            unit_val = round(w_unit * rate_per_g, 2)
            total_val = round(total_g * rate_per_g, 2)

            coin_items.append({
                'id': c.id,
                'metal_type': c.metal_type,
                'metal_label': metal_label,
                'weight_label': c.weight_label,
                'unit_weight_grams': w_unit,
                'qty': c.qty,
                'total_weight_grams': total_g,
                'rate_per_gram': rate_per_g,
                'unit_valuation': unit_val,
                'total_valuation': total_val,
            })

            coin_total_pieces += c.qty
            coin_total_grams += total_g
            coin_total_value += total_val

            if c.metal_type == 'gold_24k':
                gold_24k_pcs += c.qty
                gold_24k_wt += total_g
                gold_24k_val += total_val
            elif c.metal_type == 'silver_999':
                silver_pcs += c.qty
                silver_wt += total_g
                silver_val += total_val
            else:
                gold_22k_pcs += c.qty
                gold_22k_wt += total_g
                gold_22k_val += total_val

        # ── JEWELLERY HOLDINGS ──
        if target_user.role == 'super_admin':
            for p in JewelryProduct.objects.filter(is_internal_asset=True, stock_quantity__gt=0):
                stk, created = JewelryStock.objects.get_or_create(user=target_user, product=p, defaults={'qty': p.stock_quantity})
                if not created and stk.qty == 0 and p.stock_quantity > 0:
                    stk.qty = p.stock_quantity
                    stk.save(update_fields=['qty'])

        jewel_stocks = JewelryStock.objects.filter(user=target_user, qty__gt=0).select_related('product').prefetch_related('product__images').order_by('product__name')
        jewel_items = []
        jewel_total_pieces = 0
        jewel_total_gross = 0.0
        jewel_total_net = 0.0
        jewel_total_value = 0.0

        for j in jewel_stocks:
            p = j.product
            gross = float(p.cross_weight or 0)
            net = float(p.net_weight or p.cross_weight or 0)
            stone_wt = float(p.stone_weight or 0)
            making_pct = float(p.making_charge or 0)

            metal_l = (p.metal or '').lower()
            grade_l = (p.grade or '').lower()

            if metal_l == 'gold' and '24' in grade_l:
                rate_per_g = r_24k
                grade_name = '24K (999)'
            elif metal_l == 'silver':
                rate_per_g = r_silver
                grade_name = 'Silver 999'
            else:
                rate_per_g = r_22k
                grade_name = '22K (916)'

            base_metal = round(net * rate_per_g, 2)
            making_val = round(base_metal * (making_pct / 100.0), 2)
            subtotal = round(base_metal + making_val, 2)
            gst = round(subtotal * 0.03, 2)
            unit_price = round(subtotal + gst, 2)
            item_tot_val = round(unit_price * j.qty, 2)

            images = []
            for img in p.images.all():
                url = img.image.url if img.image else ''
                if url and not url.startswith('http'):
                    url = request.build_absolute_uri(url)
                if url:
                    images.append(url)

            jewel_items.append({
                'id': j.id,
                'product_id': p.id,
                'product_code': p.product_code,
                'name': p.name,
                'category': p.category,
                'metal': p.metal,
                'grade': p.grade or grade_name,
                'gross_weight': gross,
                'net_weight': net,
                'stone_weight': stone_wt,
                'making_charge_pct': making_pct,
                'qty': j.qty,
                'rate_per_gram': rate_per_g,
                'base_metal_cost': base_metal,
                'making_charge_cost': making_val,
                'subtotal_before_tax': subtotal,
                'gst_3pct': gst,
                'unit_price': unit_price,
                'total_valuation': item_tot_val,
                'images': images,
            })

            jewel_total_pieces += j.qty
            jewel_total_gross += round(gross * j.qty, 3)
            jewel_total_net += round(net * j.qty, 3)
            jewel_total_value += item_tot_val

        return Response({
            'member': {
                'user_id': target_user.id,
                'id_str': id_str,
                'name': name,
                'email': target_user.email,
                'phone': phone,
                'role': target_user.role,
                'city': city,
                'district': district,
                'state': state,
                'joined_date': target_user.created_at.strftime('%Y-%m-%d') if hasattr(target_user, 'created_at') and target_user.created_at else '',
            },
            'today_rates': today_rates,
            'coins': {
                'items': coin_items,
                'summary': {
                    'total_pieces': coin_total_pieces,
                    'total_grams': round(coin_total_grams, 3),
                    'total_valuation': round(coin_total_value, 2),
                    'gold_22k': {'pieces': gold_22k_pcs, 'grams': round(gold_22k_wt, 3), 'valuation': round(gold_22k_val, 2)},
                    'gold_24k': {'pieces': gold_24k_pcs, 'grams': round(gold_24k_wt, 3), 'valuation': round(gold_24k_val, 2)},
                    'silver': {'pieces': silver_pcs, 'grams': round(silver_wt, 3), 'valuation': round(silver_val, 2)},
                }
            },
            'jewellery': {
                'items': jewel_items,
                'summary': {
                    'total_designs': len(jewel_items),
                    'total_pieces': jewel_total_pieces,
                    'total_gross_grams': round(jewel_total_gross, 3),
                    'total_net_grams': round(jewel_total_net, 3),
                    'total_valuation': round(jewel_total_value, 2),
                }
            },
            'portfolio_summary': {
                'total_asset_valuation': round(coin_total_value + jewel_total_value, 2),
                'total_all_pieces': coin_total_pieces + jewel_total_pieces,
                'coins_valuation': round(coin_total_value, 2),
                'jewellery_valuation': round(jewel_total_value, 2),
                'total_weight_grams': round(coin_total_grams + jewel_total_net, 3),
            }
        })


class JewelryStockDetailView(APIView):
    """
    Complete detail of a single jewellery product including live rate valuation formula
    and breakdown of holders across Super Admin vault and team members.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            p = JewelryProduct.objects.prefetch_related('images').get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Jewellery product not found'}, status=404)

        # Live Metal Rate
        latest_rate = MetalRate.objects.first()
        r_22k = float(latest_rate.gold_22k) if latest_rate and latest_rate.gold_22k else 0.0
        r_24k = float(latest_rate.gold_24k) if latest_rate and latest_rate.gold_24k else 0.0
        r_silver = float(latest_rate.silver_999) if latest_rate and latest_rate.silver_999 else 0.0

        metal_l = (p.metal or '').lower()
        grade_l = (p.grade or '').lower()

        if metal_l == 'gold' and '24' in grade_l:
            rate_per_g = r_24k
            karat_name = '24K (999)'
        elif metal_l == 'silver':
            rate_per_g = r_silver
            karat_name = 'Silver 999'
        else:
            rate_per_g = r_22k
            karat_name = '22K (916)'

        gross = float(p.cross_weight or 0)
        net = float(p.net_weight or p.cross_weight or 0)
        stone_wt = float(p.stone_weight or 0)
        making_pct = float(p.making_charge or 0)
        wastage_pct = float(p.wastage_charge or 0)

        # Precise valuation breakdown
        base_metal = round(net * rate_per_g, 2)
        making_cost = round(base_metal * (making_pct / 100.0), 2)
        wastage_cost = round(base_metal * (wastage_pct / 100.0), 2) if wastage_pct > 0 else 0.0
        subtotal = round(base_metal + making_cost + wastage_cost, 2)
        gst = round(subtotal * 0.03, 2)
        live_unit_price = round(subtotal + gst, 2)

        # Stock holders
        stocks = JewelryStock.objects.filter(product=p, qty__gt=0).select_related('user')
        holders = []
        total_holding_pcs = 0
        vault_pcs = 0

        for s in stocks:
            u = s.user
            total_holding_pcs += s.qty
            if u.role == 'super_admin':
                vault_pcs += s.qty

            role_field = {
                'promotor': 'promotor_profile',
                'sub_dealer': 'sub_dealer_profile',
                'dealer': 'dealer_profile',
                'admin': 'admin_profile',
            }.get(u.role)
            prof = getattr(u, role_field, None) if role_field else None
            id_field = {
                'promotor': 'promotor_id',
                'sub_dealer': 'sub_dealer_id',
                'dealer': 'dealer_id',
                'admin': 'admin_id',
            }.get(u.role)
            id_str = getattr(prof, id_field, '') if (prof and id_field) else ''
            holder_name = f"{getattr(prof, 'first_name', '')} {getattr(prof, 'last_name', '')}".strip() if prof else ('Super Admin' if u.role == 'super_admin' else u.email)
            holder_phone = getattr(prof, 'mobile_number', '') if prof else ''

            holders.append({
                'user_id': u.id,
                'name': holder_name or u.email,
                'role': u.role,
                'id_str': id_str,
                'phone': holder_phone,
                'qty': s.qty,
                'holding_valuation': round(live_unit_price * s.qty, 2),
            })

        if vault_pcs == 0 and p.is_internal_asset and p.stock_quantity:
            vault_pcs = p.stock_quantity
            if not any(h['role'] == 'super_admin' for h in holders):
                holders.insert(0, {
                    'user_id': None,
                    'name': 'Super Admin Vault',
                    'role': 'super_admin',
                    'id_str': 'VAULT-001',
                    'phone': '',
                    'qty': p.stock_quantity,
                    'holding_valuation': round(live_unit_price * p.stock_quantity, 2),
                })
                total_holding_pcs += p.stock_quantity

        images = []
        for img in p.images.all():
            url = img.image.url if img.image else ''
            if url and not url.startswith('http'):
                url = request.build_absolute_uri(url)
            if url:
                images.append(url)

        return Response({
            'product': {
                'id': p.id,
                'product_code': p.product_code,
                'name': p.name,
                'description': p.description,
                'category': p.category,
                'metal': p.metal,
                'grade': p.grade or karat_name,
                'karat_label': karat_name,
                'gross_weight': gross,
                'net_weight': net,
                'stone_weight': stone_wt,
                'making_charge_pct': making_pct,
                'wastage_charge_pct': wastage_pct,
                'stock_quantity': p.stock_quantity,
                'is_active': p.is_active,
                'is_internal_asset': p.is_internal_asset,
                'images': images,
            },
            'today_rate': {
                'date': str(latest_rate.date) if latest_rate else '',
                'rate_per_gram': rate_per_g,
                'gold_22k': r_22k,
                'gold_24k': r_24k,
                'silver_999': r_silver,
            },
            'valuation_breakdown': {
                'rate_applied': rate_per_g,
                'net_weight_grams': net,
                'base_metal_cost': base_metal,
                'making_charge_pct': making_pct,
                'making_charge_cost': making_cost,
                'wastage_charge_pct': wastage_pct,
                'wastage_charge_cost': wastage_cost,
                'pre_tax_subtotal': subtotal,
                'gst_3pct': gst,
                'live_unit_price': live_unit_price,
                'vault_stock_qty': vault_pcs,
                'total_vault_valuation': round(live_unit_price * vault_pcs, 2),
                'total_company_stock_qty': total_holding_pcs,
                'total_company_valuation': round(live_unit_price * total_holding_pcs, 2),
            },
            'stock_holders': holders,
        })


class JewelryRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.user.role
        target_user = None

        if role == 'promotor':
            try:
                profile = request.user.promotor_profile
                if profile.assigned_sub_dealer and profile.assigned_sub_dealer.user:
                    target_user = profile.assigned_sub_dealer.user
            except Exception:
                pass
            if not target_user:
                target_user = User.objects.filter(role='super_admin').first()

        elif role == 'sub_dealer':
            try:
                profile = request.user.sub_dealer_profile
                if profile.assigned_dealer and profile.assigned_dealer.user:
                    target_user = profile.assigned_dealer.user
            except Exception:
                pass
            if not target_user:
                target_user = User.objects.filter(role='super_admin').first()

        elif role == 'dealer':
            try:
                profile = request.user.dealer_profile
                if profile.assigned_admin and profile.assigned_admin.user:
                    target_user = profile.assigned_admin.user
            except Exception:
                pass
            if not target_user:
                target_user = User.objects.filter(role='super_admin').first()

        elif role == 'admin':
            target_user = User.objects.filter(role='super_admin').first()

        elif role == 'super_admin':
            return Response({'error': 'Super Admin is the root master authority and cannot send buy requests.'}, status=400)
        else:
            return Response({'error': 'Your role cannot request jewelry'}, status=403)

        if not target_user:
            target_user = User.objects.filter(role='super_admin').first()

        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'At least one jewelry item required'}, status=400)

        req = JewelryRequest.objects.create(
            requested_by=request.user,
            requested_to=target_user,
        )
        for item in items:
            product_id = item.get('product_id')
            qty = int(item.get('qty', 1))
            try:
                prod = JewelryProduct.objects.get(id=product_id)
                JewelryRequestItem.objects.create(request=req, product=prod, qty=qty)
            except JewelryProduct.DoesNotExist:
                pass

        serializer = JewelryRequestSerializer(req)
        return Response({'message': 'Jewelry request sent successfully!', 'data': serializer.data}, status=201)

    def get(self, request):
        role = request.user.role
        box = request.query_params.get('box')

        if box == 'history':
            if role == 'super_admin':
                base_qs = JewelryRequest.objects.all()
            else:
                base_qs = JewelryRequest.objects.filter(
                    Q(requested_to=request.user) | Q(requested_by=request.user) | Q(approved_by=request.user)
                )

            search = request.query_params.get('search', '').strip()
            if search:
                base_qs = base_qs.filter(
                    Q(requested_by__email__icontains=search) |
                    Q(requested_by__promotor_profile__promotor_id__icontains=search) |
                    Q(requested_by__promotor_profile__first_name__icontains=search) |
                    Q(requested_by__promotor_profile__mobile_number__icontains=search) |
                    Q(requested_by__sub_dealer_profile__sub_dealer_id__icontains=search) |
                    Q(requested_by__sub_dealer_profile__first_name__icontains=search) |
                    Q(requested_by__dealer_profile__dealer_id__icontains=search) |
                    Q(requested_by__dealer_profile__first_name__icontains=search) |
                    Q(requested_by__admin_profile__admin_id__icontains=search) |
                    Q(items__product__name__icontains=search) |
                    Q(items__product__product_code__icontains=search)
                ).distinct()

            # Date / Period filtering (default: 'day' / today)
            period = request.query_params.get('period', '').strip().lower()
            start_date = request.query_params.get('start_date', '').strip()
            end_date = request.query_params.get('end_date', '').strip()

            from datetime import datetime
            today = timezone.localdate()

            if period == 'day':
                base_qs = base_qs.filter(created_at__date=today)
            elif period == 'week':
                start_of_week = today - timedelta(days=today.weekday())
                base_qs = base_qs.filter(created_at__date__gte=start_of_week, created_at__date__lte=today)
            elif period == 'month':
                base_qs = base_qs.filter(created_at__year=today.year, created_at__month=today.month)
            elif period == 'year':
                base_qs = base_qs.filter(created_at__year=today.year)
            elif period == 'custom' or (start_date and end_date):
                if start_date:
                    try:
                        sd = datetime.strptime(start_date, '%Y-%m-%d').date()
                        base_qs = base_qs.filter(created_at__date__gte=sd)
                    except Exception:
                        pass
                if end_date:
                    try:
                        ed = datetime.strptime(end_date, '%Y-%m-%d').date()
                        base_qs = base_qs.filter(created_at__date__lte=ed)
                    except Exception:
                        pass

            status_counts = dict(
                base_qs.values('status').annotate(c=Count('id')).values_list('status', 'c')
            )

            # ── My Transactions vs Leader Transactions — DB-level split over the FULL base_qs
            # (mirrors isMyTransaction in Jewellery_Transactions.jsx, not just the loaded/paginated page) ──
            if role == 'super_admin':
                my_q = (
                    Q(reject_reason='MASTER_MINT') |
                    Q(requested_by__role='super_admin') |
                    Q(requested_to__role='super_admin') |
                    Q(approved_by__role='super_admin') |
                    Q(requested_by=request.user) |
                    Q(requested_to=request.user) |
                    Q(approved_by=request.user)
                )
            else:
                my_q = (
                    Q(requested_by=request.user) |
                    Q(requested_to=request.user) |
                    Q(approved_by=request.user)
                )
            total_all_count = base_qs.count()
            my_count = base_qs.filter(my_q).distinct().count()
            leader_count = total_all_count - my_count

            total_mint_pieces = JewelryRequestItem.objects.filter(
                request__in=base_qs.filter(reject_reason='MASTER_MINT')
            ).aggregate(s=Sum('qty'))['s'] or 0

            total_disbursed_pieces = JewelryRequestItem.objects.filter(
                request__in=base_qs.filter(status='sent').exclude(reject_reason='MASTER_MINT')
            ).aggregate(s=Sum('qty'))['s'] or 0

            total_pending_pieces = JewelryRequestItem.objects.filter(
                request__in=base_qs.filter(status='pending')
            ).aggregate(s=Sum('qty'))['s'] or 0

            flow_param = request.query_params.get('flow')
            if flow_param == 'mint':
                base_qs = base_qs.filter(reject_reason='MASTER_MINT')
            elif flow_param == 'disbursed':
                base_qs = base_qs.filter(status='sent').exclude(reject_reason='MASTER_MINT')
            elif flow_param == 'inward':
                base_qs = base_qs.filter(requested_by=request.user)
            elif flow_param == 'outward':
                base_qs = base_qs.filter(requested_to=request.user).exclude(reject_reason='MASTER_MINT')

            status_filter = request.query_params.get('status')
            if status_filter and status_filter != 'all':
                base_qs = base_qs.filter(status=status_filter)

            total_count = base_qs.count()
            offset = int(request.query_params.get('offset', 0))
            limit = int(request.query_params.get('limit', 20))

            reqs = base_qs.prefetch_related(
                'items__product__images', 'requested_by', 'requested_to'
            ).order_by('-created_at')[offset:offset + limit]

            serializer = JewelryRequestSerializer(reqs, many=True)
            return Response({
                'items': serializer.data,
                'total_count': total_count,
                'my_count': my_count,
                'leader_count': leader_count,
                'status_counts': {
                    'pending': status_counts.get('pending', 0),
                    'sent': status_counts.get('sent', 0),
                    'rejected': status_counts.get('rejected', 0),
                    'total': sum(status_counts.values()),
                    'disbursed_pieces': total_disbursed_pieces,
                    'pending_pieces': total_pending_pieces,
                    'mint_pieces': total_mint_pieces,
                },
            })

        status_param = request.query_params.get('status')
        if box == 'all':
            if role == 'super_admin':
                reqs = JewelryRequest.objects.all()
            else:
                reqs = JewelryRequest.objects.filter(Q(requested_to=request.user) | Q(requested_by=request.user) | Q(approved_by=request.user))
            if status_param and status_param != 'all':
                reqs = reqs.filter(status=status_param)
        elif box == 'sent':
            reqs = JewelryRequest.objects.filter(requested_by=request.user)
            if status_param and status_param != 'all':
                reqs = reqs.filter(status=status_param)
        elif box == 'received' or role == 'super_admin':
            if role == 'super_admin':
                reqs = JewelryRequest.objects.all()
            else:
                reqs = JewelryRequest.objects.filter(requested_to=request.user)
            if status_param and status_param != 'all':
                reqs = reqs.filter(status=status_param)
            elif not status_param:
                reqs = reqs.filter(status='pending')
        else:
            reqs = JewelryRequest.objects.filter(requested_to=request.user)
            if status_param and status_param != 'all':
                reqs = reqs.filter(status=status_param)
            elif not status_param:
                reqs = reqs.filter(status='pending')

        reqs = reqs.prefetch_related('items__product__images', 'requested_by', 'requested_to').order_by('-created_at')
        serializer = JewelryRequestSerializer(reqs, many=True)
        return Response(serializer.data)


class JewelryRequestApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role == 'super_admin':
            password = request.data.get('password', '').strip()
            if not password or not request.user.check_password(password):
                return Response({'error': 'Invalid Super Admin password. Action unauthorized.'}, status=401)

        try:
            if request.user.role == 'super_admin':
                req = JewelryRequest.objects.prefetch_related('items__product').get(id=pk, status='pending')
            else:
                req = JewelryRequest.objects.prefetch_related('items__product').get(id=pk, requested_to=request.user, status='pending')
        except JewelryRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        approver = req.requested_to if req.requested_to else request.user
        if request.user.role == 'super_admin':
            has_parent_stock = True
            for item in req.items.all():
                stk = JewelryStock.objects.filter(user=approver, product=item.product).first()
                if not stk or stk.qty < item.qty:
                    has_parent_stock = False
                    break
            stock_user = approver if has_parent_stock else request.user
        else:
            stock_user = request.user

        for item in req.items.all():
            stk = JewelryStock.objects.filter(user=stock_user, product=item.product).first()
            if getattr(stock_user, 'role', None) == 'super_admin':
                prod_qty = item.product.stock_quantity or 0
                if (not stk or stk.qty < item.qty) and prod_qty >= item.qty:
                    if not stk:
                        stk = JewelryStock.objects.create(user=stock_user, product=item.product, qty=prod_qty)
                    else:
                        stk.qty = max(stk.qty, prod_qty)
                        stk.save(update_fields=['qty'])

            available = stk.qty if stk else 0
            if available < item.qty:
                return Response({
                    'error': f'Insufficient stock for {item.product.name}. Available: {available}, Requested: {item.qty}'
                }, status=400)

        for item in req.items.all():
            stk = JewelryStock.objects.get(user=stock_user, product=item.product)
            stk.qty -= item.qty
            stk.save()

            if getattr(stock_user, 'role', None) == 'super_admin':
                item.product.stock_quantity = max(0, (item.product.stock_quantity or 0) - item.qty)
                item.product.save(update_fields=['stock_quantity'])

            req_stk, _ = JewelryStock.objects.get_or_create(
                user=req.requested_by, product=item.product, defaults={'qty': 0}
            )
            req_stk.qty += item.qty
            req_stk.save()

        req.status = 'sent'
        req.sent_at = timezone.now()
        req.approved_by = request.user
        req.save()
        return Response({'message': 'Jewelry request approved and stock transferred successfully!'})


class JewelryRequestRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role == 'super_admin':
            password = request.data.get('password', '').strip()
            if not password or not request.user.check_password(password):
                return Response({'error': 'Invalid Super Admin password. Action unauthorized.'}, status=401)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Reject reason is required'}, status=400)

        try:
            if request.user.role == 'super_admin':
                req = JewelryRequest.objects.get(id=pk, status='pending')
            else:
                req = JewelryRequest.objects.get(id=pk, requested_to=request.user, status='pending')
        except JewelryRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved'}, status=404)

        req.status = 'rejected'
        req.reject_reason = message
        req.sent_at = timezone.now()
        req.save()
        return Response({'message': 'Jewelry request rejected successfully!'})


# ── NEW: Today's Rewards View ──
class TodayRewardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        # ── NEW: super_admin ku reward kaanpikkathu — level 2 (admin) mudhal mattum ──
        qs_today = CoinRewardLog.objects.filter(date=today).exclude(user__role='super_admin').select_related('user')
        total_coins_today = qs_today.aggregate(t=Sum('coins'))['t'] or 0

        summary = []
        for rtype, label in CoinRewardLog.REWARD_TYPES:
            rows = qs_today.filter(reward_type=rtype)
            summary.append({
                'reward_type': rtype,
                'label': label,
                'users': rows.values('user').distinct().count(),
                'coins': rows.aggregate(c=Sum('coins'))['c'] or 0,
            })

        range_param = request.query_params.get('range', 'all')
        list_qs = qs_today
        if range_param == '1-10':
            list_qs = list_qs.filter(coins__gte=1, coins__lte=10)
        elif range_param == '11-50':
            list_qs = list_qs.filter(coins__gte=11, coins__lte=50)
        elif range_param == '51-100':
            list_qs = list_qs.filter(coins__gte=51, coins__lte=100)
        elif range_param == '100+':
            list_qs = list_qs.filter(coins__gt=100)

        list_qs = list_qs.order_by('-created_at')
        rewards = []
        for r in list_qs:
            info = get_user_display_info(r.user)
            rewards.append({
                'id': r.id,
                'level': info['level'],
                'position': info['position'],
                'user_id': info['user_id_str'],
                'name': info['name'],
                'phone': info['phone'],
                'reward_type': r.reward_type,
                'reward_label': dict(CoinRewardLog.REWARD_TYPES).get(r.reward_type),
                'coins': r.coins,
                'date': r.date.isoformat(),
            })

        return Response({
            'date': today.isoformat(),
            'total_coins_today': total_coins_today,
            'summary': summary,
            'rewards': rewards,
        })


class LoginRewardTransactionView(APIView):
    """Super Admin ku — Login Reward coins (daily/streak, CoinRewardLog) +
    manually 'Send Coins' pண்ணின credits (CoinRecharge source=admin_credit),
    rendumey combine pண்ணி, role + period filter oda oru unified transaction
    history kaаттும். Login Reward Management > LoginRewardTransaction.jsx ku."""
    permission_classes = [IsAuthenticated]

    ROLE_LABELS = {
        'admin': 'Super Stockist', 'dealer': 'Distributor', 'sub_dealer': 'Wholesale Dealer',
        'promotor': 'Retailer', 'customer': 'Customer',
    }

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        role = request.query_params.get('role', 'all')
        period = request.query_params.get('period', 'today')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 20
        export_csv = request.query_params.get('export') == 'csv'

        today = timezone.now().date()
        if period == 'today':
            range_start, range_end = today, today
        elif period == 'week':
            range_start, range_end = today - timedelta(days=today.weekday()), today
        elif period == 'month':
            range_start, range_end = today.replace(day=1), today
        elif period == '6month':
            range_start, range_end = today - timedelta(days=180), today
        elif period == 'year':
            range_start, range_end = today.replace(month=1, day=1), today
        elif period == 'custom' and start_date and end_date:
            range_start, range_end = start_date, end_date
        else:
            range_start, range_end = today, today

        reward_qs = CoinRewardLog.objects.filter(
            date__gte=range_start, date__lte=range_end
        ).exclude(user__role='super_admin').select_related('user')
        credit_qs = CoinRecharge.objects.filter(
            source='admin_credit', status='success',
            created_at__date__gte=range_start, created_at__date__lte=range_end,
        ).select_related('user')

        if role != 'all':
            if role not in self.ROLE_LABELS:
                return Response({'error': 'invalid role'}, status=400)
            reward_qs = reward_qs.filter(user__role=role)
            credit_qs = credit_qs.filter(user__role=role)

        reward_total = reward_qs.aggregate(c=Sum('coins'))['c'] or 0
        credit_total = credit_qs.aggregate(c=Sum('coins_credited'))['c'] or 0
        total_transactions = reward_qs.count() + credit_qs.count()
        recipient_ids = set(reward_qs.values_list('user_id', flat=True)) | set(credit_qs.values_list('user_id', flat=True))

        combined = [
            {'kind': 'reward', 'sort_key': r.created_at, 'user': r.user,
             'coins': r.coins, 'label': dict(CoinRewardLog.REWARD_TYPES).get(r.reward_type), 'date': r.date}
            for r in reward_qs.order_by('-created_at')
        ] + [
            {'kind': 'manual_credit', 'sort_key': c.created_at, 'user': c.user,
             'coins': c.coins_credited, 'label': 'Manual Credit', 'date': c.created_at.date()}
            for c in credit_qs.order_by('-created_at')
        ]
        combined.sort(key=lambda x: x['sort_key'], reverse=True)

        if export_csv:
            export_rows = combined[:REPORT_MAX_ROWS]
            display_map = _bulk_user_display_map([row['user'] for row in export_rows])
            buffer = _build_report_pdf(
                title='Login Reward Transactions',
                subtitle='Daily/streak login rewards plus manually sent AUG Coins, combined into one ledger.',
                period_label=_period_label(period, start_date, end_date),
                stats=[('Total Coins Given', f'{reward_total + credit_total:,}'), ('Transactions', total_transactions), ('Recipients', len(recipient_ids))],
                columns=['Role', 'User ID', 'Name', 'Type', 'Coins', 'Date'],
                rows=[
                    [
                        self.ROLE_LABELS.get(row['user'].role, row['user'].role),
                        display_map.get(row['user'].id, {}).get('user_id_str') or row['user'].email,
                        display_map.get(row['user'].id, {}).get('name') or row['user'].email,
                        row['label'], f"{row['coins']:,}", row['date'].strftime('%d-%b-%Y'),
                    ] for row in export_rows
                ],
                total_rows=len(combined),
            )
            fname_role = role if role != 'all' else 'all-roles'
            return FileResponse(buffer, as_attachment=True, filename=f'login-reward-transactions-{fname_role}-{period}.pdf', content_type='application/pdf')

        start = (page - 1) * page_size
        page_rows = combined[start:start + page_size]
        display_map = _bulk_user_display_map([row['user'] for row in page_rows])

        return Response({
            'role': role,
            'period': period,
            'total_coins': reward_total + credit_total,
            'reward_coins': reward_total,
            'manual_coins': credit_total,
            'total_transactions': total_transactions,
            'total_recipients': len(recipient_ids),
            'page': page,
            'has_more': start + page_size < len(combined),
            'transactions': [
                {
                    'kind': row['kind'],
                    'role': row['user'].role,
                    'role_label': self.ROLE_LABELS.get(row['user'].role, row['user'].role),
                    'user_id': display_map.get(row['user'].id, {}).get('user_id_str'),
                    'name': display_map.get(row['user'].id, {}).get('name') or row['user'].email,
                    'phone': display_map.get(row['user'].id, {}).get('phone'),
                    'label': row['label'],
                    'coins': row['coins'],
                    'date': row['date'].isoformat(),
                } for row in page_rows
            ],
        })


# ── NEW: Retailer Promotion System ──
class RetailerPromotionListView(APIView):
    """
    Customers who have created sub-customers, whose sub-customers' total
    order value crossed ₹5L OR sub-customer count crossed 7 — eligible
    for Retailer promotion.
    """
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 500000          # ₹5 Lakh
    CUSTOMER_COUNT_THRESHOLD = 7

    # AFTER
    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)   # NEW: monthly window — target THIS MONTH mattum check pannanum

        creator_profiles = list(
            CustomerProfile.objects.filter(
                Q(user__role='customer', user__created_customers__isnull=False) |
                Q(retailer_status__in=['approved', 'rejected'])
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response({
                'results': [],
                'approved_count': CustomerProfile.objects.filter(retailer_status='approved').count(),
                'rejected_count': CustomerProfile.objects.filter(retailer_status='rejected').count(),
            })

        creator_ids = [cp.user_id for cp in creator_profiles]

        # ── NEW: fetch ALL customers ONE query, build a created_by → children map
        # for a recursive walk (A→B→C→D... any depth) ──
        all_customers = list(
            CustomerProfile.objects.all().values('user_id', 'created_by_id', 'created_at')
        )
        children_by_parent = {}
        for c in all_customers:
            children_by_parent.setdefault(c['created_by_id'], []).append(c)

        def collect_descendants(root_user_id):
            """BFS keezhe poi ella level layume customers-a collect pannum (loop-safe)."""
            collected, seen = [], set()
            queue = list(children_by_parent.get(root_user_id, []))
            while queue:
                node = queue.pop(0)
                uid = node['user_id']
                if uid in seen:
                    continue
                seen.add(uid)
                collected.append(node)
                queue.extend(children_by_parent.get(uid, []))
            return collected

        descendants_by_creator = {}
        all_relevant_user_ids = set(creator_ids)
        for creator_id in creator_ids:
            desc = collect_descendants(creator_id)
            descendants_by_creator[creator_id] = desc
            all_relevant_user_ids.update(d['user_id'] for d in desc)

        # NEW: order_totals mattum THIS MONTH-oda orders mattum vachu calculate pannurom —
        # target evlo achieve pannirukanga nu THIS MONTH mattum check pannanum, lifetime illa
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=list(all_relevant_user_ids), created_at__gte=month_start)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_customers = descendants_by_creator.get(creator_id, [])

            # NEW: total_customers ippo THIS MONTH create aana customers mattum count pannum
            total_customers = sum(1 for c in my_customers if c['created_at'] >= month_start)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = total_value >= self.SALES_THRESHOLD or total_customers >= self.CUSTOMER_COUNT_THRESHOLD
            if cp.retailer_status in ['approved', 'rejected']:
                pass
            elif not eligible and cp.retailer_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'customer_id': cp.customer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_value': float(total_value),
                'status': cp.retailer_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response({
            'results': results,
            'approved_count': CustomerProfile.objects.filter(retailer_status='approved').count(),
            'rejected_count': CustomerProfile.objects.filter(retailer_status='rejected').count(),
        })


class RetailerPromotionActionView(APIView):
    """Approve converts the customer into a real Promotor; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='customer')
            target_profile = target_user.customer_profile
        except (User.DoesNotExist, CustomerProfile.DoesNotExist):
            return Response({'error': 'Customer not found'}, status=404)

        if action == 'reject':
            target_profile.retailer_status = 'rejected'
            target_profile.save(update_fields=['retailer_status'])
            # ── NEW: rejection ah customer ku personal announcement ah anuppு ──
            Announcement.objects.create(
                title='Promotion Update',
                message=f"Sorry {target_profile.first_name}, you're not eligible for promotion at this time.",
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'promotor_profile'):
                return Response({'error': 'Already a promotor'}, status=400)

            promotor = PromotorProfile.objects.create(
                user=target_user,
                created_by=request.user,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            all_customers = list(CustomerProfile.objects.all().values('id', 'user_id', 'created_by_id'))
            children_by_parent = {}
            for c in all_customers:
                children_by_parent.setdefault(c['created_by_id'], []).append(c)

            def collect_descendant_ids(root_user_id):
                ids, seen = [], set()
                queue = list(children_by_parent.get(root_user_id, []))
                while queue:
                    node = queue.pop(0)
                    if node['id'] in seen:
                        continue
                    seen.add(node['id'])
                    ids.append(node['id'])
                    queue.extend(children_by_parent.get(node['user_id'], []))
                return ids

            descendant_ids = collect_descendant_ids(target_user.id)
            CustomerProfile.objects.filter(id__in=descendant_ids).update(assigned_promotor=promotor)

            target_profile.retailer_status = 'approved'
            target_profile.save(update_fields=['retailer_status'])

            target_user.role = 'promotor'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — customer promoted to Retailer'})

        return Response({'error': 'Invalid action'}, status=400)

    # ── Shared helper: recursive customer-chain collector (any depth A→B→C→D...→1000+) ──
def _recursive_customers_by_creator(creator_user_ids):
    """creator_user_ids = promotor user_ids who directly create customers.
    Returns dict: creator_user_id -> list of customer dicts {user_id, created_by_id, created_at}
    covering EVERY level of the downline chain, not just direct children."""
    all_customers = list(
        CustomerProfile.objects.all().values('user_id', 'created_by_id', 'created_at')
    )
    children_by_parent = {}
    for c in all_customers:
        children_by_parent.setdefault(c['created_by_id'], []).append(c)

    def collect_descendants(root_user_id):
        collected, seen = [], set()
        queue = list(children_by_parent.get(root_user_id, []))
        while queue:
            node = queue.pop(0)
            uid = node['user_id']
            if uid in seen:
                continue
            seen.add(uid)
            collected.append(node)
            queue.extend(children_by_parent.get(uid, []))
        return collected

    result = {}
    for cid in creator_user_ids:
        result[cid] = collect_descendants(cid)
    return result    

# ── NEW: Wholesale Dealer Promotion System (Promotor -> SubDealer) ──
class WholesaleDealerPromotionListView(APIView):
    """Promotors (Retailers) who built 20+ customers (any depth in downline chain)
    AND crossed ₹35 Lakh overall sales — eligible for Wholesale Dealer."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 3500000        # ₹35 Lakh
    CUSTOMER_THRESHOLD = 20

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)   # NEW: monthly window — target THIS MONTH mattum check pannanum

        creator_profiles = list(
            PromotorProfile.objects.filter(
                Q(user__role='promotor', user__created_customers__isnull=False) |
                Q(wholesale_status__in=['approved', 'rejected'])
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response({
                'results': [],
                'approved_count': PromotorProfile.objects.filter(wholesale_status='approved').count(),
                'rejected_count': PromotorProfile.objects.filter(wholesale_status='rejected').count(),
            })

        creator_ids = [cp.user_id for cp in creator_profiles]

        # ── NEW: recursive walk — ella level customer chain-um (A→B→C→D...) cover pannum ──
        customers_by_creator = _recursive_customers_by_creator(creator_ids)

        all_relevant_user_ids = list(creator_ids)
        for cid in creator_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_creator.get(cid, []))

        # NEW: order_totals mattum THIS MONTH-oda orders mattum vachu calculate pannurom
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids, created_at__gte=month_start)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_customers = customers_by_creator.get(creator_id, [])

            # NEW: total_customers ippo THIS MONTH create aana customers mattum count pannum
            total_customers = sum(1 for c in my_customers if c['created_at'] >= month_start)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = total_customers >= self.CUSTOMER_THRESHOLD and total_value >= self.SALES_THRESHOLD
            if cp.wholesale_status in ['approved', 'rejected']:
                pass
            elif not eligible and cp.wholesale_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'promotor_id': cp.promotor_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_value': float(total_value),
                'status': cp.wholesale_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response({
            'results': results,
            'approved_count': PromotorProfile.objects.filter(wholesale_status='approved').count(),
            'rejected_count': PromotorProfile.objects.filter(wholesale_status='rejected').count(),
        })


class WholesaleDealerPromotionActionView(APIView):
    """Approve converts the Promotor into a real SubDealer; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='promotor')
            target_profile = target_user.promotor_profile
        except (User.DoesNotExist, PromotorProfile.DoesNotExist):
            return Response({'error': 'Promotor not found'}, status=404)

        if action == 'reject':
            target_profile.wholesale_status = 'rejected'
            target_profile.save(update_fields=['wholesale_status'])
            Announcement.objects.create(
                title='Promotion Update',
                message=f"Sorry {target_profile.first_name}, you're not eligible for promotion at this time.",
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'sub_dealer_profile'):
                return Response({'error': 'Already a sub dealer'}, status=400)

            SubDealerProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,   # original parent preserve pannurom, tier roll-up ku
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.wholesale_status = 'approved'
            target_profile.save(update_fields=['wholesale_status'])

            target_user.role = 'sub_dealer'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Wholesale Dealer'})

        return Response({'error': 'Invalid action'}, status=400)


class DistributorPromotionListView(APIView):
    """SubDealers (Wholesale Dealers) who built 40+ customers (any depth) AND crossed
    ₹2.5 Crore overall sales — eligible for Distributor."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 25000000       # ₹2.5 Crore
    CUSTOMER_THRESHOLD = 40

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)   # NEW: monthly window — target THIS MONTH mattum check pannanum

        creator_profiles = list(
            SubDealerProfile.objects.filter(
                Q(user__role='sub_dealer', user__created_promotors__isnull=False) |
                Q(distributor_status__in=['approved', 'rejected'])
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response({
                'results': [],
                'approved_count': SubDealerProfile.objects.filter(distributor_status='approved').count(),
                'rejected_count': SubDealerProfile.objects.filter(distributor_status='rejected').count(),
            })

        creator_ids = [cp.user_id for cp in creator_profiles]

        wholesale_counts = dict(
            SubDealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
        )

        promotors = list(
            PromotorProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id', 'user_id')
        )
        promotors_by_creator = {}
        for p in promotors:
            promotors_by_creator.setdefault(p['created_by_id'], []).append(p['user_id'])
        all_promotor_ids = [p['user_id'] for p in promotors]

        # ── NEW: recursive walk — ella level customer chain-um cover pannum ──
        customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)

        all_relevant_user_ids = list(creator_ids) + list(all_promotor_ids)
        for pid in all_promotor_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_promotor.get(pid, []))

        # NEW: order_totals mattum THIS MONTH-oda orders mattum vachu calculate pannurom
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids, created_at__gte=month_start)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_promotor_ids = promotors_by_creator.get(creator_id, [])

            my_customers = []
            for pid in my_promotor_ids:
                my_customers.extend(customers_by_promotor.get(pid, []))

            total_wholesale_dealers = wholesale_counts.get(creator_id, 0)
            total_retailers = len(my_promotor_ids)
            # NEW: total_customers ippo THIS MONTH create aana customers mattum count pannum
            total_customers = sum(1 for c in my_customers if c['created_at'] >= month_start)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += sum(order_totals.get(pid, 0) or 0 for pid in my_promotor_ids)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = (
                total_customers >= self.CUSTOMER_THRESHOLD and
                total_value >= self.SALES_THRESHOLD
            )
            if cp.distributor_status in ['approved', 'rejected']:
                pass
            elif not eligible and cp.distributor_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'sub_dealer_id': cp.sub_dealer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_retailers': total_retailers,
                'total_wholesale_dealers': total_wholesale_dealers,
                'total_value': float(total_value),
                'status': cp.distributor_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response({
            'results': results,
            'approved_count': SubDealerProfile.objects.filter(distributor_status='approved').count(),
            'rejected_count': SubDealerProfile.objects.filter(distributor_status='rejected').count(),
        })

class DistributorPromotionActionView(APIView):
    """Approve converts the SubDealer into a real Dealer; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='sub_dealer')
            target_profile = target_user.sub_dealer_profile
        except (User.DoesNotExist, SubDealerProfile.DoesNotExist):
            return Response({'error': 'Sub dealer not found'}, status=404)

        if action == 'reject':
            target_profile.distributor_status = 'rejected'
            target_profile.save(update_fields=['distributor_status'])
            Announcement.objects.create(
                title='Promotion Update',
                message=f"Sorry {target_profile.first_name}, you're not eligible for promotion at this time.",
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'dealer_profile'):
                return Response({'error': 'Already a dealer'}, status=400)

            DealerProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.distributor_status = 'approved'
            target_profile.save(update_fields=['distributor_status'])

            target_user.role = 'dealer'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Distributor'})

        return Response({'error': 'Invalid action'}, status=400)


class SuperStockistPromotionListView(APIView):
    """Dealers (Distributors) who built 80+ customers (any depth), 20+ Retailers,
    10+ Wholesale Dealers, 5+ Distributors keezhе AND crossed ₹12 Crore overall —
    eligible for Super Stockist."""
    permission_classes = [IsAuthenticated]

    SALES_THRESHOLD = 120000000      # ₹12 Crore
    CUSTOMER_THRESHOLD = 80

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        today = timezone.now().date()
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)   # NEW: monthly window — target THIS MONTH mattum check pannanum

        creator_profiles = list(
            DealerProfile.objects.filter(
                Q(user__role='dealer', user__created_sub_dealers__isnull=False) |
                Q(super_stockist_status__in=['approved', 'rejected'])
            ).select_related('user').distinct()
        )
        if not creator_profiles:
            return Response({
                'results': [],
                'approved_count': DealerProfile.objects.filter(super_stockist_status='approved').count(),
                'rejected_count': DealerProfile.objects.filter(super_stockist_status='rejected').count(),
            })

        creator_ids = [cp.user_id for cp in creator_profiles]

        distributor_counts = dict(
            DealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id').annotate(c=Count('id')).values_list('created_by_id', 'c')
        )

        sub_dealers = list(
            SubDealerProfile.objects.filter(created_by_id__in=creator_ids)
            .values('created_by_id', 'user_id')
        )
        sub_dealers_by_creator = {}
        for sd in sub_dealers:
            sub_dealers_by_creator.setdefault(sd['created_by_id'], []).append(sd['user_id'])
        all_sub_dealer_ids = [sd['user_id'] for sd in sub_dealers]

        promotors = list(
            PromotorProfile.objects.filter(created_by_id__in=all_sub_dealer_ids)
            .values('created_by_id', 'user_id')
        )
        promotors_by_sub_dealer = {}
        for p in promotors:
            promotors_by_sub_dealer.setdefault(p['created_by_id'], []).append(p['user_id'])
        all_promotor_ids = [p['user_id'] for p in promotors]

        # ── NEW: recursive walk — ella level customer chain-um cover pannum ──
        customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)

        all_relevant_user_ids = list(creator_ids) + list(all_sub_dealer_ids) + list(all_promotor_ids)
        for pid in all_promotor_ids:
            all_relevant_user_ids.extend(c['user_id'] for c in customers_by_promotor.get(pid, []))

        # NEW: order_totals mattum THIS MONTH-oda orders mattum vachu calculate pannurom
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_relevant_user_ids, created_at__gte=month_start)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for cp in creator_profiles:
            creator_id = cp.user_id
            my_sub_dealer_ids = sub_dealers_by_creator.get(creator_id, [])

            my_promotor_ids = []
            for sdid in my_sub_dealer_ids:
                my_promotor_ids.extend(promotors_by_sub_dealer.get(sdid, []))

            my_customers = []
            for pid in my_promotor_ids:
                my_customers.extend(customers_by_promotor.get(pid, []))

            total_distributors = distributor_counts.get(creator_id, 0)
            total_wholesale_dealers = len(my_sub_dealer_ids)
            total_retailers = len(my_promotor_ids)
            # NEW: total_customers ippo THIS MONTH create aana customers mattum count pannum
            total_customers = sum(1 for c in my_customers if c['created_at'] >= month_start)
            today_customers = sum(1 for c in my_customers if c['created_at'].date() == today)

            total_value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            total_value += sum(order_totals.get(pid, 0) or 0 for pid in my_promotor_ids)
            total_value += sum(order_totals.get(sdid, 0) or 0 for sdid in my_sub_dealer_ids)
            total_value += order_totals.get(creator_id, 0) or 0

            eligible = (
                total_customers >= self.CUSTOMER_THRESHOLD and
                total_value >= self.SALES_THRESHOLD
            )
            if cp.super_stockist_status in ['approved', 'rejected']:
                pass
            elif not eligible and cp.super_stockist_status == 'none':
                continue

            results.append({
                'user_id': creator_id,
                'dealer_id': cp.dealer_id,
                'first_name': cp.first_name,
                'last_name': cp.last_name,
                'mobile_number': cp.mobile_number,
                'email': cp.user.email,
                'today_customers': today_customers,
                'total_customers': total_customers,
                'total_retailers': total_retailers,
                'total_wholesale_dealers': total_wholesale_dealers,
                'total_distributors': total_distributors,
                'total_value': float(total_value),
                'status': cp.super_stockist_status,
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response({
            'results': results,
            'approved_count': DealerProfile.objects.filter(super_stockist_status='approved').count(),
            'rejected_count': DealerProfile.objects.filter(super_stockist_status='rejected').count(),
        })

class SuperStockistPromotionActionView(APIView):
    """Approve converts the Dealer into a real Admin; reject just marks it."""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        action = request.data.get('action')
        try:
            target_user = User.objects.get(id=user_id, role='dealer')
            target_profile = target_user.dealer_profile
        except (User.DoesNotExist, DealerProfile.DoesNotExist):
            return Response({'error': 'Dealer not found'}, status=404)

        if action == 'reject':
            target_profile.super_stockist_status = 'rejected'
            target_profile.save(update_fields=['super_stockist_status'])
            Announcement.objects.create(
                title='Promotion Update',
                message=f"Sorry {target_profile.first_name}, you're not eligible for promotion at this time.",
                target_roles=[target_user.role],
                target_user=target_user,
                created_by=request.user,
            )
            return Response({'message': 'Rejected'})

        if action == 'approve':
            if hasattr(target_user, 'admin_profile'):
                return Response({'error': 'Already an admin'}, status=400)

            AdminProfile.objects.create(
                user=target_user,
                created_by=target_profile.created_by,
                initial=target_profile.initial,
                first_name=target_profile.first_name,
                last_name=target_profile.last_name,
                mobile_number=target_profile.mobile_number,
                gender=target_profile.gender,
                dob=target_profile.dob,
                married_status=target_profile.married_status,
                anniversary_date=target_profile.anniversary_date,
                door_no=target_profile.door_no,
                street_name=target_profile.street_name,
                town_name=target_profile.town_name,
                city_name=target_profile.city_name,
                district=target_profile.district,
                state=target_profile.state,
                aadhaar_no=target_profile.aadhaar_no,
                pan_no=target_profile.pan_no,
                occupation=target_profile.occupation,
                occupation_detail=target_profile.occupation_detail,
                annual_salary=target_profile.annual_salary,
            )

            target_profile.super_stockist_status = 'approved'
            target_profile.save(update_fields=['super_stockist_status'])

            target_user.role = 'admin'
            target_user.save(update_fields=['role'])

            return Response({'message': 'Approved — promoted to Super Stockist'})

        return Response({'error': 'Invalid action'}, status=400)

# ── NEW: Generic customer list for any promotion-node "Total Customers" click ──
class PromotionCustomerListView(APIView):
    """node_type = customer / promotor / sub_dealer / dealer
    user_id = that node's User id
    Returns the FULL recursive customer chain under that node with order stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        node_type = request.query_params.get('node_type')
        user_id = request.query_params.get('user_id')
        if not node_type or not user_id:
            return Response({'error': 'node_type and user_id required'}, status=400)

        try:
            user_id = int(user_id)
        except ValueError:
            return Response({'error': 'invalid user_id'}, status=400)

        # Step 1: figure out which promotor user_ids we need customer-chains for
        if node_type == 'customer':
            promotor_user_ids = None
        elif node_type == 'promotor':
            promotor_user_ids = [user_id]
        elif node_type == 'sub_dealer':
            promotor_user_ids = list(
                PromotorProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True)
            )
        elif node_type == 'dealer':
            sub_dealer_ids = list(
                SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True)
            )
            promotor_user_ids = list(
                PromotorProfile.objects.filter(created_by_id__in=sub_dealer_ids).values_list('user_id', flat=True)
            )
        else:
            return Response({'error': 'invalid node_type'}, status=400)

        # Step 2: recursive customer chain collect pannu (already built helper)
        if node_type == 'customer':
            customers_map = _recursive_customers_by_creator([user_id])
            customer_dicts = customers_map.get(user_id, [])
        else:
            customers_map = _recursive_customers_by_creator(promotor_user_ids)
            customer_dicts = []
            for pid in promotor_user_ids:
                customer_dicts.extend(customers_map.get(pid, []))

        customer_user_ids = [c['user_id'] for c in customer_dicts]

        # Step 3: full profile + order stats bulk-a edukurom
        profiles = list(
            CustomerProfile.objects.filter(user_id__in=customer_user_ids).select_related('user')
        )

        order_rows = (
            JewelryOrder.objects.filter(user_id__in=customer_user_ids)
            .values('user_id')
            .annotate(cnt=Count('id'), total=Sum('total_price'))
        )
       
        order_map = {r['user_id']: {'count': r['cnt'], 'value': float(r['total'] or 0)} for r in order_rows}

        order_filter = request.query_params.get('order_filter', 'all')   # ── NEW
        if order_filter == 'orders_only':
            profiles = [p for p in profiles if order_map.get(p.user_id, {}).get('count', 0) > 0]

        node_labels = {
            'customer': 'Retailer',      # customer promoted-to-Retailer nu paakkarom
            'promotor': 'Retailer',
            'sub_dealer': 'Wholesale Dealer',
            'dealer': 'Distributor',
        }
        own_orders_row = None

        own_order_row = (
            JewelryOrder.objects.filter(user_id=user_id)
            .aggregate(cnt=Count('id'), total=Sum('total_price'))
        )
        own_count = own_order_row['cnt'] or 0
        own_value = float(own_order_row['total'] or 0)

        if own_count > 0:
            try:
                node_user = User.objects.get(id=user_id)
                node_profile_map = {
                    'customer': 'customer_profile', 'promotor': 'promotor_profile',
                    'sub_dealer': 'sub_dealer_profile', 'dealer': 'dealer_profile',
                }
                node_id_field_map = {
                    'customer': 'customer_id', 'promotor': 'promotor_id',
                    'sub_dealer': 'sub_dealer_id', 'dealer': 'dealer_id',
                }
                node_profile = getattr(node_user, node_profile_map[node_type])
                own_orders_row = {
                    'position': node_labels.get(node_type, 'Self'),
                    'customer_id': getattr(node_profile, node_id_field_map[node_type], ''),
                    'name': f"{node_profile.first_name} {node_profile.last_name or ''}".strip(),
                    'email': node_user.email,
                    'phone': node_profile.mobile_number,
                    'order_count': own_count,
                    'total_value': own_value,
                }
            except Exception:
                own_orders_row = None

        profiles.sort(key=lambda p: order_map.get(p.user_id, {}).get('value', 0), reverse=True)

        results = []
        if own_orders_row:
            results.append(own_orders_row)   # ── retailer own row mudhalla varum ──

        for idx, p in enumerate(profiles, start=1):
            agg = order_map.get(p.user_id, {'count': 0, 'value': 0})
            results.append({
                'position': idx,
                'customer_id': p.customer_id,
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'email': p.user.email,
                'phone': p.mobile_number,
                'order_count': agg['count'],
                'total_value': agg['value'],
            })

        return Response(results)


# ── NEW: Retailer/Wholesale Dealer/Distributor node list (not customers) ──
class PromotionNodeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        node_type = request.query_params.get('node_type')
        list_type = request.query_params.get('list_type')
        user_id = request.query_params.get('user_id')
        if not node_type or not list_type or not user_id:
            return Response({'error': 'node_type, list_type and user_id required'}, status=400)
        try:
            user_id = int(user_id)
        except ValueError:
            return Response({'error': 'invalid user_id'}, status=400)

        if list_type == 'retailers':
            if node_type == 'sub_dealer':
                promotor_ids = list(PromotorProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            elif node_type == 'dealer':
                sd_ids = list(SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
                promotor_ids = list(PromotorProfile.objects.filter(created_by_id__in=sd_ids).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for retailers'}, status=400)
            profiles = list(PromotorProfile.objects.filter(user_id__in=promotor_ids).select_related('user'))
            id_field = 'promotor_id'

        elif list_type == 'wholesale_dealers':
            if node_type in ('sub_dealer', 'dealer'):
                sd_ids = list(SubDealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for wholesale_dealers'}, status=400)
            profiles = list(SubDealerProfile.objects.filter(user_id__in=sd_ids).select_related('user'))
            id_field = 'sub_dealer_id'

        elif list_type == 'distributors':
            if node_type in ('admin', 'dealer'):
                d_ids = list(DealerProfile.objects.filter(created_by_id=user_id).values_list('user_id', flat=True))
            else:
                return Response({'error': 'invalid node_type for distributors'}, status=400)
            profiles = list(DealerProfile.objects.filter(user_id__in=d_ids).select_related('user'))
            id_field = 'dealer_id'
        else:
            return Response({'error': 'invalid list_type'}, status=400)

        node_user_ids = [p.user_id for p in profiles]

        if list_type == 'retailers':
            customers_map = _recursive_customers_by_creator(node_user_ids)
        elif list_type == 'wholesale_dealers':
            promotors = list(PromotorProfile.objects.filter(created_by_id__in=node_user_ids).values('created_by_id', 'user_id'))
            promotors_by_sd = {}
            for p in promotors:
                promotors_by_sd.setdefault(p['created_by_id'], []).append(p['user_id'])
            all_promotor_ids = [p['user_id'] for p in promotors]
            customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)
            customers_map = {}
            for sd_id in node_user_ids:
                merged = []
                for pid in promotors_by_sd.get(sd_id, []):
                    merged.extend(customers_by_promotor.get(pid, []))
                customers_map[sd_id] = merged
        else:  # distributors
            sub_dealers = list(SubDealerProfile.objects.filter(created_by_id__in=node_user_ids).values('created_by_id', 'user_id'))
            sd_by_dealer = {}
            for sd in sub_dealers:
                sd_by_dealer.setdefault(sd['created_by_id'], []).append(sd['user_id'])
            all_sd_ids = [sd['user_id'] for sd in sub_dealers]
            promotors = list(PromotorProfile.objects.filter(created_by_id__in=all_sd_ids).values('created_by_id', 'user_id'))
            promotors_by_sd = {}
            for p in promotors:
                promotors_by_sd.setdefault(p['created_by_id'], []).append(p['user_id'])
            all_promotor_ids = [p['user_id'] for p in promotors]
            customers_by_promotor = _recursive_customers_by_creator(all_promotor_ids)
            customers_map = {}
            for d_id in node_user_ids:
                my_promotors = []
                for sdid in sd_by_dealer.get(d_id, []):
                    my_promotors.extend(promotors_by_sd.get(sdid, []))
                merged = []
                for pid in my_promotors:
                    merged.extend(customers_by_promotor.get(pid, []))
                customers_map[d_id] = merged

        all_customer_ids = list(set(
            [c['user_id'] for lst in customers_map.values() for c in lst] + node_user_ids
        ))
        order_totals = dict(
            JewelryOrder.objects.filter(user_id__in=all_customer_ids)
            .values('user_id').annotate(total=Sum('total_price')).values_list('user_id', 'total')
        )

        results = []
        for p in profiles:
            my_customers = customers_map.get(p.user_id, [])
            value = sum(order_totals.get(c['user_id'], 0) or 0 for c in my_customers)
            value += order_totals.get(p.user_id, 0) or 0
            results.append({
                'id_str': getattr(p, id_field, ''),
                'name': f"{p.first_name} {p.last_name or ''}".strip(),
                'email': p.user.email,
                'phone': p.mobile_number,
                'total_customers': len(my_customers),
                'total_value': float(value),
            })

        results.sort(key=lambda r: r['total_value'], reverse=True)
        return Response(results)        


# ── WALLET RECHARGE SYSTEM ──
COIN_RATE_PER_RUPEE = 100


def generate_transaction_id():
    """BB + YYMMDD + 6 random alphanumeric chars — example: BB260806A3F9K2"""
    date_part = timezone.now().strftime('%y%m%d')
    rand_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    txn_id = f'BB{date_part}{rand_part}'
    # ── Unique-a confirm pண்ணு, romba rare-a collision aana retry pண்ணு ──
    while CoinRecharge.objects.filter(transaction_id=txn_id).exists():
        rand_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        txn_id = f'BB{date_part}{rand_part}'
    return txn_id


class RechargeCreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Valid amount required'}, status=400)
        if amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=400)

        coins = int(amount * COIN_RATE_PER_RUPEE)

        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            razorpay_order = client.order.create({
                "amount": int(amount * 100),
                "currency": "INR",
                "payment_capture": 1,
            })
        except Exception as e:
            print(f"[RECHARGE ORDER] Razorpay order creation failed: {e}")
            return Response({'error': f'Unable to start payment: {str(e)}'}, status=502)

        recharge = CoinRecharge.objects.create(
            user=request.user,
            amount_paid=amount,
            coins_credited=coins,
            razorpay_order_id=razorpay_order['id'],
            status='pending',
        )

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'amount': amount,
            'currency': 'INR',
            'key': settings.RAZORPAY_KEY_ID,
            'recharge_id': recharge.id,
            'coins': coins,
        })


class RechargeVerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        try:
            recharge = CoinRecharge.objects.get(
                id=data.get('recharge_id'), user=request.user, status='pending'
            )
        except CoinRecharge.DoesNotExist:
            return Response({'error': 'Recharge not found'}, status=404)

        body = data['razorpay_order_id'] + "|" + data['razorpay_payment_id']
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
        ).hexdigest()

        if expected_sig != data.get('razorpay_signature'):
            recharge.status = 'failed'
            recharge.save(update_fields=['status'])
            return Response({'status': 'failed', 'msg': 'Invalid signature'}, status=400)

        # ── Razorpay payment fetch pannurom method (card/upi/netbanking/wallet) edukka ──
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        method = 'other'
        try:
            payment = client.payment.fetch(data['razorpay_payment_id'])
            raw_method = payment.get('method', 'other')
            method_map = {'card': 'card', 'upi': 'upi', 'netbanking': 'netbanking', 'wallet': 'wallet'}
            method = method_map.get(raw_method, 'other')
        except Exception:
            pass

        recharge.razorpay_payment_id = data['razorpay_payment_id']
        recharge.payment_method = method
        recharge.status = 'success'
        recharge.transaction_id = generate_transaction_id()   # ── NEW ──
        recharge.save(update_fields=['razorpay_payment_id', 'payment_method', 'status', 'transaction_id'])

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        wallet.balance_coins += recharge.coins_credited
        wallet.save(update_fields=['balance_coins'])

        return Response({
            'status': 'success',
            'coins_credited': recharge.coins_credited,
            'balance_coins': wallet.balance_coins,
        })

class RechargeHistoryView(APIView):
    """Full paginated recharge + commission history — GPay mari, Today/Month/6Month/Custom filter
    + page by page load pannurom (delete pannradhu illa)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = _recharge_period_queryset(request.user, period, start_date, end_date).select_related('related_order__user')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


class RechargeStatementView(APIView):
    """Selected filter (today/month/6month/custom) padi PDF statement generate pannum."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = _recharge_period_queryset(request.user, period, start_date, end_date)

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=30)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("BitByte Wallet — Recharge Statement", styles['Title']))
        elements.append(Paragraph(f"Customer: {request.user.email}", styles['Normal']))
        elements.append(Paragraph(
            f"Generated on: {timezone.now().strftime('%d %b %Y, %I:%M %p')}", styles['Normal']
        ))
        elements.append(Spacer(1, 14))

        data = [['Date', 'Amount Paid', 'Coins Credited', 'Method', 'Status']]
        total_amount = 0
        total_coins = 0
        for r in qs:
            data.append([
                r.created_at.strftime('%d %b %Y'),
                f"Rs. {r.amount_paid}",
                str(r.coins_credited),
                r.get_payment_method_display(),
                r.get_status_display(),
            ])
            total_amount += float(r.amount_paid)
            total_coins += r.coins_credited

        if len(data) == 1:
            data.append(['-', '-', '-', '-', '-'])

        table = Table(data, colWidths=[80, 90, 100, 90, 80])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#073B3F')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1DFDE')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F3F0')]),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 16))
        elements.append(Paragraph(f"<b>Total Spent:</b> Rs. {total_amount}", styles['Normal']))
        elements.append(Paragraph(f"<b>Total Coins Credited:</b> {total_coins}", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)

        filename = f"recharge-statement-{period}-{timezone.now().strftime('%Y%m%d')}.pdf"
        return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')


def _gem_icon(size=20, color=None):
    """A small vector diamond/gem mark — real vector shapes (not a raster emoji),
    so it stays crisp at any zoom, same spirit as an SVG icon."""
    color = color or colors.HexColor('#BB8958')
    d = Drawing(size, size)
    half = size / 2
    d.add(Polygon(points=[half, size, size, half * 0.62, half, 0, 0, half * 0.62], fillColor=color, strokeColor=None))
    d.add(Polygon(points=[half, size, size * 0.5, half * 0.62, half, size * 0.38], fillColor=colors.white, strokeColor=None, fillOpacity=0.22))
    return d


def _check_icon(size=12, color=None):
    """A small vector checkmark-in-circle badge, used next to the order status."""
    color = color or colors.HexColor('#16764F')
    d = Drawing(size, size)
    d.add(Circle(size / 2, size / 2, size / 2, fillColor=color, strokeColor=None))
    d.add(Line(size * 0.27, size * 0.52, size * 0.43, size * 0.67, strokeColor=colors.white, strokeWidth=1.6))
    d.add(Line(size * 0.43, size * 0.67, size * 0.75, size * 0.32, strokeColor=colors.white, strokeWidth=1.6))
    return d


def _inr_fmt(n):
    """Rs. amount with real Indian lakh/crore comma grouping (matches the
    frontend's toLocaleString('en-IN')) — used in the PDF reports below."""
    n = float(n or 0)
    neg = n < 0
    n = abs(n)
    whole = int(n)
    frac = round((n - whole) * 100)
    s = str(whole)
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        s = ','.join(parts) + ',' + last3
    return f"Rs. {'-' if neg else ''}{s}.{frac:02d}"


def _build_report_pdf(title, subtitle, period_label, stats, columns, rows, col_widths=None, total_rows=None):
    """Shared Athirai-branded PDF report builder — every 'Download Report'
    button across the 6 Payment pages (All Sales / Athirai Revenue / General
    Customer Revenue / Super Admin Commission / My Commission / Commissions)
    calls this, so they all look consistent and only need to hand over their
    own stats/columns/rows.
    stats: list of (label, value) tuples shown as summary boxes at the top.
    columns: list of column header strings. rows: list of row-value-lists.
    Body cells are wrapped in Paragraph so long names/IDs wrap onto a second
    line instead of overflowing into the next column (plain strings don't
    wrap — that overlap is what REPORT_MAX_ROWS below guards the cost of).
    Callers already slice their queryset to REPORT_MAX_ROWS before building
    `rows` (also avoids fetching profile data for rows that would just get
    discarded here) — pass the TRUE total via total_rows so the truncation
    note below is accurate."""
    truncated_by = max(0, (total_rows or len(rows)) - len(rows))
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=34, leftMargin=32, rightMargin=32)
    styles = getSampleStyleSheet()
    content_width = doc.width
    elements = []

    brand_style = ParagraphStyle('RBrand', parent=styles['Title'], textColor=colors.HexColor('#BB8958'),
                                  fontSize=20, leading=22, alignment=TA_CENTER, spaceAfter=0)
    tagline_style = ParagraphStyle('RTagline', parent=styles['Normal'], textColor=colors.HexColor('#E0F2F1'),
                                    fontSize=8.5, alignment=TA_CENTER, backColor=colors.HexColor('#073B3F'))
    title_style = ParagraphStyle('RTitle', parent=styles['Title'], textColor=colors.HexColor('#073B3F'),
                                  fontSize=15, alignment=TA_CENTER, spaceBefore=14, spaceAfter=2)
    subtitle_style = ParagraphStyle('RSubtitle', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                     fontSize=8.5, alignment=TA_CENTER, spaceAfter=2, leading=11)
    meta_style = ParagraphStyle('RMeta', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                 fontSize=8, alignment=TA_CENTER, spaceAfter=14)
    stat_label_style = ParagraphStyle('RStatLabel', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                       fontName='Helvetica-Bold', fontSize=7, alignment=TA_CENTER)
    stat_value_style = ParagraphStyle('RStatValue', parent=styles['Normal'], textColor=colors.HexColor('#073B3F'),
                                       fontName='Helvetica-Bold', fontSize=12, alignment=TA_CENTER, spaceBefore=3)
    note_style = ParagraphStyle('RNote', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                 fontSize=8, alignment=TA_CENTER, spaceBefore=10)
    cell_style = ParagraphStyle('RCell', parent=styles['Normal'], textColor=colors.HexColor('#111817'),
                                 fontName='Helvetica', fontSize=8, leading=10)
    head_style = ParagraphStyle('RHead', parent=styles['Normal'], textColor=colors.white,
                                 fontName='Helvetica-Bold', fontSize=8, leading=10)

    logo_path = settings.BASE_DIR / 'accounts' / 'assets' / 'athirai_logo.png'
    try:
        logo_mark = RLImage(str(logo_path), width=40, height=40)
    except Exception:
        logo_mark = _gem_icon(24)
    logo_col_w = 50
    brand_row = Table([[logo_mark, Paragraph('ATHIRAI', brand_style), '']],
                       colWidths=[logo_col_w, content_width - 2 * logo_col_w, logo_col_w])
    brand_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    brand_row.hAlign = 'CENTER'
    header_table = Table([[brand_row], [Paragraph('FINE JEWELLERY &bull; MANAGEMENT REPORT', tagline_style)]], colWidths=[content_width])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#073B3F')),
        ('TOPPADDING', (0, 0), (0, 0), 12), ('BOTTOMPADDING', (0, 0), (0, 0), 4),
        ('TOPPADDING', (0, 1), (0, 1), 0), ('BOTTOMPADDING', (0, 1), (0, 1), 12),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 14))

    elements.append(Paragraph(title, title_style))
    if subtitle:
        elements.append(Paragraph(subtitle, subtitle_style))
    elements.append(Paragraph(
        f"{period_label} &middot; Generated on {timezone.now().strftime('%d %b %Y, %I:%M %p')}", meta_style
    ))

    if stats:
        stat_cells = [[Paragraph(label.upper(), stat_label_style), Paragraph(str(value), stat_value_style)] for label, value in stats]
        stat_row = Table([stat_cells], colWidths=[content_width / len(stats)] * len(stats))
        stat_row.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F8F8')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#D1DFDE')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1DFDE')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(stat_row)
        elements.append(Spacer(1, 16))

    # ── Paragraph parses a small XML-like markup — un-escaped '&'/'<'/'>' in a
    # name/email (e.g. "R&B Jewellers") would otherwise crash PDF generation ──
    def _esc(v):
        return str(v).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    header_row = [Paragraph(_esc(c), head_style) for c in columns]
    body_rows = [[Paragraph(_esc(c), cell_style) for c in row] for row in rows] if rows else [[Paragraph('-', cell_style)] * len(columns)]
    table_data = [header_row] + body_rows
    col_count = len(columns)
    widths = col_widths or [content_width / col_count] * col_count
    table = Table(table_data, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#073B3F')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1DFDE')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAF9')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(table)

    if truncated_by > 0:
        elements.append(Paragraph(
            f'Showing the latest {len(rows):,} of {total_rows:,} rows — narrow the date range for a complete listing.',
            note_style
        ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


class GenericTablePDFView(APIView):
    """Turns whatever table a page ALREADY HAS on screen into a branded PDF —
    for pages whose data comes from a complex non-paginated tree endpoint
    (e.g. Promotion_sales_order_list.jsx, built from recursive hierarchy
    queries) that isn't worth re-implementing a second time server-side just
    for export. Frontend POSTs exactly the columns/rows it's rendering, so
    the PDF always matches what the admin is looking at."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['super_admin', 'admin']:
            return Response({'error': 'Permission denied'}, status=403)

        data = request.data
        title = str(data.get('title') or 'Report')[:120]
        subtitle = str(data.get('subtitle') or '')[:300]
        period_label = str(data.get('period_label') or '')[:120]
        columns = data.get('columns')
        rows = data.get('rows')
        stats = data.get('stats') or []

        if not isinstance(columns, list) or not columns or not isinstance(rows, list):
            return Response({'error': 'columns (non-empty list) and rows (list) are required'}, status=400)

        total_rows = len(rows)
        rows = rows[:REPORT_MAX_ROWS]
        stats_tuples = [(str(s.get('label', ''))[:60], str(s.get('value', ''))[:40]) for s in stats if isinstance(s, dict)][:6]

        buffer = _build_report_pdf(
            title=title, subtitle=subtitle, period_label=period_label,
            stats=stats_tuples, columns=[str(c)[:60] for c in columns], rows=rows,
            total_rows=total_rows,
        )
        safe_name = ''.join(c if c.isalnum() or c in '-_' else '-' for c in title.lower())[:60] or 'report'
        return FileResponse(buffer, as_attachment=True, filename=f'{safe_name}.pdf', content_type='application/pdf')


class OrderReceiptPDFView(APIView):
    """Athirai-branded PDF receipt for a single order — used by the 'Download Receipt'
    button on the order-confirmed screen and the order-history list."""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = JewelryOrder.objects.select_related('user', 'product').get(order_id=order_id)
        except JewelryOrder.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.user_id != request.user.id and request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30, bottomMargin=34, leftMargin=36, rightMargin=36)
        styles = getSampleStyleSheet()

        brand_style = ParagraphStyle('Brand', parent=styles['Title'], textColor=colors.HexColor('#BB8958'),
                                      fontSize=24, leading=26, alignment=TA_CENTER, spaceAfter=0)
        tagline_style = ParagraphStyle('Tagline', parent=styles['Normal'], textColor=colors.HexColor('#E0F2F1'),
                                        fontSize=9.5, alignment=TA_CENTER, backColor=colors.HexColor('#073B3F'))
        box_heading_style = ParagraphStyle('BoxHeading', parent=styles['Normal'], textColor=colors.HexColor('#073B3F'),
                                            fontName='Helvetica-Bold', fontSize=10.5, spaceAfter=10)
        label_style = ParagraphStyle('Label', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                      fontName='Helvetica-Bold', fontSize=7.5, spaceAfter=2)
        value_style = ParagraphStyle('Value', parent=styles['Normal'], textColor=colors.HexColor('#111817'),
                                      fontName='Helvetica-Bold', fontSize=10.5, spaceAfter=9, leading=13)
        status_value_style = ParagraphStyle('StatusValue', parent=value_style, textColor=colors.HexColor('#16764F'), spaceAfter=0)
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], textColor=colors.HexColor('#7A8987'),
                                       fontSize=8.5, alignment=TA_CENTER)

        content_width = doc.width  # everything below is sized off this so edges line up exactly
        elements = []

        # ── Price breakdown — reverse-engineered from the real, already-charged unit_price
        # (the historical truth) using the linked product's making-charge %, stone value and
        # its real discount (product.original_price vs product.price, set via the
        # "Discount (%)" field on Add New Product — see add_new_product.jsx's calcAll:
        # discount is applied to (base_metal + making_charge) ONLY — stone_value is added
        # afterwards, un-discounted — then 3% GST is applied on top of everything, and both
        # price fields already carry that same GST). Weight comes straight from the product record.
        qty = order.quantity or 1
        unit_price = float(order.unit_price or 0)
        making_pct = float(order.product.making_charge or 0) if order.product else 0
        net_weight = float(order.product.net_weight or 0) if order.product else 0
        stone_weight = float(order.product.stone_weight or 0) if order.product else 0
        stone_value = float(order.product.stone_value or 0) if order.product else 0
        die_charge_val = float(order.product.die_charge or 0) if order.product else 0
        is_bullion_order = bool(order.product) and order.product.category in ('coins', 'goldbars', 'silvercoins', 'silverbars')
        has_stone = stone_weight > 0 or stone_value > 0
        stone_rate = (stone_value / stone_weight) if stone_weight else 0.0
        # Die charge behaves exactly like stone_value in this reverse-engineering —
        # a flat, un-discounted amount added before GST — so it rides along in the
        # same "flat_addon" slot throughout, and gets its own receipt line below.
        flat_addon = stone_value + die_charge_val

        price_now = float(order.product.price or 0) if order.product else 0
        original_now = float(order.product.original_price or 0) if order.product else 0

        # Real discount %, computed on metal+making only — stone/die-charge is never
        # discounted, so it has to be stripped out (along with GST) from both current
        # price fields before comparing them, otherwise this would understate the true % off.
        metal_making_now = (original_now / 1.03) - flat_addon if original_now else 0.0
        metal_making_discounted_now = (price_now / 1.03) - flat_addon if price_now else 0.0
        discount_ratio = (
            (metal_making_now - metal_making_discounted_now) / metal_making_now
        ) if metal_making_now > 0 and metal_making_now > metal_making_discounted_now else 0.0

        # unit_price is the real, already-discounted + GST-inclusive amount that was charged,
        # stone+die-charge included. Strip GST and the flat addon first, undo the discount to
        # recover the pre-discount metal+making amount, then split base metal / making charge.
        pretax_unit = unit_price / 1.03
        metal_making_unit = pretax_unit - flat_addon
        pre_discount_metal_making = (metal_making_unit / (1 - discount_ratio)) if discount_ratio < 1 else metal_making_unit
        discount_unit = pre_discount_metal_making - metal_making_unit
        base_metal_unit = (pre_discount_metal_making / (1 + making_pct / 100.0)) if making_pct else pre_discount_metal_making
        making_unit = pre_discount_metal_making - base_metal_unit
        gst_unit = unit_price - pretax_unit
        base_metal_total = base_metal_unit * qty
        making_total = making_unit * qty
        gst_total = gst_unit * qty
        discount_total = discount_unit * qty
        stone_total = stone_value * qty
        die_charge_total = die_charge_val * qty
        total_weight = net_weight * qty

        receipt_id = 'BBRCT' + order.order_id[5:] if order.order_id.startswith('BBORD') else f'BBRCT-{order.id}'

        # ── Header band: real Athirai logo (falls back to the vector gem mark if the
        # asset is ever missing) + brand name, full content width ──
        logo_path = settings.BASE_DIR / 'accounts' / 'assets' / 'athirai_logo.png'
        try:
            logo_mark = RLImage(str(logo_path), width=56, height=56)
        except Exception:
            logo_mark = _gem_icon(32)
        # Logo sits in a left column matched by an equal-width invisible column on the
        # right, so the ATHIRAI text's own column is truly centered on the page — a plain
        # 2-column [logo, text] row looks off-center because the logo's width drags the
        # whole block (and the text inside it) to the right of center.
        logo_col_w = 64
        brand_row = Table([[logo_mark, Paragraph('ATHIRAI', brand_style), '']],
                           colWidths=[logo_col_w, content_width - 2 * logo_col_w, logo_col_w])
        brand_row.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        brand_row.hAlign = 'CENTER'

        header_table = Table([[brand_row], [Paragraph('FINE JEWELLERY &bull; ORDER RECEIPT', tagline_style)]],
                              colWidths=[content_width])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#073B3F')),
            ('TOPPADDING', (0, 0), (0, 0), 18),
            ('BOTTOMPADDING', (0, 0), (0, 0), 6),
            ('TOPPADDING', (0, 1), (0, 1), 0),
            ('BOTTOMPADDING', (0, 1), (0, 1), 18),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 18))

        # ── Order Information / Delivered To — two boxed columns, same total width as header ──
        status_row = Table([[_check_icon(11), Paragraph(order.get_status_display(), status_value_style)]], colWidths=[15, None])
        status_row.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        status_row.hAlign = 'LEFT'

        box_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F8F8')),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#D1DFDE')),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ])

        order_info_box = Table([[[
            Paragraph('ORDER INFORMATION', box_heading_style),
            Paragraph('ORDER ID', label_style), Paragraph(order.order_id, value_style),
            Paragraph('RECEIPT ID', label_style), Paragraph(receipt_id, value_style),
            Paragraph('ORDER DATE', label_style),
            Paragraph(order.created_at.strftime('%d %b %Y, %I:%M %p'), value_style),
            Paragraph('STATUS', label_style), status_row,
        ]]], colWidths=[content_width * 0.48])
        order_info_box.setStyle(box_style)

        address = f"{order.address_line1}, {order.address_line2}" if order.address_line2 else order.address_line1
        delivered_box = Table([[[
            Paragraph('DELIVERED TO', box_heading_style),
            Paragraph(order.customer_name, value_style),
            Paragraph(order.customer_phone, ParagraphStyle('Phone', parent=value_style, fontSize=9.5, fontName='Helvetica', spaceAfter=6)),
            Paragraph(f"{address}, {order.city}, {order.state} - {order.pincode}",
                      ParagraphStyle('Addr', parent=value_style, fontSize=9.5, fontName='Helvetica', leading=13, spaceAfter=0)),
        ]]], colWidths=[content_width * 0.48])
        delivered_box.setStyle(box_style)

        info_grid = Table([[order_info_box, '', delivered_box]], colWidths=[content_width * 0.48, content_width * 0.04, content_width * 0.48])
        info_grid.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(info_grid)
        elements.append(Spacer(1, 20))

        # ── Order Details — same full content width as everything above ──
        elements.append(Paragraph('ORDER DETAILS', box_heading_style))
        purity = f"{order.product_metal.upper()} {order.product_grade.upper()}".strip()
        weight_display = f"{net_weight:.3f} g" if net_weight else '—'
        data = [
            ['Product', 'Metal / Purity', 'Net Wt', 'Category', 'Qty', 'Unit Price', 'Amount'],
            [order.product_name, purity, weight_display, order.product_category.title(), str(order.quantity),
             f"Rs. {order.unit_price:,.2f}", f"Rs. {order.total_price:,.2f}"],
        ]
        col_fracs = [0.22, 0.14, 0.10, 0.13, 0.07, 0.16, 0.18]
        table = Table(data, colWidths=[content_width * f for f in col_fracs])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#073B3F')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1DFDE')),
            ('ALIGN', (2, 0), (4, -1), 'CENTER'),
            ('ALIGN', (5, 0), (6, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white]),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 4))

        # ── Price Breakdown — Base Metal + Making Charge + GST - Discount = Total.
        # Discount is real (see calc above) — derived from the product's own
        # original_price vs price, not invented.
        breakdown_label_style = ParagraphStyle('BreakdownLabel', parent=styles['Normal'],
                                                 textColor=colors.HexColor('#5C706E'), fontSize=9.5)
        breakdown_val_style = ParagraphStyle('BreakdownVal', parent=styles['Normal'],
                                              textColor=colors.HexColor('#111817'), fontSize=9.5,
                                              fontName='Helvetica-Bold', alignment=TA_RIGHT)
        discount_val_style = ParagraphStyle('DiscountVal', parent=breakdown_val_style, textColor=colors.HexColor('#C92035'))
        discount_label = f'Discount ({discount_ratio * 100:.0f}%)' if discount_ratio > 0 else 'Discount'
        discount_display = f"− Rs. {discount_total:,.2f}" if discount_total > 0 else "Rs. 0.00"
        # Narrower block (not full page width) hugging the right edge, same place the
        # TOTAL amount below sits — avoids a big empty gap between label and value.
        stone_sub_style = ParagraphStyle('StoneSub', parent=breakdown_label_style, fontSize=7.5, textColor=colors.HexColor('#9AA8A6'))
        summary_width = content_width * 0.62
        breakdown_rows = [
            [Paragraph('Base Metal Value', breakdown_label_style), Paragraph(f"Rs. {base_metal_total:,.2f}", breakdown_val_style)],
            [Paragraph(f"Making Charge ({making_pct:.0f}%)", breakdown_label_style), Paragraph(f"Rs. {making_total:,.2f}", breakdown_val_style)],
        ]
        # Stone Weight + Rate — only for products that actually carry a stone; plain
        # gold/silver pieces (no stone_weight/stone_value on the product) skip this row.
        # Deliberate two-line label (main line + small caption) instead of letting the
        # weight/rate detail wrap mid-word — keeps every row's rhythm clean and even.
        if has_stone:
            if stone_weight:
                stone_label_cell = [
                    Paragraph('Stone Value', breakdown_label_style),
                    Paragraph(f"{stone_weight:.3f} g @ Rs. {stone_rate:,.2f}/g", stone_sub_style),
                ]
            else:
                stone_label_cell = Paragraph('Stone Value', breakdown_label_style)
            breakdown_rows.append([stone_label_cell, Paragraph(f"Rs. {stone_total:,.2f}", breakdown_val_style)])
        # Die Charge — flat fabrication charge, Coins & Bars only (see calc above)
        if is_bullion_order and die_charge_total > 0:
            breakdown_rows.append([Paragraph('Die Charge', breakdown_label_style), Paragraph(f"Rs. {die_charge_total:,.2f}", breakdown_val_style)])
        breakdown_rows.append([Paragraph('GST (3%)', breakdown_label_style), Paragraph(f"Rs. {gst_total:,.2f}", breakdown_val_style)])
        breakdown_rows.append([Paragraph(discount_label, breakdown_label_style), Paragraph(discount_display, discount_val_style)])
        breakdown_rows.append([Paragraph('Payment Method', breakdown_label_style), Paragraph(order.get_payment_method_display(), breakdown_val_style)])
        breakdown_table = Table(breakdown_rows, colWidths=[summary_width * 0.6, summary_width * 0.4])
        breakdown_table.hAlign = 'RIGHT'
        breakdown_table.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 16), ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(breakdown_table)

        # ── Total bar — same full content width, shaded, bold, for emphasis ──
        total_table = Table([
            ['TOTAL AMOUNT PAID', f"Rs. {order.total_price:,.2f}"],
        ], colWidths=[content_width * 0.6, content_width * 0.4])
        total_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 16), ('RIGHTPADDING', (0, 0), (-1, -1), 16),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F8F8')),
            ('LINEABOVE', (0, 0), (-1, 0), 0.75, colors.HexColor('#D1DFDE')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 13),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#073B3F')),
        ]))
        elements.append(total_table)
        elements.append(Spacer(1, 22))

        # ── Trust badges — gold vector check-badge + label, three pills in a row ──
        badge_text_style = ParagraphStyle('BadgeText', parent=styles['Normal'], fontSize=8.5,
                                           fontName='Helvetica-Bold', textColor=colors.HexColor('#8A623D'))
        badge_labels = ['BIS Hallmarked', '100% Certified Jewellery', '100% Trust']
        badge_cells = []
        for label in badge_labels:
            pill = Table([[_check_icon(11, colors.HexColor('#BB8958')), Paragraph(label, badge_text_style)]],
                         colWidths=[15, None])
            pill.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            pill.hAlign = 'CENTER'
            badge_cells.append(pill)
        badges_row = Table([badge_cells], colWidths=[content_width / 3.0] * 3)
        badges_row.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#E1EBEA')),
        ]))
        elements.append(badges_row)
        elements.append(Spacer(1, 10))

        elements.append(Paragraph(
            'Thank you for shopping with Athirai. This is a computer-generated receipt.', footer_style,
        ))

        doc.build(elements)
        buffer.seek(0)

        filename = f"athirai-receipt-{order.order_id}.pdf"
        return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')


def _recharge_period_queryset(user, period, start_date=None, end_date=None):
    """Common filter logic — Today / Month / 6 Month / Custom date.
    WalletView, RechargeHistoryView, RechargeStatementView ella idhை than use pannum."""
    qs = CoinRecharge.objects.filter(user=user, status='success')
    today = timezone.now().date()

    if period == 'today':
        qs = qs.filter(created_at__date=today)
    elif period == 'month':
        month_start = today.replace(day=1)
        qs = qs.filter(created_at__date__gte=month_start, created_at__date__lte=today)
    elif period == '6month':
        six_months_ago = today - timedelta(days=180)
        qs = qs.filter(created_at__date__gte=six_months_ago, created_at__date__lte=today)
    elif period == 'custom' and start_date and end_date:
        qs = qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
    # period == 'all' — no date filter, everything

    return qs.order_by('-created_at')


def _serialize_coin_entry(r):
    """CoinRecharge row ah — recharge/commission/debit edhuvaanalum, frontend ku
    same shape la anuppum (Recharge.jsx already idha expect pannuthu)."""
    entry = {
        'id': r.id,
        'type': {'recharge': 'recharge', 'commission': 'commission', 'purchase': 'debit'}.get(r.source, r.source),
        'direction': r.entry_type,
        'amount_paid': float(r.amount_paid),
        'coins_credited': r.coins_credited,
        'payment_method': r.payment_method,
        'source': None,
        'level': r.commission_level,
        'order_id': r.related_order.order_id if r.related_order else None,
        'transaction_id': r.transaction_id,   # ── NEW ──
        'created_at': r.created_at,
    }
    if r.source == 'commission' and r.related_order:
        buyer = r.related_order.user
        entry['source'] = get_user_profile_id(buyer) or buyer.email
    elif r.source == 'admin_credit' and r.entry_type == 'credit':
        entry['source'] = get_user_profile_id(r.user) or r.user.email
    return entry


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        today = timezone.now().date()

        # ── NEW: ella entry um (recharge/commission/debit) ஒரே table, ஒரே query ──
        history = CoinRecharge.objects.filter(
            user=request.user, status='success'
        ).select_related('related_order__user').order_by('-created_at')[:5]

        # ── "Today Recharged" — actual money recharge mattum (commission/debit illa) ──
        today_agg = CoinRecharge.objects.filter(
            user=request.user, status='success', source='recharge', created_at__date=today
        ).aggregate(coins=Sum('coins_credited'), amount=Sum('amount_paid'))

        lifetime_agg = CoinRecharge.objects.filter(
            user=request.user, status='success', source='recharge'
        ).aggregate(
            coins=Sum('coins_credited'),
            amount=Sum('amount_paid'),
            count=Count('id'),
        )

        return Response({
            'balance_coins': wallet.balance_coins,
            'today_coins': today_agg['coins'] or 0,
            'today_amount': float(today_agg['amount'] or 0),
            'total_spent': float(lifetime_agg['amount'] or 0),
            'total_coins_purchased': lifetime_agg['coins'] or 0,
            'total_recharge_count': lifetime_agg['count'] or 0,
            'history': [_serialize_coin_entry(r) for r in history],
        })


class PayWithCoinsView(APIView):
    """Customer AUG Coin balance vachi jewelry order pண்ணும் view.
    Order amount ku thevayana coins balance la irundha mattum proceed aagும்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        product_id = data.get('product_id')
        total_price = Decimal(str(data.get('total_price', 0)))

        if total_price <= 0:
            return Response({'error': 'Invalid order amount'}, status=400)

        coins_needed = int(total_price * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance_coins < coins_needed:
            return Response({
                'error': 'Insufficient AUG coins',
                'balance_coins': wallet.balance_coins,
                'coins_needed': coins_needed,
            }, status=400)

        try:
            product = JewelryProduct.objects.get(id=product_id)
        except JewelryProduct.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        # ── NEW: Atomic stock check + reduce — wallet deduct panna munnadi ──
        from django.db.models import F
        quantity = int(data.get('quantity', 1))
        updated_rows = JewelryProduct.objects.filter(
            id=product_id, stock_quantity__gte=quantity
        ).update(stock_quantity=F('stock_quantity') - quantity)

        if not updated_rows:
            return Response({'error': f'Only limited stock left for {product.name}. Please reduce quantity.'}, status=400)

        product.refresh_from_db()
        if product.stock_quantity <= 0:
            product.is_active = False
            product.save(update_fields=['is_active'])

        product_image_url = data.get('product_image_url', '')
        if not product_image_url:
            first_img = product.images.first()
            if first_img:
                product_image_url = request.build_absolute_uri(first_img.image.url)

        order = JewelryOrder.objects.create(
            user=request.user,
            product=product,
            product_name=product.name,
            product_metal=product.metal,
            product_grade=product.grade or '',
            product_category=product.category,
            product_image_url=product_image_url,
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            pincode=data.get('pincode', ''),
            address_line1=data.get('address_line1', ''),
            address_line2=data.get('address_line2', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            quantity=int(data.get('quantity', 1)),
            unit_price=float(data.get('unit_price', 0)),
            total_price=float(total_price),
            payment_method='wallet',   # ── FIX: AUG Coin mூlam pay pண்ணினа, "wallet" nு correct-a store pண்ணு ──
            payment_status='paid',
            status='confirmed',
        )

        # ── Coins deduct pண்ணு ──
        wallet.balance_coins -= coins_needed
        wallet.save(update_fields=['balance_coins'])

        # ── NEW: debit entry — history la "DEBIT" ah kaamikkanum, adhே CoinRecharge table la ──
        try:
            CoinRecharge.objects.create(
                user=request.user, amount_paid=total_price, coins_credited=coins_needed,
                payment_method='purchase', status='success',
                entry_type='debit', source='purchase',
                related_order=order,
            )
        except Exception as e:
            print(f'❌ Debit log FAILED for {request.user.email}:', repr(e))

        # ── Commission distribute pண்ணு (FIX: oru தடவை mattum call pண்ணு, rendு தடவை illa) ──
        try:
            distribute_commission(order)
        except Exception as e:
            print('❌ distribute_commission FAILED:', repr(e))

        return Response({
            'status': 'success',
            'order_id': order.order_id,
            'coins_used': coins_needed,
            'balance_coins': wallet.balance_coins,
        })


def _apply_period_filter(qs, period, start_date, end_date, date_field='created_at'):
    """Today/Month/6Month/Year/Custom — ella report kum share pண்ணும் common filter."""
    today = timezone.now().date()
    f = f'{date_field}__date'

    if period == 'today':
        qs = qs.filter(**{f: today})
    elif period == 'week':
        start_of_week = today - timedelta(days=today.weekday())
        qs = qs.filter(**{f'{f}__gte': start_of_week, f'{f}__lte': today})
    elif period == 'month':
        month_start = today.replace(day=1)
        qs = qs.filter(**{f'{f}__gte': month_start, f'{f}__lte': today})
    elif period == '6month':
        six_months_ago = today - timedelta(days=180)
        qs = qs.filter(**{f'{f}__gte': six_months_ago, f'{f}__lte': today})
    elif period == 'year':
        year_start = today.replace(month=1, day=1)
        qs = qs.filter(**{f'{f}__gte': year_start, f'{f}__lte': today})
    elif period == 'custom' and start_date and end_date:
        qs = qs.filter(**{f'{f}__gte': start_date, f'{f}__lte': end_date})

    return qs


REPORT_MAX_ROWS = 1000   # PDF export row cap — see _bulk_profile_id_map's docstring for why


def _period_label(period, start_date, end_date):
    """Human-readable period text for the PDF report header."""
    labels = {'today': 'Today', 'week': 'This Week', 'month': 'This Month', '6month': 'Last 6 Months', 'year': 'This Year'}
    if period == 'custom' and start_date and end_date:
        return f'{start_date} to {end_date}'
    return labels.get(period, period.title())


class PaymentsSummaryView(APIView):
    """Super Admin ku mattum — dropdown vachi 3 views: All Sales / Super Admin
    Commission (balance) / My Commission (fixed 1%)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 15
        period = request.query_params.get('period', 'today')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        view = request.query_params.get('view', 'super_admin_commission')   # ── NEW: all_sales | super_admin_commission | my_commission
        # ── 'format' is DRF's reserved URL_FORMAT_OVERRIDE query param — format=csv
        # isn't a registered renderer, so DRF 404s before this view even runs.
        # Use a differently-named param instead. ──
        export_csv = request.query_params.get('export') == 'csv'

        if view == 'all_sales':
            # ── Full order value, commission edhுவும் illama ──
            base_qs = JewelryOrder.objects.all()
            period_qs = _apply_period_filter(base_qs, period, start_date, end_date)

            total_revenue = period_qs.aggregate(total=Sum('total_price'))['total'] or 0
            total_transactions = period_qs.count()

            # ── AUG Coins ku pay pண்ணின orders — PayWithCoinsView 'wallet' nu save pண்ணும், total_price rupee value, coins = rupee * COIN_RATE_PER_RUPEE ──
            wallet_paid_total = period_qs.filter(payment_method='wallet').aggregate(total=Sum('total_price'))['total'] or 0
            total_coins_sold = int(Decimal(str(wallet_paid_total)) * COIN_RATE_PER_RUPEE)

            payment_breakdown = [
                {'method': r['payment_method'], 'count': r['count'], 'total': float(r['total'] or 0)}
                for r in period_qs.values('payment_method').annotate(count=Count('id'), total=Sum('total_price')).order_by('-total')
            ]

            six_months_ago = timezone.now().date() - timedelta(days=180)
            trend_qs = (
                base_qs.filter(created_at__date__gte=six_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(revenue=Sum('total_price'))
                .order_by('month')
            )
            monthly_trend = [
                {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
                for t in trend_qs
            ]

            txn_qs = period_qs.select_related('user').order_by('-created_at')

            if export_csv:
                export_orders = list(txn_qs[:REPORT_MAX_ROWS])
                profile_map = _bulk_profile_id_map([o.user for o in export_orders])
                buffer = _build_report_pdf(
                    title='All Sales Report',
                    subtitle='Full order value across the entire platform — no commission or any deduction.',
                    period_label=_period_label(period, start_date, end_date),
                    stats=[('Total Order Value', _inr_fmt(total_revenue)), ('AUG Coins Used', f'{total_coins_sold:,}'), ('Transactions', total_transactions)],
                    columns=['Order ID', 'Buyer', 'Amount', 'Payment Method', 'Date'],
                    rows=[[o.order_id, profile_map.get(o.user_id) or o.user.email, _inr_fmt(o.total_price), o.payment_method, o.created_at.strftime('%d-%b-%Y %H:%M')] for o in export_orders],
                    total_rows=total_transactions,
                )
                return FileResponse(buffer, as_attachment=True, filename=f'all-sales-report-{period}.pdf', content_type='application/pdf')

            start = (page - 1) * page_size
            page_txns = txn_qs[start:start + page_size]

            return Response({
                'view': view,
                'period': period,
                'total_revenue': float(total_revenue),
                'total_coins_sold': total_coins_sold,
                'total_transactions': total_transactions,
                'monthly_trend': monthly_trend,
                'payment_breakdown': payment_breakdown,
                'page': page,
                'has_more': start + page_size < total_transactions,
                'transactions': [
                    {
                        'transaction_id': o.order_id,
                        'buyer': get_user_profile_id(o.user) or o.user.email,
                        'amount': float(o.total_price),
                        'coins': None,
                        'payment_method': o.payment_method,
                        'created_at': o.created_at,
                    } for o in page_txns
                ],
            })

        elif view == 'general_customer_revenue':
            # ── "General Customer" = CustomerProfile.created_by IS NULL — direct
            # /register signup, no referral link. Same definition as
            # GeneralCustomerListView. Buyer chain-ku creator edhуவும் illama
            # irukkura padiyаal, distribute_commission() ku empty chain — yarukkum
            # (Retailer/Dealer/etc) commission poogathu, Super Admin ku mattum
            # thaan (My Commission + Balance) pogும். Idhu 'All Sales' oda subset. ──
            base_qs = JewelryOrder.objects.filter(user__customer_profile__created_by__isnull=True)
            period_qs = _apply_period_filter(base_qs, period, start_date, end_date)

            total_revenue = period_qs.aggregate(total=Sum('total_price'))['total'] or 0
            total_transactions = period_qs.count()

            wallet_paid_total = period_qs.filter(payment_method='wallet').aggregate(total=Sum('total_price'))['total'] or 0
            total_coins_sold = int(Decimal(str(wallet_paid_total)) * COIN_RATE_PER_RUPEE)

            payment_breakdown = [
                {'method': r['payment_method'], 'count': r['count'], 'total': float(r['total'] or 0)}
                for r in period_qs.values('payment_method').annotate(count=Count('id'), total=Sum('total_price')).order_by('-total')
            ]

            six_months_ago = timezone.now().date() - timedelta(days=180)
            trend_qs = (
                base_qs.filter(created_at__date__gte=six_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(revenue=Sum('total_price'))
                .order_by('month')
            )
            monthly_trend = [
                {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
                for t in trend_qs
            ]

            txn_qs = period_qs.select_related('user').order_by('-created_at')

            if export_csv:
                export_orders = list(txn_qs[:REPORT_MAX_ROWS])
                profile_map = _bulk_profile_id_map([o.user for o in export_orders])
                buffer = _build_report_pdf(
                    title='General Customer Revenue Report',
                    subtitle='Orders from customers who signed up directly, with no referral — no chain commission on these.',
                    period_label=_period_label(period, start_date, end_date),
                    stats=[('General Customer Sales', _inr_fmt(total_revenue)), ('AUG Coins Used', f'{total_coins_sold:,}'), ('Transactions', total_transactions)],
                    columns=['Order ID', 'Buyer', 'Amount', 'Payment Method', 'Date'],
                    rows=[[o.order_id, profile_map.get(o.user_id) or o.user.email, _inr_fmt(o.total_price), o.payment_method, o.created_at.strftime('%d-%b-%Y %H:%M')] for o in export_orders],
                    total_rows=total_transactions,
                )
                return FileResponse(buffer, as_attachment=True, filename=f'general-customer-revenue-report-{period}.pdf', content_type='application/pdf')

            start = (page - 1) * page_size
            page_txns = txn_qs[start:start + page_size]

            return Response({
                'view': view,
                'period': period,
                'total_revenue': float(total_revenue),
                'total_coins_sold': total_coins_sold,
                'total_transactions': total_transactions,
                'monthly_trend': monthly_trend,
                'payment_breakdown': payment_breakdown,
                'page': page,
                'has_more': start + page_size < total_transactions,
                'transactions': [
                    {
                        'transaction_id': o.order_id,
                        'buyer': get_user_profile_id(o.user) or o.user.email,
                        'amount': float(o.total_price),
                        'coins': None,
                        'payment_method': o.payment_method,
                        'created_at': o.created_at,
                    } for o in page_txns
                ],
            })

        elif view == 'athirai_revenue':
            # ── Athirai's real net revenue — every order's value MINUS the 27%
            # commission pool (COMMISSION_POOL_PERCENT) that gets distributed up
            # the hierarchy chain + Super Admin. Company retains the other 73%. ──
            company_share_pct = Decimal('100') - COMMISSION_POOL_PERCENT
            base_qs = JewelryOrder.objects.all()
            period_qs = _apply_period_filter(base_qs, period, start_date, end_date)

            total_order_value = period_qs.aggregate(total=Sum('total_price'))['total'] or 0
            total_revenue = (Decimal(str(total_order_value)) * company_share_pct / Decimal('100')).quantize(Decimal('0.01'))
            total_transactions = period_qs.count()

            wallet_paid_total = period_qs.filter(payment_method='wallet').aggregate(total=Sum('total_price'))['total'] or 0
            total_coins_sold = int(Decimal(str(wallet_paid_total)) * COIN_RATE_PER_RUPEE)

            payment_breakdown = [
                {
                    'method': r['payment_method'], 'count': r['count'],
                    'total': float((Decimal(str(r['total'] or 0)) * company_share_pct / Decimal('100')).quantize(Decimal('0.01'))),
                }
                for r in period_qs.values('payment_method').annotate(count=Count('id'), total=Sum('total_price')).order_by('-total')
            ]

            six_months_ago = timezone.now().date() - timedelta(days=180)
            trend_qs = (
                base_qs.filter(created_at__date__gte=six_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(order_total=Sum('total_price'))
                .order_by('month')
            )
            monthly_trend = [
                {
                    'month': t['month'].strftime('%b %Y'),
                    'revenue': float((Decimal(str(t['order_total'])) * company_share_pct / Decimal('100')).quantize(Decimal('0.01'))),
                } for t in trend_qs
            ]

            txn_qs = period_qs.select_related('user').order_by('-created_at')

            if export_csv:
                export_orders = list(txn_qs[:REPORT_MAX_ROWS])
                profile_map = _bulk_profile_id_map([o.user for o in export_orders])
                buffer = _build_report_pdf(
                    title='Athirai Revenue Report',
                    subtitle='73% of every order value — Athirai’s real net revenue after the 27% commission pool.',
                    period_label=_period_label(period, start_date, end_date),
                    stats=[('Athirai Net Revenue (73%)', _inr_fmt(total_revenue)), ('AUG Coins Used', f'{total_coins_sold:,}'), ('Transactions', total_transactions)],
                    columns=['Order ID', 'Buyer', 'Order Total', 'Athirai Revenue', 'Payment Method', 'Date'],
                    rows=[
                        [o.order_id, profile_map.get(o.user_id) or o.user.email, _inr_fmt(o.total_price),
                         _inr_fmt((Decimal(str(o.total_price)) * company_share_pct / Decimal('100')).quantize(Decimal('0.01'))),
                         o.payment_method, o.created_at.strftime('%d-%b-%Y %H:%M')]
                        for o in export_orders
                    ],
                    total_rows=total_transactions,
                )
                return FileResponse(buffer, as_attachment=True, filename=f'athirai-revenue-report-{period}.pdf', content_type='application/pdf')

            start = (page - 1) * page_size
            page_txns = txn_qs[start:start + page_size]

            return Response({
                'view': view,
                'period': period,
                'total_revenue': float(total_revenue),
                'total_order_value': float(total_order_value),
                'total_coins_sold': total_coins_sold,
                'total_transactions': total_transactions,
                'monthly_trend': monthly_trend,
                'payment_breakdown': payment_breakdown,
                'page': page,
                'has_more': start + page_size < total_transactions,
                'transactions': [
                    {
                        'transaction_id': o.order_id,
                        'buyer': get_user_profile_id(o.user) or o.user.email,
                        'amount': float((Decimal(str(o.total_price)) * company_share_pct / Decimal('100')).quantize(Decimal('0.01'))),
                        'order_total': float(o.total_price),
                        'coins': None,
                        'payment_method': o.payment_method,
                        'created_at': o.created_at,
                    } for o in page_txns
                ],
            })

        elif view in ('super_admin_commission', 'my_commission'):
            level_filter = 0 if view == 'super_admin_commission' else -1
            base_qs = CoinRecharge.objects.filter(
                status='success', source='commission', commission_level=level_filter
            )
            period_qs = _apply_period_filter(base_qs, period, start_date, end_date)

            total_revenue = period_qs.aggregate(total=Sum('amount_paid'))['total'] or 0
            total_coins_sold = period_qs.aggregate(total=Sum('coins_credited'))['total'] or 0

            six_months_ago = timezone.now().date() - timedelta(days=180)
            trend_qs = (
                base_qs.filter(created_at__date__gte=six_months_ago)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(revenue=Sum('amount_paid'))
                .order_by('month')
            )
            monthly_trend = [
                {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
                for t in trend_qs
            ]

            txn_qs = period_qs.select_related('related_order__user').order_by('-created_at')
            total_transactions = txn_qs.count()

            if export_csv:
                fname = 'super-admin-commission-report' if view == 'super_admin_commission' else 'my-commission-report'
                report_title = 'Super Admin Commission Report' if view == 'super_admin_commission' else 'My Commission Report'
                report_note = (
                    'Leftover unallocated commission balance from the payout pool.'
                    if view == 'super_admin_commission' else
                    'Your own fixed 1% share, credited on every successful recharge.'
                )
                export_entries = list(txn_qs[:REPORT_MAX_ROWS])
                profile_map = _bulk_profile_id_map([r.related_order.user for r in export_entries if r.related_order])
                report_rows = []
                for r in export_entries:
                    pct = f"{round(float(r.amount_paid) / float(r.related_order.total_price) * 100, 2)}%" if r.related_order and r.related_order.total_price else '—'
                    report_rows.append([
                        r.related_order.order_id if r.related_order else (r.transaction_id or '—'),
                        profile_map.get(r.related_order.user_id) if r.related_order else '—',
                        _inr_fmt(r.amount_paid), f'{r.coins_credited:,}', pct, r.payment_method,
                        r.created_at.strftime('%d-%b-%Y %H:%M'),
                    ])
                buffer = _build_report_pdf(
                    title=report_title,
                    subtitle=report_note,
                    period_label=_period_label(period, start_date, end_date),
                    stats=[('Total', _inr_fmt(total_revenue)), ('AUG Coins Credited', f'{total_coins_sold:,}'), ('Transactions', total_transactions)],
                    columns=['Order ID', 'Buyer', 'Amount', 'Coins', '% of Order', 'Payment Method', 'Date'],
                    rows=report_rows,
                    total_rows=total_transactions,
                )
                return FileResponse(buffer, as_attachment=True, filename=f'{fname}-{period}.pdf', content_type='application/pdf')

            start = (page - 1) * page_size
            page_txns = txn_qs[start:start + page_size]

            return Response({
                'view': view,
                'period': period,
                'total_revenue': float(total_revenue),
                'total_coins_sold': total_coins_sold,
                'total_transactions': total_transactions,
                'monthly_trend': monthly_trend,
                'page': page,
                'has_more': start + page_size < total_transactions,
                'transactions': [
                    {
                        'transaction_id': r.related_order.order_id if r.related_order else (r.transaction_id or '—'),
                        'buyer': get_user_profile_id(r.related_order.user) if r.related_order else '—',
                        'amount': float(r.amount_paid),
                        'coins': r.coins_credited,
                        'payment_method': r.payment_method,
                        'created_at': r.created_at,
                        'percent': round(float(r.amount_paid) / float(r.related_order.total_price) * 100, 2) if r.related_order and r.related_order.total_price else None,
                    } for r in page_txns
                ],
            })

        # ── Legacy default (real Razorpay revenue) — old behavior fallback ──
        recharges_all = CoinRecharge.objects.filter(status='success', source='recharge')
        recharges_period = _apply_period_filter(recharges_all, period, start_date, end_date)

        total_revenue = recharges_period.aggregate(total=Sum('amount_paid'))['total'] or 0
        total_coins_sold = recharges_period.aggregate(total=Sum('coins_credited'))['total'] or 0

        six_months_ago = timezone.now().date() - timedelta(days=180)
        trend_qs = (
            recharges_all.filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('amount_paid'))
            .order_by('month')
        )
        monthly_trend = [
            {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
            for t in trend_qs
        ]

        txn_qs = recharges_period.select_related('user').order_by('-created_at')
        total_transactions = txn_qs.count()
        start = (page - 1) * page_size
        page_txns = txn_qs[start:start + page_size]

        return Response({
            'view': 'razorpay_revenue',
            'period': period,
            'total_revenue': float(total_revenue),
            'total_coins_sold': total_coins_sold,
            'total_transactions': total_transactions,
            'monthly_trend': monthly_trend,
            'page': page,
            'has_more': start + page_size < total_transactions,
            'transactions': [
                {
                    'transaction_id': r.transaction_id or r.razorpay_payment_id or '—',
                    'buyer': get_user_profile_id(r.user) or r.user.email,
                    'amount': float(r.amount_paid),
                    'coins': r.coins_credited,
                    'payment_method': r.payment_method,
                    'created_at': r.created_at,
                } for r in page_txns
            ],
        })


class TierCommissionView(APIView):
    """Super Admin ku mattum — 'Commissions' leaderboard page ku. Buyer oda
    upline chain la level>=1 (real, specific recipient irukura) commission
    rows-ah recipient's role vachi filter pண்ணி, andha tier full la yaru
    evlo commission earn pண்ணாங்கनு leaderboard ah kaаттும். commission_level
    is chain-relative (fixed role number ilai) — so role-ah filter panna
    recipient user oda .role thaan check pண்ணроம், level number ah illa."""
    permission_classes = [IsAuthenticated]

    PROFILE_MAP = {
        'admin': (AdminProfile, 'admin_id', 'Super Stockist'),
        'dealer': (DealerProfile, 'dealer_id', 'Distributor'),
        'sub_dealer': (SubDealerProfile, 'sub_dealer_id', 'Wholesale Dealer'),
        'promotor': (PromotorProfile, 'promotor_id', 'Retailer'),
        'customer': (CustomerProfile, 'customer_id', 'Customer'),
    }

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        role = request.query_params.get('role', 'admin')
        cfg = self.PROFILE_MAP.get(role)
        if not cfg:
            return Response({'error': 'invalid role'}, status=400)
        model, id_field, role_label = cfg

        period = request.query_params.get('period', 'today')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 15
        export_csv = request.query_params.get('export') == 'csv'
        user_id = request.query_params.get('user_id')

        base_qs = CoinRecharge.objects.filter(
            status='success', source='commission', commission_level__gte=1, user__role=role
        )

        # ── Drill-down: oru specific earner-oda individual commission history mattum ──
        if user_id:
            person_qs = _apply_period_filter(base_qs.filter(user_id=user_id), period, start_date, end_date)
            person_qs = person_qs.select_related('related_order__user').order_by('-created_at')
            total_person_txns = person_qs.count()
            start = (page - 1) * page_size
            page_txns = person_qs[start:start + page_size]
            p = model.objects.filter(user_id=user_id).first()
            return Response({
                'role': role,
                'user_id': int(user_id),
                'name': f"{p.first_name} {p.last_name or ''}".strip() if p else '',
                'id_value': getattr(p, id_field, None) if p else None,
                'page': page,
                'has_more': start + page_size < total_person_txns,
                'transactions': [
                    {
                        'order_id': r.related_order.order_id if r.related_order else (r.transaction_id or '—'),
                        'buyer': get_user_profile_id(r.related_order.user) if r.related_order else '—',
                        'level': r.commission_level,
                        'amount': float(r.amount_paid),
                        'coins': r.coins_credited,
                        'created_at': r.created_at,
                    } for r in page_txns
                ],
            })

        period_qs = _apply_period_filter(base_qs, period, start_date, end_date)

        total_commission = period_qs.aggregate(total=Sum('amount_paid'))['total'] or 0
        total_coins = period_qs.aggregate(total=Sum('coins_credited'))['total'] or 0
        total_transactions = period_qs.count()
        total_earners = period_qs.values('user_id').distinct().count()

        six_months_ago = timezone.now().date() - timedelta(days=180)
        trend_qs = (
            base_qs.filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('amount_paid'))
            .order_by('month')
        )
        monthly_trend = [
            {'month': t['month'].strftime('%b %Y'), 'revenue': float(t['revenue'])}
            for t in trend_qs
        ]

        leaderboard_rows = list(
            period_qs.values('user_id')
            .annotate(total_commission=Sum('amount_paid'), coins=Sum('coins_credited'), txn_count=Count('id'))
            .order_by('-total_commission')
        )
        profiles = {p.user_id: p for p in model.objects.filter(user_id__in=[r['user_id'] for r in leaderboard_rows])}

        leaderboard = []
        for r in leaderboard_rows:
            p = profiles.get(r['user_id'])
            leaderboard.append({
                'user_id': r['user_id'],
                id_field: getattr(p, id_field, None) if p else None,
                'first_name': p.first_name if p else '',
                'last_name': p.last_name if p else '',
                'city_name': getattr(p, 'city_name', None) if p else None,
                'mobile_number': p.mobile_number if p else None,
                'total_commission': float(r['total_commission'] or 0),
                'coins': r['coins'] or 0,
                'txn_count': r['txn_count'],
            })

        if export_csv:
            export_leaders = leaderboard[:REPORT_MAX_ROWS]
            buffer = _build_report_pdf(
                title=f'{role_label} Commission Leaderboard',
                subtitle=f"Every {role_label.lower()}'s commission earnings for the selected period, ranked highest first.",
                period_label=_period_label(period, start_date, end_date),
                stats=[('Total Commission', _inr_fmt(total_commission)), ('Coins Credited', f'{total_coins:,}'), ('Earners', total_earners), ('Transactions', total_transactions)],
                columns=['#', f'{role_label} ID', 'Name', 'City', 'Mobile', 'Txns', 'Commission'],
                rows=[
                    [i + 1, r[id_field] or '—', f"{r['first_name']} {r['last_name'] or ''}".strip(), r['city_name'] or '—', r['mobile_number'] or '—', r['txn_count'], _inr_fmt(r['total_commission'])]
                    for i, r in enumerate(export_leaders)
                ],
                total_rows=len(leaderboard),
            )
            return FileResponse(buffer, as_attachment=True, filename=f'{role}-commission-leaderboard-{period}.pdf', content_type='application/pdf')

        total_leaders = len(leaderboard)
        start = (page - 1) * page_size
        page_leaderboard = leaderboard[start:start + page_size]

        return Response({
            'role': role,
            'role_label': role_label,
            'period': period,
            'total_commission': float(total_commission),
            'total_coins': total_coins,
            'total_transactions': total_transactions,
            'total_earners': total_earners,
            'monthly_trend': monthly_trend,
            'leaderboard': page_leaderboard,
            'page': page,
            'has_more': start + page_size < total_leaders,
        })


def _find_user_by_public_id(public_id):
    """Customer/Promotor/SubDealer/Dealer/Admin ID (BBCUS20260001 mாதிri) vачி User + Profile
    rendும் return pண்ணும் — name/phone Profile model la than irukku, User model la illa."""
    lookups = [
        (CustomerProfile, 'customer_id'),
        (PromotorProfile, 'promotor_id'),
        (SubDealerProfile, 'sub_dealer_id'),
        (DealerProfile, 'dealer_id'),
        (AdminProfile, 'admin_id'),
    ]
    for model, field in lookups:
        try:
            profile = model.objects.select_related('user').get(**{field: public_id})
            return profile.user, profile
        except model.DoesNotExist:
            continue
        except Exception:
            continue
    return None, None


class UserLookupView(APIView):
    """Super Admin ID type pண்ணும்போது, andha person-oda details + recent history fetch pண்ணும்."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        public_id = request.query_params.get('id', '').strip()
        if not public_id:
            return Response({'error': 'ID required'}, status=400)

        target_user, profile = _find_user_by_public_id(public_id)
        if not target_user:
            return Response({'error': 'No user found with this ID'}, status=404)

        # ── Name/phone Profile model la irundhu than fetch pண்ணрадhு, User model la illa ──
        first = getattr(profile, 'first_name', '') or ''
        last = getattr(profile, 'last_name', '') or ''
        name = f'{first} {last}'.strip() or target_user.email
        phone = (
            getattr(profile, 'phone', '') or getattr(profile, 'phone_number', '')
            or getattr(profile, 'mobile', '') or getattr(profile, 'mobile_number', '') or '—'
        )

        wallet, _ = Wallet.objects.get_or_create(user=target_user)
        history = CoinRecharge.objects.filter(
            user=target_user, status='success'
        ).select_related('related_order__user').order_by('-created_at')[:5]

        return Response({
            'user_pk': target_user.id,
            'public_id': public_id,
            'name': name,
            'email': target_user.email,
            'phone': phone,
            'role': target_user.role,
            'balance_coins': wallet.balance_coins,
            'recent_history': [_serialize_coin_entry(r) for r in history],
        })


class SendCoinsView(APIView):
    """Super Admin directly ஒரு user ku coins credit pண்ணும் — commission chain
    touch pண்ணadhu, idhu manual admin gift. Super Admin ku unlimited coins —
    swanth balance edhume check/deduct pண்ணadhu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        data = request.data
        user_pk = data.get('user_pk')
        try:
            amount = Decimal(str(data.get('amount', 0)))
        except Exception:
            return Response({'error': 'Invalid amount'}, status=400)

        if amount <= 0:
            return Response({'error': 'Enter a valid amount'}, status=400)

        try:
            target_user = User.objects.get(id=user_pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        coins = int(amount * COIN_RATE_PER_RUPEE)
        txn_id = generate_transaction_id()

        # ── Target user wallet ku credit pண்ணு — Super Admin balance touch pண்ணadhu ──
        target_wallet, _ = Wallet.objects.get_or_create(user=target_user)
        target_wallet.balance_coins += coins
        target_wallet.save(update_fields=['balance_coins'])
        CoinRecharge.objects.create(
            user=target_user, amount_paid=amount, coins_credited=coins,
            payment_method='admin', status='success',
            entry_type='credit', source='admin_credit',
            transaction_id=txn_id,
        )

        return Response({
            'status': 'success',
            'transaction_id': txn_id,
            'coins_sent': coins,
            'balance_coins': target_wallet.balance_coins,
        })


class AdminUserHistoryView(APIView):
    """Super Admin ku — edho oru target user oda full coin transaction history,
    paginated + period filter kூட (Recharge.jsx Transaction History mாтிри)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        user_pk = request.query_params.get('user_pk')
        try:
            target_user = User.objects.get(id=user_pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = CoinRecharge.objects.filter(user=target_user, status='success', source='admin_credit')
        qs = _apply_period_filter(qs, period, start_date, end_date)
        qs = qs.select_related('related_order__user').order_by('-created_at')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


class AdminSentHistoryView(APIView):
    """Super Admin ku — ID edhுவும் search pண்ணாthapothு default-a kaamikkும் view.
    Ella users-ku-um naan (super admin) kudutha coins (admin_credit) mattum, paginated."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Not authorized'}, status=403)

        page = max(int(request.query_params.get('page', 1)), 1)
        page_size = 10
        period = request.query_params.get('period', 'all')

        qs = CoinRecharge.objects.filter(status='success', source='admin_credit').select_related('user')
        qs = _apply_period_filter(qs, period, None, None)
        qs = qs.order_by('-created_at')

        total = qs.count()
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'page': page,
            'total': total,
            'has_more': start + page_size < total,
            'items': [_serialize_coin_entry(r) for r in items],
        })


# ── AUTOPAY / RECURRING MANDATE SYSTEM ──

def _next_occurrence(day):
    """Given day-of-month, return the next date this month/next month it falls on."""
    from datetime import date
    import calendar
    today = timezone.now().date()
    last_day_this_month = calendar.monthrange(today.year, today.month)[1]
    safe_day = min(day, last_day_this_month)
    candidate = today.replace(day=safe_day)
    if candidate <= today:
        # move to next month
        if today.month == 12:
            ny, nm = today.year + 1, 1
        else:
            ny, nm = today.year, today.month + 1
        last_day_next_month = calendar.monthrange(ny, nm)[1]
        safe_day = min(day, last_day_next_month)
        candidate = date(ny, nm, safe_day)
    return candidate


class AutoPayCreateView(APIView):
    """Autopay ON pண்ண — Razorpay Plan + Subscription create pண்ணி, frontend-ku
    subscription_id anuppுவோம். User idha vechi Razorpay checkout-la UPI mandate authorize pண்ணுவாரு."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        frequency = request.data.get('frequency', 'monthly')
        recharge_day = request.data.get('recharge_day', 1)

        if frequency not in ('daily', 'monthly'):
            return Response({'error': 'frequency must be weekly or monthly'}, status=400)

        try:
            amount = float(amount)
            recharge_day = int(recharge_day)
        except (TypeError, ValueError):
            return Response({'error': 'Valid amount and recharge_day required'}, status=400)

        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=400)
        if frequency == 'monthly' and not (1 <= recharge_day <= 31):
            return Response({'error': 'Invalid day'}, status=400)

        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

            plan_interval = 7 if frequency == 'daily' else 1

            plan = client.plan.create({
                "period": frequency,
                "interval": plan_interval,
                "item": {
                    "name": f"BitByte Wallet Autopay Rs.{amount}",
                    "amount": int(amount * 100),
                    "currency": "INR",
                }
            })

            if frequency == 'daily':
                next_date = timezone.now().date() + timedelta(days=7)
            else:
                next_date = _next_occurrence(recharge_day)
            start_at = int(timezone.datetime.combine(next_date, timezone.datetime.min.time()).timestamp())

            subscription = client.subscription.create({
                "plan_id": plan['id'],
                "customer_notify": 1,
                "total_count": 120,
                "start_at": start_at,
                "notes": {"user_id": str(request.user.id)},
            })

            mandate, _ = AutoPayMandate.objects.update_or_create(
                user=request.user,
                defaults={
                    'amount': amount,
                    'frequency': frequency,
                    'recharge_day': recharge_day,
                    'razorpay_plan_id': plan['id'],
                    'razorpay_subscription_id': subscription['id'],
                    'status': 'created',
                    'is_active': False,
                    'next_charge_date': next_date,
                }
            )

            return Response({
                'subscription_id': subscription['id'],
                'key': settings.RAZORPAY_KEY_ID,
                'amount': amount,
                'mandate_id': mandate.id,
            }, status=201)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


class AutoPayConfirmView(APIView):
    """Frontend-la user UPI mandate authorize pண்ணி Razorpay handler success aana odane
    idha call pண்ணி status update pண்ணும்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subscription_id = request.data.get('razorpay_subscription_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        try:
            mandate = AutoPayMandate.objects.get(user=request.user, razorpay_subscription_id=subscription_id)
        except AutoPayMandate.DoesNotExist:
            return Response({'error': 'Mandate not found'}, status=404)

        body = payment_id + "|" + subscription_id
        expected_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
        ).hexdigest()
        if expected_sig != signature:
            return Response({'error': 'Invalid signature'}, status=400)

        mandate.status = 'active'
        mandate.is_active = True
        mandate.save(update_fields=['status', 'is_active'])

        return Response({'message': 'Autopay enabled successfully!', 'status': mandate.status})


class AutoPayStatusView(APIView):
    """Current user oda autopay mandate fetch pண்ணும் (button/modal state ku)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mandate = AutoPayMandate.objects.filter(user=request.user).first()
        if not mandate:
            return Response({'exists': False})
        return Response({'exists': True, **AutoPayMandateSerializer(mandate).data})


class AutoPayToggleView(APIView):
    """ON → resume pண்ணும். OFF → pause pண்ணும். Razorpay API mூலம்."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action')   # 'on' or 'off'
        try:
            mandate = AutoPayMandate.objects.get(user=request.user)
        except AutoPayMandate.DoesNotExist:
            return Response({'error': 'No autopay mandate found'}, status=404)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            if action == 'off':
                client.subscription.pause(mandate.razorpay_subscription_id)
                mandate.status = 'paused'
                mandate.is_active = False
            elif action == 'on':
                client.subscription.resume(mandate.razorpay_subscription_id)
                mandate.status = 'active'
                mandate.is_active = True
            else:
                return Response({'error': 'action must be on or off'}, status=400)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)

        mandate.save(update_fields=['status', 'is_active'])
        return Response({'message': f'Autopay turned {action}', 'status': mandate.status})


@api_view(['POST'])
@permission_classes([AllowAny])
def autopay_webhook(request):
    """Razorpay webhook — subscription.charged event vந்தா wallet ku coins credit pண்ணும்.
    Razorpay Dashboard la webhook URL: https://yourdomain.com/api/autopay/webhook/
    Event: subscription.charged"""
    payload = request.body
    signature = request.headers.get('X-Razorpay-Signature', '')

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        client.utility.verify_webhook_signature(
            payload.decode(), signature, settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception:
        return Response({'error': 'Invalid webhook signature'}, status=400)

    data = request.data
    event = data.get('event')

    # ── Human-readable mapping for Razorpay failure reasons ──
    FAILURE_REASON_MAP = {
        'insufficient_funds': 'Insufficient balance',
        'card_expired': 'Card expired',
        'authentication_failed': 'Authentication failed',
        'payment_cancelled': 'Payment cancelled',
        'bank_declined': 'Bank declined',
        'invalid_account': 'Invalid account details',
        'processing_error': 'Processing error',
    }

    if event == 'subscription.charged':
        sub_entity = data['payload']['subscription']['entity']
        payment_entity = data['payload']['payment']['entity']
        subscription_id = sub_entity['id']

        try:
            mandate = AutoPayMandate.objects.get(razorpay_subscription_id=subscription_id)
        except AutoPayMandate.DoesNotExist:
            return Response({'status': 'ignored'})

        amount = Decimal(payment_entity['amount']) / 100
        coins = int(amount * COIN_RATE_PER_RUPEE)

        wallet, _ = Wallet.objects.get_or_create(user=mandate.user)
        wallet.balance_coins += coins
        wallet.save(update_fields=['balance_coins'])

        CoinRecharge.objects.create(
            user=mandate.user, amount_paid=amount, coins_credited=coins,
            payment_method='upi', status='success',
            entry_type='credit', source='recharge',
            razorpay_payment_id=payment_entity['id'],
            transaction_id=generate_transaction_id(),
        )

        if mandate.frequency == 'daily':
            mandate.next_charge_date = timezone.now().date() + timedelta(days=7)
        else:
            mandate.next_charge_date = _next_occurrence(mandate.recharge_day)

        # ── NEW: record success ──
        mandate.last_charge_status = 'success'
        mandate.last_charge_date = timezone.now().date()
        mandate.last_charge_error = None
        mandate.save(update_fields=['next_charge_date', 'last_charge_status', 'last_charge_date', 'last_charge_error'])

    # ── NEW: handle failed charge ──
    elif event == 'subscription.payment.failed':
        payment_entity = data['payload']['payment']['entity']
        sub_entity = data['payload'].get('subscription', {}).get('entity', {})
        subscription_id = sub_entity.get('id') or payment_entity.get('subscription_id')

        try:
            mandate = AutoPayMandate.objects.get(razorpay_subscription_id=subscription_id)
        except AutoPayMandate.DoesNotExist:
            return Response({'status': 'ignored'})

        raw_reason = payment_entity.get('error_reason', 'processing_error')
        readable_reason = FAILURE_REASON_MAP.get(raw_reason, 'Payment failed')

        mandate.last_charge_status = 'failed'
        mandate.last_charge_date = timezone.now().date()
        mandate.last_charge_error = readable_reason
        mandate.save(update_fields=['last_charge_status', 'last_charge_date', 'last_charge_error'])

    return Response({'status': 'ok'})

class AutoPayMandateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({'error': 'Permission denied'}, status=403)
        mandates = AutoPayMandate.objects.select_related('user').order_by('-created_at')
        results = []
        for m in mandates:
            info = get_user_display_info(m.user)
            results.append({
                'customer_id': info['user_id_str'],
                'name': info['name'],
                'phone': info['phone'],
                'email': m.user.email,
                'amount': float(m.amount),
                'frequency': m.frequency,
                'recharge_day': m.recharge_day,
                'status': m.status,
                'is_active': m.is_active,
                'next_charge_date': m.next_charge_date,
                'last_charge_status': m.last_charge_status,
                'last_charge_date': m.last_charge_date,
                'last_charge_error': m.last_charge_error,
            })
        return Response(results)

class AffordableProductsView(APIView):
    """Customer wallet balance-oda budget-ku ulla products mattum return pannum"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        max_price_rupees = wallet.balance_coins / COIN_RATE_PER_RUPEE

        products = JewelryProduct.objects.filter(
            is_active=True,
            price__lte=max_price_rupees
        ).order_by('-price')

        results = []
        for p in products:
            first_image = p.images.first()
            results.append({
                'id': p.id,
                'name': p.name,
                'category': p.category,
                'metal': p.metal,
                'price': float(p.price) if p.price else 0,
                'original_price': float(p.original_price) if p.original_price else None,
                'image': first_image.image.url if first_image else None,
            })

        return Response({
            'wallet_coins': wallet.balance_coins,
            'max_affordable_price': round(max_price_rupees, 2),
            'products': results,
        })        

@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({'status': 'ok'})
