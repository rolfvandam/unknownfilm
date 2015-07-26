from django.db import models
from django.db import transaction

from ufilm.models import TITLE_TYPES

class Scrapable(models.Model):
    
    is_locked = models.BooleanField(default=False)
    code = models.CharField(
        max_length=20
    )
    title_type = models.CharField(
        max_length=5, 
        choices=TITLE_TYPES
    )

    class Meta:
        abstract = True

    def lock(self):
        self.update(is_locked=True)

    @classmethod
    @transaction.atomic
    def get_and_lock_from_top(cls, title_type):
        try:
            
            scrapable = cls.objects.select_for_update().filter(
                **cls.SCRAPABILITY_QUALIFIERS
            ).filter(
                title_type=title_type
            ).order_by('-id').first()

            if scrapable:
                cls.objects.filter(pk=scrapable.pk).update(is_locked=True)
                return scrapable
            else:
                return None

        except cls.DoesNotExist:

            return None

class Title(Scrapable):

    SCRAPABILITY_QUALIFIERS = {
        'is_locked': False
    }

class TitleList(Scrapable):

    SCRAPABILITY_QUALIFIERS = {
        'is_locked': False,
        'is_processed': False
    }


    is_processed = models.BooleanField(default=False)
    
