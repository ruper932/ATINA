from django.contrib.auth.decorators import user_passes_test

def group_required(*group_names):
    def in_groups(user):
        return user.is_authenticated and user.groups.filter(name__in=group_names).exists()
    return user_passes_test(in_groups, login_url="login")