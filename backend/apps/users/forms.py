from django import forms
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from apps.users.enums import UserRole
from apps.users.models import User


class UserAdminCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=150, required=True)
    last_name = forms.CharField(max_length=150, required=True)
    role = forms.ChoiceField(
        choices=UserRole.choices,
        required=True,
        initial=UserRole.CUSTOMER,
    )
    is_staff = forms.BooleanField(required=False, initial=False)
    is_superuser = forms.BooleanField(required=False, initial=False)

    class Meta:
        model = User
        fields = (
            User.USERNAME_FIELD,
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_superuser",
        )

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get("is_superuser") and not cleaned_data.get("is_staff"):
            raise forms.ValidationError(
                "Superusers must have staff status enabled.",
            )
        return cleaned_data

    def save(self, commit=True) -> User:
        user = super().save(commit=False)
        user.email = User.objects.normalize_email(self.cleaned_data["email"])
        user.first_name = self.cleaned_data["first_name"].strip()
        user.last_name = self.cleaned_data["last_name"].strip()
        # role, is_staff, is_superuser are already mapped by ModelForm
        
        if commit:
            user.save()
            if hasattr(self, "save_m2m"):
                self.save_m2m()
        return user


class UserAdminChangeForm(UserChangeForm):
    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get("is_superuser") and not cleaned_data.get("is_staff"):
            raise forms.ValidationError(
                "Superusers must have staff status enabled.",
            )
        return cleaned_data

    class Meta:
        model = User
        fields = "__all__"
