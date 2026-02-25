from rest_framework import serializers
from accounts.serializers import RegisterUserSerializer
from pharmacy.models import Pharmacy, PharmacyDocument


class PharmacyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyDocument
        fields = ['id', 'document', 'status', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'is_active', 'created_at', 'updated_at']


class RegisterPharmacySerializer(serializers.ModelSerializer):
    user = RegisterUserSerializer()
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)

    class Meta:
        model = Pharmacy
        fields = ["user", "lat", "lng"]

    # 🔹 Create pharmacy + document
    def create(self, validated_data):
        user_data = validated_data.pop("user")
        

        # Create user
        user_serializer = RegisterUserSerializer(data=user_data)
        user_serializer.is_valid(raise_exception=True)
        user = user_serializer.save()

        # Create pharmacy
        pharmacy = Pharmacy.objects.create(
            user=user,
            **validated_data
        )

        # Create pharmacy document
        PharmacyDocument.objects.create(
            pharmacy=pharmacy,
        )

        return pharmacy
    

class PharmacyRealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = "__all__"


class PharmacyProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing/editing pharmacy profile.
    Supports FormData for document and profile photo upload.
    """
    document = serializers.ImageField(write_only=True, required=False)
    profile_photo = serializers.ImageField(required=False)
    document_url = serializers.SerializerMethodField(read_only=True)
    document_status = serializers.SerializerMethodField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField(read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            'id', 'name', 'address', 'phone_number', 'lat', 'lng',
            'email', 'user_name', 
            'profile_photo', 'profile_photo_url',
            'document', 'document_url', 'document_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'user_name', 'created_at', 'updated_at']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None

    def get_document_url(self, obj):
        try:
            if obj.document and obj.document.document:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.document.document.url)
                return obj.document.document.url
        except PharmacyDocument.DoesNotExist:
            pass
        return None

    def get_document_status(self, obj):
        try:
            return obj.document.status
        except PharmacyDocument.DoesNotExist:
            return None

    def update(self, instance, validated_data):
        # Handle file uploads separately
        document_file = validated_data.pop('document', None)
        profile_photo_file = validated_data.pop('profile_photo', None)
        
        # Update pharmacy fields
        instance.name = validated_data.get('name', instance.name)
        instance.address = validated_data.get('address', instance.address)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.lat = validated_data.get('lat', instance.lat)
        instance.lng = validated_data.get('lng', instance.lng)
        
        # Update profile photo if provided
        if profile_photo_file:
            instance.profile_photo = profile_photo_file
        
        instance.save()

        # Update or create document if provided
        if document_file:
            pharmacy_doc, created = PharmacyDocument.objects.get_or_create(pharmacy=instance)
            pharmacy_doc.document = document_file
            pharmacy_doc.status = 'PENDING'  # Reset status when new document uploaded
            pharmacy_doc.save()

        return instance


class PharmacyProfileCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating pharmacy profile after user registration.
    """
    document = serializers.ImageField(required=False)
    profile_photo = serializers.ImageField(required=False)

    class Meta:
        model = Pharmacy
        fields = ['name', 'address', 'phone_number', 'lat', 'lng', 'document', 'profile_photo']

    def create(self, validated_data):
        document_file = validated_data.pop('document', None)
        profile_photo_file = validated_data.pop('profile_photo', None)
        user = self.context['request'].user

        # Add profile photo to validated data if provided
        if profile_photo_file:
            validated_data['profile_photo'] = profile_photo_file

        # Check if pharmacy already exists for this user
        pharmacy, created = Pharmacy.objects.get_or_create(
            user=user,
            defaults=validated_data
        )
        
        if not created:
            # Update existing pharmacy
            for key, value in validated_data.items():
                setattr(pharmacy, key, value)
            pharmacy.save()

        # Handle document
        if document_file:
            pharmacy_doc, doc_created = PharmacyDocument.objects.get_or_create(pharmacy=pharmacy)
            pharmacy_doc.document = document_file
            pharmacy_doc.status = 'PENDING'
            pharmacy_doc.save()

        return pharmacy